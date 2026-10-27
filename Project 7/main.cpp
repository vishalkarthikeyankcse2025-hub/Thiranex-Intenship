#include <algorithm>
#include <array>
#include <cctype>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <random>
#include <sstream>
#include <string>
#include <vector>

using namespace std;
namespace fs = std::filesystem;

namespace {
constexpr const char* DATA_FILE = "bank_accounts.txt";
constexpr int PIN_HASH_ROUNDS = 10000; // Educational demo; not a replacement for a standard password KDF.

struct Account {
    long long accountNumber = 0;
    string name;
    string salt;
    string pinHash;
    long long balancePaise = 0;
};

uint32_t rotateRight(uint32_t value, unsigned int count) {
    return (value >> count) | (value << (32U - count));
}

// Small, self-contained SHA-256 implementation so the example has no third-party dependencies.
string sha256(const string& input) {
    static constexpr array<uint32_t, 64> K = {
        0x428a2f98U,0x71374491U,0xb5c0fbcfU,0xe9b5dba5U,0x3956c25bU,0x59f111f1U,0x923f82a4U,0xab1c5ed5U,
        0xd807aa98U,0x12835b01U,0x243185beU,0x550c7dc3U,0x72be5d74U,0x80deb1feU,0x9bdc06a7U,0xc19bf174U,
        0xe49b69c1U,0xefbe4786U,0x0fc19dc6U,0x240ca1ccU,0x2de92c6fU,0x4a7484aaU,0x5cb0a9dcU,0x76f988daU,
        0x983e5152U,0xa831c66dU,0xb00327c8U,0xbf597fc7U,0xc6e00bf3U,0xd5a79147U,0x06ca6351U,0x14292967U,
        0x27b70a85U,0x2e1b2138U,0x4d2c6dfcU,0x53380d13U,0x650a7354U,0x766a0abbU,0x81c2c92eU,0x92722c85U,
        0xa2bfe8a1U,0xa81a664bU,0xc24b8b70U,0xc76c51a3U,0xd192e819U,0xd6990624U,0xf40e3585U,0x106aa070U,
        0x19a4c116U,0x1e376c08U,0x2748774cU,0x34b0bcb5U,0x391c0cb3U,0x4ed8aa4aU,0x5b9cca4fU,0x682e6ff3U,
        0x748f82eeU,0x78a5636fU,0x84c87814U,0x8cc70208U,0x90befffaU,0xa4506cebU,0xbef9a3f7U,0xc67178f2U
    };

    vector<uint8_t> message(input.begin(), input.end());
    const uint64_t bitLength = static_cast<uint64_t>(message.size()) * 8ULL;
    message.push_back(0x80U);
    while ((message.size() % 64U) != 56U) message.push_back(0U);
    for (int shift = 56; shift >= 0; shift -= 8)
        message.push_back(static_cast<uint8_t>((bitLength >> shift) & 0xffU));

    array<uint32_t, 8> hash = {
        0x6a09e667U,0xbb67ae85U,0x3c6ef372U,0xa54ff53aU,
        0x510e527fU,0x9b05688cU,0x1f83d9abU,0x5be0cd19U
    };

    for (size_t chunk = 0; chunk < message.size(); chunk += 64U) {
        array<uint32_t, 64> w{};
        for (size_t i = 0; i < 16; ++i) {
            const size_t j = chunk + i * 4U;
            w[i] = (static_cast<uint32_t>(message[j]) << 24U) |
                   (static_cast<uint32_t>(message[j + 1]) << 16U) |
                   (static_cast<uint32_t>(message[j + 2]) << 8U) |
                   static_cast<uint32_t>(message[j + 3]);
        }
        for (size_t i = 16; i < 64; ++i) {
            const uint32_t s0 = rotateRight(w[i - 15], 7) ^ rotateRight(w[i - 15], 18) ^ (w[i - 15] >> 3U);
            const uint32_t s1 = rotateRight(w[i - 2], 17) ^ rotateRight(w[i - 2], 19) ^ (w[i - 2] >> 10U);
            w[i] = w[i - 16] + s0 + w[i - 7] + s1;
        }

        uint32_t a = hash[0], b = hash[1], c = hash[2], d = hash[3];
        uint32_t e = hash[4], f = hash[5], g = hash[6], h = hash[7];
        for (size_t i = 0; i < 64; ++i) {
            const uint32_t sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
            const uint32_t choice = (e & f) ^ ((~e) & g);
            const uint32_t temp1 = h + sum1 + choice + K[i] + w[i];
            const uint32_t sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
            const uint32_t majority = (a & b) ^ (a & c) ^ (b & c);
            const uint32_t temp2 = sum0 + majority;
            h = g; g = f; f = e; e = d + temp1;
            d = c; c = b; b = a; a = temp1 + temp2;
        }
        hash[0] += a; hash[1] += b; hash[2] += c; hash[3] += d;
        hash[4] += e; hash[5] += f; hash[6] += g; hash[7] += h;
    }

    ostringstream result;
    result << hex << setfill('0');
    for (uint32_t value : hash) result << setw(8) << value;
    return result.str();
}

string makeSalt() {
    random_device rd;
    ostringstream out;
    out << hex << setfill('0');
    for (int i = 0; i < 4; ++i) {
        const uint32_t value = (static_cast<uint32_t>(rd()) << 16U) ^ static_cast<uint32_t>(rd());
        out << setw(8) << value;
    }
    return out.str();
}

string derivePinHash(const string& salt, const string& pin) {
    string value = salt + ":" + pin;
    for (int round = 0; round < PIN_HASH_ROUNDS; ++round)
        value = sha256(value + ":" + salt + ":" + to_string(round));
    return value;
}

bool constantTimeEqual(const string& a, const string& b) {
    if (a.size() != b.size()) return false;
    unsigned char difference = 0;
    for (size_t i = 0; i < a.size(); ++i)
        difference |= static_cast<unsigned char>(a[i] ^ b[i]);
    return difference == 0;
}

string formatMoney(long long paise) {
    ostringstream out;
    out << "Rs. " << (paise / 100) << '.' << setw(2) << setfill('0') << (paise % 100);
    return out.str();
}

bool parseMoney(const string& input, long long& paise) {
    if (input.empty() || input[0] == '-' || input[0] == '+') return false;
    const size_t dot = input.find('.');
    if (dot != string::npos && input.find('.', dot + 1) != string::npos) return false;
    const string rupeesText = (dot == string::npos) ? input : input.substr(0, dot);
    const string paiseText = (dot == string::npos) ? "" : input.substr(dot + 1);
    if (rupeesText.empty() || (dot != string::npos && (paiseText.empty() || paiseText.size() > 2))) return false;
    if (!all_of(rupeesText.begin(), rupeesText.end(), [](unsigned char ch) { return isdigit(ch); })) return false;
    if (!all_of(paiseText.begin(), paiseText.end(), [](unsigned char ch) { return isdigit(ch); })) return false;

    try {
        const long long rupees = stoll(rupeesText);
        const int paisePart = paiseText.empty() ? 0 : (paiseText.size() == 1 ? (paiseText[0] - '0') * 10 : (paiseText[0] - '0') * 10 + (paiseText[1] - '0'));
        if (rupees > (numeric_limits<long long>::max() - paisePart) / 100) return false;
        paise = rupees * 100 + paisePart;
        return true;
    } catch (...) {
        return false;
    }
}

string readLine(const string& prompt) {
    cout << prompt;
    string value;
    getline(cin, value);
    return value;
}

bool readPositiveAmount(const string& prompt, long long& amount, bool allowZero = false) {
    while (true) {
        const string text = readLine(prompt);
        if (cin.eof()) return false;
        if (parseMoney(text, amount) && (allowZero ? amount >= 0 : amount > 0)) return true;
        cout << "Please enter a valid amount" << (allowZero ? " (0.00 or more)" : " greater than 0.00")
             << ", with at most 2 decimal places.\n";
    }
}

bool validPin(const string& pin) {
    return pin.size() >= 4 && pin.size() <= 8 &&
           all_of(pin.begin(), pin.end(), [](unsigned char ch) { return isdigit(ch); });
}

long long nextAccountNumber(const vector<Account>& accounts) {
    long long largest = 1000000;
    for (const auto& account : accounts) largest = max(largest, account.accountNumber);
    if (largest == numeric_limits<long long>::max()) return -1;
    return largest + 1;
}

bool saveAccounts(const vector<Account>& accounts) {
    const fs::path destination(DATA_FILE);
    const fs::path temporary(string(DATA_FILE) + ".tmp");
    const fs::path backup(string(DATA_FILE) + ".bak");

    error_code ec;
    fs::remove(temporary, ec);
    {
        ofstream out(temporary, ios::trunc);
        if (!out) {
            cerr << "Error: Could not create the temporary account file.\n";
            return false;
        }
        for (const auto& account : accounts) {
            out << account.accountNumber << ' '
                << quoted(account.name) << ' '
                << quoted(account.salt) << ' '
                << quoted(account.pinHash) << ' '
                << account.balancePaise << '\n';
        }
        out.flush();
        if (!out) {
            cerr << "Error: Could not write account data.\n";
            out.close();
            fs::remove(temporary, ec);
            return false;
        }
    }

    const bool hadOriginal = fs::exists(destination, ec) && !ec;
    if (hadOriginal) {
        fs::remove(backup, ec);
        ec.clear();
        fs::rename(destination, backup, ec);
        if (ec) {
            cerr << "Error: Could not prepare the existing account file for update.\n";
            fs::remove(temporary, ec);
            return false;
        }
    }

    ec.clear();
    fs::rename(temporary, destination, ec);
    if (ec) {
        cerr << "Error: Could not save account data.\n";
        if (hadOriginal) {
            error_code restoreError;
            fs::rename(backup, destination, restoreError);
        }
        fs::remove(temporary, ec);
        return false;
    }

    if (hadOriginal) fs::remove(backup, ec);
    return true;
}

bool loadAccounts(vector<Account>& accounts) {
    ifstream in(DATA_FILE);
    if (!in) {
        error_code ec;
        if (!fs::exists(DATA_FILE, ec)) return true; // First run: no account file yet.
        cerr << "Error: Could not open " << DATA_FILE << ". Check file permissions.\n";
        return false;
    }

    Account account;
    while (in >> account.accountNumber >> quoted(account.name)
              >> quoted(account.salt) >> quoted(account.pinHash) >> account.balancePaise) {
        if (account.accountNumber <= 0 || account.balancePaise < 0 || account.salt.empty() || account.pinHash.empty()) {
            cerr << "Error: Invalid record found in " << DATA_FILE << ". No changes were made.\n";
            return false;
        }
        accounts.push_back(account);
    }
    if (!in.eof()) {
        cerr << "Error: Account file is damaged or has an invalid record. No changes were made.\n";
        return false;
    }
    return true;
}

Account* findAccount(vector<Account>& accounts, long long accountNumber) {
    auto it = find_if(accounts.begin(), accounts.end(), [accountNumber](const Account& account) {
        return account.accountNumber == accountNumber;
    });
    return it == accounts.end() ? nullptr : &(*it);
}

bool readAccountNumber(long long& accountNumber) {
    const string text = readLine("Enter account number: ");
    if (cin.eof()) return false;
    try {
        size_t used = 0;
        const long long parsed = stoll(text, &used);
        if (used != text.size() || parsed <= 0) {
            cout << "Please enter a valid account number.\n";
            return false;
        }
        accountNumber = parsed;
        return true;
    } catch (...) {
        cout << "Please enter a valid account number.\n";
        return false;
    }
}

void createAccount(vector<Account>& accounts) {
    cout << "\n--- Create Bank Account ---\n";
    string name = readLine("Customer full name: ");
    if (cin.eof()) return;
    if (name.empty() || all_of(name.begin(), name.end(), [](unsigned char ch) { return isspace(ch); })) {
        cout << "Name cannot be empty.\n";
        return;
    }

    string pin = readLine("Create a 4-8 digit PIN: ");
    if (cin.eof()) return;
    if (!validPin(pin)) {
        cout << "PIN must contain 4 to 8 digits only.\n";
        return;
    }
    string confirmation = readLine("Confirm PIN: ");
    if (cin.eof()) return;
    if (pin != confirmation) {
        cout << "PINs do not match. Account was not created.\n";
        return;
    }

    long long initialDeposit = 0;
    if (!readPositiveAmount("Initial deposit (Rs., enter 0 if none): ", initialDeposit, true)) return;

    const long long number = nextAccountNumber(accounts);
    if (number < 0) {
        cout << "Could not generate an account number.\n";
        return;
    }
    Account account;
    account.accountNumber = number;
    account.name = name;
    account.salt = makeSalt();
    account.pinHash = derivePinHash(account.salt, pin);
    account.balancePaise = initialDeposit;
    fill(pin.begin(), pin.end(), '\0');
    fill(confirmation.begin(), confirmation.end(), '\0');

    accounts.push_back(account);
    if (!saveAccounts(accounts)) {
        accounts.pop_back();
        cout << "Account creation failed because the data could not be saved.\n";
        return;
    }
    cout << "\nAccount created successfully!\nAccount number: " << number
         << "\nCustomer name: " << name
         << "\nCurrent balance: " << formatMoney(initialDeposit) << "\n";
    cout << "Please save your account number.\n";
}

bool authenticate(Account& account) {
    string pin = readLine("Enter your PIN: ");
    if (cin.eof()) return false;
    const string suppliedHash = derivePinHash(account.salt, pin);
    fill(pin.begin(), pin.end(), '\0');
    if (!constantTimeEqual(suppliedHash, account.pinHash)) {
        cout << "Invalid account number or PIN.\n";
        return false;
    }
    return true;
}

void deposit(vector<Account>& accounts, Account& account) {
    long long amount = 0;
    if (!readPositiveAmount("Deposit amount (Rs.): ", amount)) return;
    if (amount > numeric_limits<long long>::max() - account.balancePaise) {
        cout << "Amount is too large. Transaction cancelled.\n";
        return;
    }
    const long long oldBalance = account.balancePaise;
    account.balancePaise += amount;
    if (!saveAccounts(accounts)) {
        account.balancePaise = oldBalance;
        cout << "Deposit was not completed because saving failed.\n";
        return;
    }
    cout << "Deposit successful. New balance: " << formatMoney(account.balancePaise) << "\n";
}

void withdraw(vector<Account>& accounts, Account& account) {
    long long amount = 0;
    if (!readPositiveAmount("Withdrawal amount (Rs.): ", amount)) return;
    if (amount > account.balancePaise) {
        cout << "Insufficient balance. Transaction cancelled.\n";
        return;
    }
    const long long oldBalance = account.balancePaise;
    account.balancePaise -= amount;
    if (!saveAccounts(accounts)) {
        account.balancePaise = oldBalance;
        cout << "Withdrawal was not completed because saving failed.\n";
        return;
    }
    cout << "Withdrawal successful. New balance: " << formatMoney(account.balancePaise) << "\n";
}

void accountMenu(vector<Account>& accounts, long long accountNumber) {
    Account* account = findAccount(accounts, accountNumber);
    if (account == nullptr || !authenticate(*account)) return;

    cout << "\nWelcome, " << account->name << "!\n";
    while (true) {
        cout << "\n========== BANK MENU ==========\n"
             << "1. Deposit money\n"
             << "2. Withdraw money\n"
             << "3. Check balance\n"
             << "4. View account details\n"
             << "5. Log out\n"
             << "===============================\n";
        const string choice = readLine("Choose an option (1-5): ");
        if (cin.eof()) return;
        if (choice == "1") deposit(accounts, *account);
        else if (choice == "2") withdraw(accounts, *account);
        else if (choice == "3") cout << "Available balance: " << formatMoney(account->balancePaise) << "\n";
        else if (choice == "4") {
            cout << "\nAccount number: " << account->accountNumber
                 << "\nCustomer name: " << account->name
                 << "\nAvailable balance: " << formatMoney(account->balancePaise) << "\n";
        }
        else if (choice == "5") {
            cout << "Logged out successfully.\n";
            return;
        }
        else cout << "Invalid option. Please choose 1-5.\n";
    }
}
} // namespace

int main() {
    vector<Account> accounts;
    if (!loadAccounts(accounts)) {
        cout << "Fix the account file before running the application again.\n";
        return 1;
    }

    cout << "====================================\n"
         << "      BANK MANAGEMENT SYSTEM\n"
         << "====================================\n";
    while (true) {
        cout << "\n1. Create account\n"
             << "2. Log in to account\n"
             << "3. Exit\n";
        const string choice = readLine("Enter your choice (1-3): ");
        if (cin.eof()) break;

        if (choice == "1") createAccount(accounts);
        else if (choice == "2") {
            long long number = 0;
            if (readAccountNumber(number)) accountMenu(accounts, number);
        }
        else if (choice == "3") {
            cout << "Thank you for using the Bank Management System.\n";
            break;
        }
        else cout << "Invalid option. Please choose 1-3.\n";
    }
    return 0;
}
