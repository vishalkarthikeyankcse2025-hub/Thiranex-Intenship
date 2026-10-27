#include <array>
#include <cctype>
#include <iostream>
#include <limits>
#include <string>

using Board = std::array<char, 9>;

void displayBoard(const Board& board) {
    std::cout << "\n";
    for (int row = 0; row < 3; ++row) {
        std::cout << " ";
        for (int col = 0; col < 3; ++col) {
            const int index = row * 3 + col;
            if (board[index] == 'X' || board[index] == 'O') {
                std::cout << board[index];
            } else {
                std::cout << (index + 1);
            }
            if (col < 2) std::cout << " | ";
        }
        std::cout << "\n";
        if (row < 2) std::cout << "---+---+---\n";
    }
    std::cout << "\n";
}

bool hasWon(const Board& board, char player) {
    constexpr int winningLines[8][3] = {
        {0, 1, 2}, {3, 4, 5}, {6, 7, 8}, // rows
        {0, 3, 6}, {1, 4, 7}, {2, 5, 8}, // columns
        {0, 4, 8}, {2, 4, 6}             // diagonals
    };

    for (const auto& line : winningLines) {
        if (board[line[0]] == player &&
            board[line[1]] == player &&
            board[line[2]] == player) {
            return true;
        }
    }
    return false;
}

bool isDraw(const Board& board) {
    for (char cell : board) {
        if (cell != 'X' && cell != 'O') return false;
    }
    return true;
}

int getMove(const Board& board, char player) {
    while (true) {
        std::cout << "Player " << player << ", choose a square (1-9): ";
        int choice;
        if (!(std::cin >> choice)) {
            if (std::cin.eof()) return -1;
            std::cout << "Invalid input. Enter a number from 1 to 9.\n";
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            continue;
        }

        if (choice < 1 || choice > 9) {
            std::cout << "That square is out of range. Choose 1-9.\n";
            continue;
        }

        const int index = choice - 1;
        if (board[index] == 'X' || board[index] == 'O') {
            std::cout << "That square is already occupied. Try another.\n";
            continue;
        }
        return index;
    }
}

bool playAgain() {
    while (true) {
        std::cout << "Play again? (y/n): ";
        char answer;
        if (!(std::cin >> answer)) return false;
        answer = static_cast<char>(std::tolower(static_cast<unsigned char>(answer)));
        if (answer == 'y') return true;
        if (answer == 'n') return false;
        std::cout << "Please enter y or n.\n";
    }
}

int main() {
    std::cout << "================================\n"
              << "        TIC-TAC-TOE\n"
              << "================================\n"
              << "Two-player console game\n"
              << "Player X goes first.\n"
              << "Choose squares using the numbers shown on the board.\n";

    do {
        Board board{};
        board.fill(' ');
        char currentPlayer = 'X';
        bool gameFinished = false;

        while (!gameFinished) {
            displayBoard(board);
            const int move = getMove(board, currentPlayer);
            if (move < 0) {
                std::cout << "\nInput closed. Exiting the game.\n";
                return 0;
            }

            board[move] = currentPlayer;
            if (hasWon(board, currentPlayer)) {
                displayBoard(board);
                std::cout << "Congratulations! Player " << currentPlayer << " wins!\n";
                gameFinished = true;
            } else if (isDraw(board)) {
                displayBoard(board);
                std::cout << "It's a draw!\n";
                gameFinished = true;
            } else {
                currentPlayer = (currentPlayer == 'X') ? 'O' : 'X';
            }
        }
    } while (playAgain());

    std::cout << "Thanks for playing Tic-Tac-Toe!\n";
    return 0;
}
