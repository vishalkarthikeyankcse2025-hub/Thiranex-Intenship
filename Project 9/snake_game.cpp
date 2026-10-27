#include <algorithm>
#include <chrono>
#include <cctype>
#include <deque>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <random>
#include <string>
#include <thread>

#ifdef _WIN32
#include <conio.h>
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#else
#include <sys/select.h>
#include <termios.h>
#include <unistd.h>
#endif

namespace {
constexpr int WIDTH = 24;
constexpr int HEIGHT = 16;
constexpr int START_SPEED_MS = 120;
constexpr int MIN_SPEED_MS = 55;

struct Point {
    int x;
    int y;

    bool operator==(const Point& other) const {
        return x == other.x && y == other.y;
    }
};

enum class Direction { Up, Down, Left, Right };
enum class GameOutcome { Lost, Won, Quit };

class TerminalSession {
public:
    TerminalSession() {
#ifdef _WIN32
        outputHandle_ = GetStdHandle(STD_OUTPUT_HANDLE);
        if (outputHandle_ != INVALID_HANDLE_VALUE &&
            GetConsoleMode(outputHandle_, &originalMode_)) {
            haveOriginalMode_ = true;
            SetConsoleMode(outputHandle_,
                           originalMode_ | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
        }
#else
        if (tcgetattr(STDIN_FILENO, &originalTermios_) == 0) {
            termios raw = originalTermios_;
            raw.c_lflag &= static_cast<tcflag_t>(~(ICANON | ECHO));
            raw.c_cc[VMIN] = 0;
            raw.c_cc[VTIME] = 0;
            if (tcsetattr(STDIN_FILENO, TCSANOW, &raw) == 0) {
                terminalConfigured_ = true;
            }
        }
#endif
        std::cout << "\x1b[?25l\x1b[2J\x1b[H" << std::flush;
    }

    ~TerminalSession() {
        std::cout << "\x1b[?25h\x1b[0m\n" << std::flush;
#ifdef _WIN32
        if (haveOriginalMode_) {
            SetConsoleMode(outputHandle_, originalMode_);
        }
#else
        if (terminalConfigured_) {
            tcsetattr(STDIN_FILENO, TCSANOW, &originalTermios_);
        }
#endif
    }

    TerminalSession(const TerminalSession&) = delete;
    TerminalSession& operator=(const TerminalSession&) = delete;

private:
#ifdef _WIN32
    HANDLE outputHandle_ = INVALID_HANDLE_VALUE;
    DWORD originalMode_ = 0;
    bool haveOriginalMode_ = false;
#else
    termios originalTermios_{};
    bool terminalConfigured_ = false;
#endif
};

char pollKey() {
#ifdef _WIN32
    if (!_kbhit()) {
        return '\0';
    }

    int ch = _getch();
    if (ch == 0 || ch == 224) {
        const int arrow = _getch();
        switch (arrow) {
            case 72: return 'w'; // Up arrow
            case 80: return 's'; // Down arrow
            case 75: return 'a'; // Left arrow
            case 77: return 'd'; // Right arrow
            default: return '\0';
        }
    }
    return static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
#else
    auto readOne = [](char& result, int timeoutMs) -> bool {
        fd_set set;
        FD_ZERO(&set);
        FD_SET(STDIN_FILENO, &set);
        timeval timeout{};
        timeout.tv_sec = timeoutMs / 1000;
        timeout.tv_usec = (timeoutMs % 1000) * 1000;
        const int ready = select(STDIN_FILENO + 1, &set, nullptr, nullptr, &timeout);
        return ready > 0 && read(STDIN_FILENO, &result, 1) == 1;
    };

    char ch = '\0';
    if (!readOne(ch, 0)) {
        return '\0';
    }

    // Decode common ANSI arrow-key sequences as well as WASD.
    if (ch == '\x1b') {
        char bracket = '\0';
        char arrow = '\0';
        if (readOne(bracket, 15) && bracket == '[' && readOne(arrow, 15)) {
            switch (arrow) {
                case 'A': return 'w';
                case 'B': return 's';
                case 'D': return 'a';
                case 'C': return 'd';
                default: return '\0';
            }
        }
        return '\0';
    }
    return static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
#endif
}

void setDirection(Direction& direction, char key) {
    if ((key == 'w' || key == 'k') && direction != Direction::Down) {
        direction = Direction::Up;
    } else if ((key == 's' || key == 'j') && direction != Direction::Up) {
        direction = Direction::Down;
    } else if ((key == 'a' || key == 'h') && direction != Direction::Right) {
        direction = Direction::Left;
    } else if ((key == 'd' || key == 'l') && direction != Direction::Left) {
        direction = Direction::Right;
    }
}

Point createFood(const std::deque<Point>& snake, std::mt19937& rng) {
    std::uniform_int_distribution<int> xDistribution(1, WIDTH);
    std::uniform_int_distribution<int> yDistribution(1, HEIGHT);

    while (true) {
        Point candidate{xDistribution(rng), yDistribution(rng)};
        if (std::find(snake.begin(), snake.end(), candidate) == snake.end()) {
            return candidate;
        }
    }
}

void printLine(const std::string& text = "") {
    constexpr int LINE_WIDTH = 64;
    std::cout << std::left << std::setw(LINE_WIDTH) << text << '\n';
}

void drawFrame(const std::deque<Point>& snake, const Point& food, int score,
               const std::string& message) {
    std::cout << "\x1b[H";
    printLine("SNAKE GAME - C++ CONSOLE EDITION");
    printLine();

    for (int y = 0; y <= HEIGHT + 1; ++y) {
        std::string row;
        row.reserve(WIDTH + 2);
        for (int x = 0; x <= WIDTH + 1; ++x) {
            const Point current{x, y};
            if (x == 0 || x == WIDTH + 1 || y == 0 || y == HEIGHT + 1) {
                row += '#';
            } else if (current == snake.front()) {
                row += '@';
            } else if (std::find(std::next(snake.begin()), snake.end(), current) != snake.end()) {
                row += 'o';
            } else if (current == food) {
                row += '*';
            } else {
                row += ' ';
            }
        }
        printLine(row);
    }

    printLine();
    printLine("Score: " + std::to_string(score));
    printLine("Move: W/A/S/D or arrow keys    |    Quit: Q");
    printLine(message);
    std::cout << std::flush;
}

GameOutcome playOneGame(std::mt19937& rng) {
    std::deque<Point> snake = {
        {WIDTH / 2, HEIGHT / 2},
        {WIDTH / 2 - 1, HEIGHT / 2},
        {WIDTH / 2 - 2, HEIGHT / 2}
    };
    Direction direction = Direction::Right;
    Point food = createFood(snake, rng);
    int score = 0;

    drawFrame(snake, food, score, "Eat * to grow. Avoid the wall and your tail!");

    while (true) {
        const int speedMs = std::max(MIN_SPEED_MS, START_SPEED_MS - (score / 10) * 4);
        const auto nextTick = std::chrono::steady_clock::now() +
                              std::chrono::milliseconds(speedMs);
        bool quitRequested = false;

        while (std::chrono::steady_clock::now() < nextTick) {
            char key = pollKey();
            while (key != '\0') {
                if (key == 'q') {
                    quitRequested = true;
                    break;
                }
                setDirection(direction, key);
                key = pollKey();
            }
            if (quitRequested) {
                return GameOutcome::Quit;
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(5));
        }

        Point newHead = snake.front();
        switch (direction) {
            case Direction::Up:    --newHead.y; break;
            case Direction::Down:  ++newHead.y; break;
            case Direction::Left:  --newHead.x; break;
            case Direction::Right: ++newHead.x; break;
        }

        const bool eating = (newHead == food);
        if (newHead.x < 1 || newHead.x > WIDTH ||
            newHead.y < 1 || newHead.y > HEIGHT) {
            drawFrame(snake, food, score, "GAME OVER! Press R to replay or Q to quit.");
            return GameOutcome::Lost;
        }

        // If not eating, the tail moves away this turn, so entering its old
        // square is allowed. Otherwise every segment is checked for collision.
        auto collisionEnd = snake.end();
        if (!eating) {
            --collisionEnd;
        }
        if (std::find(snake.begin(), collisionEnd, newHead) != collisionEnd) {
            drawFrame(snake, food, score, "GAME OVER! Press R to replay or Q to quit.");
            return GameOutcome::Lost;
        }

        snake.push_front(newHead);
        if (eating) {
            score += 10;
            if (static_cast<int>(snake.size()) == WIDTH * HEIGHT) {
                drawFrame(snake, food, score, "YOU WIN! Board filled. Press R to replay or Q to quit.");
                return GameOutcome::Won;
            }
            food = createFood(snake, rng);
        } else {
            snake.pop_back();
        }

        drawFrame(snake, food, score, "Eat * to grow. Avoid the wall and your tail!");
    }
}
} // namespace

int main() {
    TerminalSession terminal;
    std::random_device randomDevice;
    std::mt19937 rng(randomDevice());

    while (true) {
        const GameOutcome outcome = playOneGame(rng);
        if (outcome == GameOutcome::Quit) {
            break;
        }

        while (true) {
            const char key = pollKey();
            if (key == 'q') {
                std::cout << "\x1b[H";
                printLine("Thanks for playing Snake!");
                return 0;
            }
            if (key == 'r') {
                break;
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(20));
        }
    }

    std::cout << "\x1b[H";
    printLine("Thanks for playing Snake!");
    return 0;
}
