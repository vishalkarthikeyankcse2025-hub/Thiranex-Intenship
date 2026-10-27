#include <algorithm>
#include <cctype>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

struct Book {
    int id{};
    string title;
    string author;
    int totalCopies{};
    int availableCopies{};
};

struct Member {
    int id{};
    string name;
    string phone;
};

struct Loan {
    int id{};
    int bookId{};
    int memberId{};
    bool returned{};
};

class LibraryManagementSystem {
private:
    vector<Book> books;
    vector<Member> members;
    vector<Loan> loans;

    const string booksFile = "books.txt";
    const string membersFile = "members.txt";
    const string loansFile = "loans.txt";

    static string toLower(string value) {
        transform(value.begin(), value.end(), value.begin(), [](unsigned char c) {
            return static_cast<char>(tolower(c));
        });
        return value;
    }

    static string readNonEmptyLine(const string& prompt) {
        while (true) {
            cout << prompt;
            string value;
            getline(cin, value);
            if (!cin) {
                cout << "\nInput ended. Exiting safely.\n";
                exit(0);
            }
            if (value.find_first_not_of(" \t\r\n") != string::npos) {
                return value;
            }
            cout << "Input cannot be empty. Please try again.\n";
        }
    }

    static int readInt(const string& prompt, int minValue, int maxValue) {
        while (true) {
            cout << prompt;
            string line;
            getline(cin, line);
            if (!cin) {
                cout << "\nInput ended. Exiting safely.\n";
                exit(0);
            }

            stringstream stream(line);
            int value;
            char extra;
            if ((stream >> value) && !(stream >> extra) && value >= minValue && value <= maxValue) {
                return value;
            }
            cout << "Please enter a whole number between " << minValue
                 << " and " << maxValue << ".\n";
        }
    }

    Book* findBook(int id) {
        for (auto& book : books) {
            if (book.id == id) return &book;
        }
        return nullptr;
    }

    const Book* findBook(int id) const {
        for (const auto& book : books) {
            if (book.id == id) return &book;
        }
        return nullptr;
    }

    const Member* findMember(int id) const {
        for (const auto& member : members) {
            if (member.id == id) return &member;
        }
        return nullptr;
    }

    void loadData() {
        {
            ifstream file(booksFile);
            Book book;
            while (file >> book.id >> quoted(book.title) >> quoted(book.author)
                        >> book.totalCopies >> book.availableCopies) {
                if (book.id > 0 && book.totalCopies > 0 && book.availableCopies >= 0 &&
                    book.availableCopies <= book.totalCopies) {
                    books.push_back(book);
                }
            }
        }
        {
            ifstream file(membersFile);
            Member member;
            while (file >> member.id >> quoted(member.name) >> quoted(member.phone)) {
                if (member.id > 0) members.push_back(member);
            }
        }
        {
            ifstream file(loansFile);
            Loan loan;
            int returnedValue;
            while (file >> loan.id >> loan.bookId >> loan.memberId >> returnedValue) {
                if (loan.id > 0 && (returnedValue == 0 || returnedValue == 1)) {
                    loan.returned = (returnedValue == 1);
                    loans.push_back(loan);
                }
            }
        }
    }

    bool saveBooks() const {
        ofstream file(booksFile, ios::trunc);
        if (!file) return false;
        for (const auto& book : books) {
            file << book.id << ' ' << quoted(book.title) << ' ' << quoted(book.author) << ' '
                 << book.totalCopies << ' ' << book.availableCopies << '\n';
        }
        return static_cast<bool>(file);
    }

    bool saveMembers() const {
        ofstream file(membersFile, ios::trunc);
        if (!file) return false;
        for (const auto& member : members) {
            file << member.id << ' ' << quoted(member.name) << ' ' << quoted(member.phone) << '\n';
        }
        return static_cast<bool>(file);
    }

    bool saveLoans() const {
        ofstream file(loansFile, ios::trunc);
        if (!file) return false;
        for (const auto& loan : loans) {
            file << loan.id << ' ' << loan.bookId << ' ' << loan.memberId << ' '
                 << (loan.returned ? 1 : 0) << '\n';
        }
        return static_cast<bool>(file);
    }

    int nextBookId() const {
        int next = 1;
        for (const auto& book : books) next = max(next, book.id + 1);
        return next;
    }

    int nextMemberId() const {
        int next = 1;
        for (const auto& member : members) next = max(next, member.id + 1);
        return next;
    }

    int nextLoanId() const {
        int next = 1;
        for (const auto& loan : loans) next = max(next, loan.id + 1);
        return next;
    }

    void printBook(const Book& book) const {
        cout << left << setw(8) << book.id
             << setw(30) << book.title.substr(0, 28)
             << setw(25) << book.author.substr(0, 23)
             << setw(12) << book.totalCopies
             << book.availableCopies << '\n';
    }

    void printBooksHeader() const {
        cout << left << setw(8) << "Book ID" << setw(30) << "Title"
             << setw(25) << "Author" << setw(12) << "Total" << "Available\n";
        cout << string(87, '-') << '\n';
    }

    void addBook() {
        cout << "\n--- Add Book ---\n";
        Book book;
        book.id = nextBookId();
        book.title = readNonEmptyLine("Enter book title: ");
        book.author = readNonEmptyLine("Enter author name: ");
        book.totalCopies = readInt("Enter number of copies (1-10000): ", 1, 10000);
        book.availableCopies = book.totalCopies;
        books.push_back(book);

        if (saveBooks()) {
            cout << "Book added successfully. Book ID: " << book.id << "\n";
        } else {
            cout << "Error: Could not save books to " << booksFile << ".\n";
        }
    }

