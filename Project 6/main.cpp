#include <algorithm>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

const string DATA_FILE = "students.txt";

struct Student {
    int id{};
    string name;
    int age{};
    string course;
    double marks{};
};

string readLine(const string& prompt) {
    cout << prompt;
    string value;
    getline(cin, value);
    return value;
}

int readInt(const string& prompt) {
    while (true) {
        string input = readLine(prompt);
        stringstream ss(input);
        int value;
        char extra;
        if ((ss >> value) && !(ss >> extra)) {
            return value;
        }
        cout << "Invalid input. Please enter a whole number.\n";
    }
}

double readDouble(const string& prompt) {
    while (true) {
        string input = readLine(prompt);
        stringstream ss(input);
        double value;
        char extra;
        if ((ss >> value) && !(ss >> extra)) {
            return value;
        }
        cout << "Invalid input. Please enter a valid number.\n";
    }
}

bool containsSeparator(const string& value) {
    return value.find('|') != string::npos;
}

string readTextField(const string& prompt) {
    while (true) {
        string value = readLine(prompt);
        if (value.empty()) {
            cout << "This field cannot be empty. Please try again.\n";
        } else if (containsSeparator(value)) {
            cout << "Please do not use the '|' character in this field.\n";
        } else {
            return value;
        }
    }
}

bool parseInt(const string& text, int& value) {
    stringstream ss(text);
    char extra;
    return (ss >> value) && !(ss >> extra);
}

bool parseDouble(const string& text, double& value) {
    stringstream ss(text);
    char extra;
    return (ss >> value) && !(ss >> extra);
}

vector<Student> loadStudents() {
    vector<Student> students;
    ifstream file(DATA_FILE);
    if (!file.is_open()) {
        // The file is created automatically the first time records are saved.
        return students;
    }

    string line;
    while (getline(file, line)) {
        stringstream ss(line);
        string idText, name, ageText, course, marksText;
        if (!getline(ss, idText, '|') || !getline(ss, name, '|') ||
            !getline(ss, ageText, '|') || !getline(ss, course, '|') ||
            !getline(ss, marksText)) {
            continue; // Ignore malformed lines instead of crashing.
        }

        Student student;
        if (parseInt(idText, student.id) && parseInt(ageText, student.age) &&
            parseDouble(marksText, student.marks) && !name.empty() && !course.empty()) {
            students.push_back({student.id, name, student.age, course, student.marks});
        }
    }

    return students;
}

bool saveStudents(const vector<Student>& students) {
    ofstream file(DATA_FILE, ios::trunc);
    if (!file.is_open()) {
        cerr << "Error: Could not open " << DATA_FILE << " for writing.\n";
        return false;
    }

    file << setprecision(10);
    for (const Student& student : students) {
        file << student.id << '|'
             << student.name << '|'
             << student.age << '|'
             << student.course << '|'
             << student.marks << '\n';
    }

    if (!file.good()) {
        cerr << "Error: A problem occurred while saving student records.\n";
        return false;
    }
    return true;
}