    void registerMember() {
        cout << "\n--- Register Member ---\n";
        Member member;
        member.id = nextMemberId();
        member.name = readNonEmptyLine("Enter member name: ");
        member.phone = readNonEmptyLine("Enter phone/contact: ");
        members.push_back(member);

        if (saveMembers()) {
            cout << "Member registered successfully. Member ID: " << member.id << "\n";
        } else {
            cout << "Error: Could not save members to " << membersFile << ".\n";
        }
    }

    void displayBooks() const {
        cout << "\n--- Books in Library ---\n";
        if (books.empty()) {
            cout << "No books have been added yet.\n";
            return;
        }
        printBooksHeader();
        for (const auto& book : books) printBook(book);
    }

    void displayMembers() const {
        cout << "\n--- Registered Members ---\n";
        if (members.empty()) {
            cout << "No members have been registered yet.\n";
            return;
        }
        cout << left << setw(12) << "Member ID" << setw(30) << "Name" << "Phone/Contact\n";
        cout << string(65, '-') << '\n';
        for (const auto& member : members) {
            cout << left << setw(12) << member.id << setw(30) << member.name.substr(0, 28)
                 << member.phone << '\n';
        }
    }

    void searchBooks() const {
        cout << "\n--- Search Books ---\n";
        cout << "1. Search by title\n2. Search by author\n";
        const int choice = readInt("Choose search type (1-2): ", 1, 2);
        const string term = toLower(readNonEmptyLine("Enter search text: "));
        bool found = false;

        for (const auto& book : books) {
            const string field = toLower(choice == 1 ? book.title : book.author);
            if (field.find(term) != string::npos) {
                if (!found) printBooksHeader();
                printBook(book);
                found = true;
            }
        }
        if (!found) cout << "No matching books found.\n";
    }

    void issueBook() {
        cout << "\n--- Issue Book ---\n";
        if (books.empty() || members.empty()) {
            cout << "Please add at least one book and register at least one member first.\n";
            return;
        }
        const int bookId = readInt("Enter book ID: ", 1, numeric_limits<int>::max());
        Book* book = findBook(bookId);
        if (!book) {
            cout << "Book ID not found.\n";
            return;
        }
        if (book->availableCopies <= 0) {
            cout << "No copies of this book are currently available.\n";
            return;
        }

        const int memberId = readInt("Enter member ID: ", 1, numeric_limits<int>::max());
        const Member* member = findMember(memberId);
        if (!member) {
            cout << "Member ID not found.\n";
            return;
        }

        Loan loan{nextLoanId(), bookId, memberId, false};
        --book->availableCopies;
        loans.push_back(loan);
        const bool saved = saveBooks() && saveLoans();
        if (saved) {
            cout << "Book issued successfully. Loan ID: " << loan.id
                 << " | Book: " << book->title << " | Member: " << member->name << "\n";
        } else {
            cout << "Error: Could not save all issue records. Check file permissions.\n";
        }
    }

    void returnBook() {
        cout << "\n--- Return Book ---\n";
        bool hasActiveLoans = false;
        for (const auto& loan : loans) {
            if (!loan.returned) {
                hasActiveLoans = true;
                break;
            }
        }
        if (!hasActiveLoans) {
            cout << "There are no books currently on loan.\n";
            return;
        }

        const int loanId = readInt("Enter loan ID to return: ", 1, numeric_limits<int>::max());
        for (auto& loan : loans) {
            if (loan.id == loanId && !loan.returned) {
                Book* book = findBook(loan.bookId);
                if (!book) {
                    cout << "Error: The book linked to this loan was not found.\n";
                    return;
                }
                loan.returned = true;
                ++book->availableCopies;
                const bool saved = saveBooks() && saveLoans();
                if (saved) {
                    cout << "Book returned successfully: " << book->title << "\n";
                } else {
                    cout << "Error: Could not save all return records. Check file permissions.\n";
                }
                return;
            }
        }
        cout << "Active loan ID not found. Check the loan ID and try again.\n";
    }

    void displayActiveLoans() const {
        cout << "\n--- Active Loans ---\n";
        bool found = false;
        cout << left << setw(10) << "Loan ID" << setw(10) << "Book ID"
             << setw(12) << "Member ID" << "Book Title\n";
        cout << string(65, '-') << '\n';
        for (const auto& loan : loans) {
            if (!loan.returned) {
                const Book* book = findBook(loan.bookId);
                cout << left << setw(10) << loan.id << setw(10) << loan.bookId
                     << setw(12) << loan.memberId
                     << (book ? book->title : "[book missing]") << '\n';
                found = true;
            }
        }
        if (!found) cout << "No active loans.\n";
    }

public:
    LibraryManagementSystem() { loadData(); }

    void run() {
        cout << "==========================================\n"
             << "       LIBRARY MANAGEMENT SYSTEM\n"
             << "==========================================\n";
        while (true) {
            cout << "\n--------------- MAIN MENU ---------------\n"
                 << "1. Add book\n"
                 << "2. Register member\n"
                 << "3. Display all books\n"
                 << "4. Display all members\n"
                 << "5. Search books by title/author\n"
                 << "6. Issue a book\n"
                 << "7. Return a book\n"
                 << "8. Display active loans\n"
                 << "9. Exit\n"
                 << "-----------------------------------------\n";
            const int choice = readInt("Enter your choice (1-9): ", 1, 9);
            switch (choice) {
                case 1: addBook(); break;
                case 2: registerMember(); break;
                case 3: displayBooks(); break;
                case 4: displayMembers(); break;
                case 5: searchBooks(); break;
                case 6: issueBook(); break;
                case 7: returnBook(); break;
                case 8: displayActiveLoans(); break;
                case 9:
                    cout << "Thank you for using the Library Management System.\n";
                    return;
            }
        }
    }
};

int main() {
    LibraryManagementSystem library;
    library.run();
    return 0;
}