int findStudentIndex(const vector<Student>& students, int id) {
    for (size_t i = 0; i < students.size(); ++i) {
        if (students[i].id == id) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

void displayStudents(const vector<Student>& students) {
    if (students.empty()) {
        cout << "\nNo student records found.\n";
        return;
    }

    cout << '\n'
         << left << setw(8) << "ID"
         << setw(26) << "Name"
         << setw(8) << "Age"
         << setw(22) << "Course"
         << right << setw(10) << "Marks" << '\n';
    cout << string(74, '-') << '\n';

    for (const Student& student : students) {
        cout << left << setw(8) << student.id
             << setw(26) << student.name
             << setw(8) << student.age
             << setw(22) << student.course
             << right << setw(10) << fixed << setprecision(2) << student.marks
             << '\n';
    }
}

void addStudent(vector<Student>& students) {
    cout << "\n--- Add Student ---\n";
    int id;
    while (true) {
        id = readInt("Enter student ID: ");
        if (id <= 0) {
            cout << "ID must be a positive number.\n";
        } else if (findStudentIndex(students, id) != -1) {
            cout << "That ID already exists. Please enter a unique ID.\n";
        } else {
            break;
        }
    }

    string name = readTextField("Enter student name: ");

    int age;
    while (true) {
        age = readInt("Enter age: ");
        if (age < 1 || age > 120) {
            cout << "Please enter an age between 1 and 120.\n";
        } else {
            break;
        }
    }

    string course = readTextField("Enter course: ");

    double marks;
    while (true) {
        marks = readDouble("Enter marks (0-100): ");
        if (marks < 0.0 || marks > 100.0) {
            cout << "Marks must be between 0 and 100.\n";
        } else {
            break;
        }
    }

    students.push_back({id, name, age, course, marks});
    if (saveStudents(students)) {
        cout << "Student added and saved successfully.\n";
    } else {
        students.pop_back();
        cout << "Student was not added because the file could not be saved.\n";
    }
}

void updateStudent(vector<Student>& students) {
    cout << "\n--- Update Student ---\n";
    int id = readInt("Enter the ID of the student to update: ");
    int index = findStudentIndex(students, id);
    if (index == -1) {
        cout << "Student with ID " << id << " was not found.\n";
        return;
    }

    Student oldStudent = students[index];
    Student updated = oldStudent;
    cout << "Updating student ID " << id << ". Enter the new details.\n";
    updated.name = readTextField("Enter new name: ");

    while (true) {
        updated.age = readInt("Enter new age: ");
        if (updated.age >= 1 && updated.age <= 120) break;
        cout << "Please enter an age between 1 and 120.\n";
    }

    updated.course = readTextField("Enter new course: ");
    while (true) {
        updated.marks = readDouble("Enter new marks (0-100): ");
        if (updated.marks >= 0.0 && updated.marks <= 100.0) break;
        cout << "Marks must be between 0 and 100.\n";
    }

    students[index] = updated;
    if (saveStudents(students)) {
        cout << "Student updated and saved successfully.\n";
    } else {
        students[index] = oldStudent;
        cout << "Update was cancelled because the file could not be saved.\n";
    }
}

void deleteStudent(vector<Student>& students) {
    cout << "\n--- Delete Student ---\n";
    int id = readInt("Enter the ID of the student to delete: ");
    int index = findStudentIndex(students, id);
    if (index == -1) {
        cout << "Student with ID " << id << " was not found.\n";
        return;
    }

    cout << "Student: " << students[index].name << " (ID " << id << ")\n";
    string confirmation = readLine("Type Y to confirm deletion, or anything else to cancel: ");
    if (confirmation != "Y" && confirmation != "y") {
        cout << "Deletion cancelled.\n";
        return;
    }

    Student removed = students[index];
    students.erase(students.begin() + index);
    if (saveStudents(students)) {
        cout << "Student deleted successfully.\n";
    } else {
        students.insert(students.begin() + index, removed);
        cout << "Deletion was cancelled because the file could not be saved.\n";
    }
}

void showMenu() {
    cout << "\n====================================\n"
         << "      STUDENT MANAGEMENT SYSTEM\n"
         << "====================================\n"
         << "1. Add student\n"
         << "2. Update student\n"
         << "3. Delete student\n"
         << "4. Display all students\n"
         << "5. Exit\n"
         << "------------------------------------\n";
}

int main() {
    vector<Student> students = loadStudents();
    cout << "Welcome to the Student Management System!\n";
    cout << "Loaded " << students.size() << " student record(s) from " << DATA_FILE << ".\n";

    while (true) {
        showMenu();
        int choice = readInt("Enter your choice (1-5): ");

        switch (choice) {
            case 1:
                addStudent(students);
                break;
            case 2:
                updateStudent(students);
                break;
            case 3:
                deleteStudent(students);
                break;
            case 4:
                displayStudents(students);
                break;
            case 5:
                cout << "Thank you for using the Student Management System. Goodbye!\n";
                return 0;
            default:
                cout << "Invalid choice. Please select a number from 1 to 5.\n";
        }
    }
}
