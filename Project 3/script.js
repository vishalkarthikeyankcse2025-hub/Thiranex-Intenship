// ==========================================================
// TASKFLOW - ADVANCED TODO APPLICATION
// ==========================================================


// ==========================================================
// DOM ELEMENTS
// ==========================================================

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoPriority = document.getElementById("todo-priority");
const todoDate = document.getElementById("todo-date");

const todoList = document.getElementById("todo-list");
const todoCount = document.getElementById("todo-count");

const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyMessage = document.getElementById("empty-message");

const clearCompletedButton =
    document.getElementById("clear-completed");

const filterContainer =
    document.querySelector(".filters");

const searchInput =
    document.getElementById("search-input");

const sortSelect =
    document.getElementById("sort-select");

const statTotal =
    document.getElementById("stat-total");

const statActive =
    document.getElementById("stat-active");

const statCompleted =
    document.getElementById("stat-completed");

const statOverdue =
    document.getElementById("stat-overdue");

const progressBar =
    document.getElementById("progress-bar");

const progressLabel =
    document.getElementById("progress-label");

const themeToggle =
    document.getElementById("theme-toggle");

const themeIcon =
    document.getElementById("theme-icon");

const toast =
    document.getElementById("toast");


// ==========================================================
// APPLICATION STATE
// ==========================================================

const STORAGE_KEY = "todos";
const SETTINGS_KEY = "taskflow.settings";

let todos = loadTodos();

let currentFilter = "all";
let currentSearch = "";
let currentSort = "newest";

let editingId = null;

let toastTimer;


// ==========================================================
// LOCAL STORAGE
// ==========================================================

function loadTodos() {

    try {

        const stored =
            window.localStorage.getItem(STORAGE_KEY);

        if (!stored) {
            return [];
        }

        const data = JSON.parse(stored);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;

    } catch (error) {

        console.error(
            "Failed to load tasks:",
            error
        );

        return [];
    }
}


function saveTodos() {

    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(todos)
    );
}


// ==========================================================
// SETTINGS
// ==========================================================

function loadSettings() {

    try {

        const stored =
            window.localStorage.getItem(SETTINGS_KEY);

        return stored
            ? JSON.parse(stored)
            : {};

    } catch {

        return {};
    }
}


function saveSettings(settings) {

    window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}


// ==========================================================
// UTILITY FUNCTIONS
// ==========================================================

function generateId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return (
        Date.now() +
        "-" +
        Math.random()
            .toString(16)
            .slice(2)
    );
}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


function isOverdue(todo) {

    if (
        !todo.dueDate ||
        todo.completed
    ) {
        return false;
    }

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const due =
        new Date(
            todo.dueDate +
            "T00:00:00"
        );

    return due < today;
}


function priorityValue(priority) {

    if (priority === "high") {
        return 3;
    }

    if (priority === "medium") {
        return 2;
    }

    return 1;
}


function showToast(message) {

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.classList.add("show");

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2000);
}


// ==========================================================
// CREATE
// ==========================================================

function addTodo(
    text,
    priority,
    dueDate
) {

    const now = Date.now();

    const todo = {

        id: generateId(),

        text: text.trim(),

        completed: false,

        priority: priority,

        dueDate: dueDate,

        createdAt: now,

        updatedAt: now
    };

    todos.unshift(todo);

    saveTodos();

    renderTodos();

    showToast("Task added");
}


// ==========================================================
// FILTERING
// ==========================================================

function getFilteredTodos() {

    let result = [...todos];


    // Filter
    if (currentFilter === "active") {

        result =
            result.filter(
                todo => !todo.completed
            );
    }


    if (currentFilter === "completed") {

        result =
            result.filter(
                todo => todo.completed
            );
    }


    // Search
    const search =
        currentSearch
            .trim()
            .toLowerCase();

    if (search) {

        result =
            result.filter(todo =>

                todo.text
                    .toLowerCase()
                    .includes(search)

                ||

                todo.priority
                    .toLowerCase()
                    .includes(search)
            );
    }


    // Sorting
    result.sort((a, b) => {

        if (currentSort === "oldest") {

            return (
                a.createdAt -
                b.createdAt
            );
        }


        if (currentSort === "priority") {

            return (
                priorityValue(b.priority) -
                priorityValue(a.priority)
            );
        }


        if (currentSort === "due") {

            if (!a.dueDate) return 1;

            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(
                b.dueDate
            );
        }


        // newest
        return (
            b.createdAt -
            a.createdAt
        );
    });


    return result;
}


// ==========================================================
// CREATE TODO ELEMENT
// ==========================================================

function createTodoElement(todo) {

    const li =
        document.createElement("li");

    li.className = "todo-item";

    li.dataset.id = todo.id;


    if (todo.completed) {
        li.classList.add("completed");
    }


    // Checkbox
    const checkbox =
        document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.className =
        "todo-checkbox";

    checkbox.checked =
        todo.completed;

    checkbox.setAttribute(
        "aria-label",
        "Complete task"
    );


    // Content
    const content =
        document.createElement("div");

    content.className =
        "todo-content";


    const main =
        document.createElement("div");

    main.className =
        "todo-main";


    const text =
        document.createElement("span");

    text.className =
        "todo-text";

    text.textContent =
        todo.text;


    main.appendChild(text);


    // Metadata
    const meta =
        document.createElement("div");

    meta.className =
        "todo-meta";


    const priority =
        document.createElement("span");

    priority.className =
        "badge " +
        todo.priority;

    priority.textContent =
        todo.priority +
        " priority";

    meta.appendChild(priority);


    if (todo.dueDate) {

        const due =
            document.createElement("span");

        due.className =
            "badge " +
            (
                isOverdue(todo)
                    ? "overdue"
                    : ""
            );

        due.textContent =
            isOverdue(todo)

                ? "Overdue • " +
                  formatDate(todo.dueDate)

                : "Due • " +
                  formatDate(todo.dueDate);

        meta.appendChild(due);
    }


    content.appendChild(main);

    content.appendChild(meta);


    // Actions
    const actions =
        document.createElement("div");

    actions.className =
        "todo-actions";


    const editButton =
        document.createElement("button");

    editButton.type =
        "button";

    editButton.className =
        "action-btn edit-btn";

    editButton.dataset.action =
        "edit";

    editButton.textContent =
        "Edit";


    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.className =
        "action-btn delete-btn";

    deleteButton.dataset.action =
        "delete";

    deleteButton.textContent =
        "Delete";


    actions.appendChild(editButton);

    actions.appendChild(deleteButton);


    li.appendChild(checkbox);

    li.appendChild(content);

    li.appendChild(actions);


    return li;
}


// ==========================================================
// EDIT TODO
// ==========================================================

function editTodo(id) {

    const todo =
        todos.find(
            item => item.id === id
        );

    const item =
        todoList.querySelector(
            `.todo-item[data-id="${id}"]`
        );

    if (!todo || !item) {
        return;
    }

    editingId = id;


    const content =
        item.querySelector(
            ".todo-content"
        );

    const actions =
        item.querySelector(
            ".todo-actions"
        );


    content.replaceChildren();


    const editor =
        document.createElement("div");

    editor.className =
        "edit-editor";


    const input =
        document.createElement("input");

    input.type = "text";

    input.className =
        "edit-input";

    input.value =
        todo.text;

    input.maxLength = 120;


    const priority =
        document.createElement("select");

    priority.className =
        "edit-select";

    [
        "low",
        "medium",
        "high"
    ].forEach(value => {

        const option =
            document.createElement("option");

        option.value = value;

        option.textContent =
            value.charAt(0).toUpperCase() +
            value.slice(1);

        option.selected =
            value === todo.priority;

        priority.appendChild(option);
    });


    const date =
        document.createElement("input");

    date.type = "date";

    date.className =
        "edit-date";

    date.value =
        todo.dueDate || "";


    editor.appendChild(input);

    editor.appendChild(priority);

    editor.appendChild(date);

    content.appendChild(editor);


    actions.replaceChildren();


    const saveButton =
        document.createElement("button");

    saveButton.type = "button";

    saveButton.className =
        "action-btn edit-btn";

    saveButton.dataset.action =
        "save";

    saveButton.textContent =
        "Save";


    const cancelButton =
        document.createElement("button");

    cancelButton.type = "button";

    cancelButton.className =
        "action-btn";

    cancelButton.dataset.action =
        "cancel";

    cancelButton.textContent =
        "Cancel";


    actions.appendChild(saveButton);

    actions.appendChild(cancelButton);


    input.focus();

    input.select();
}


// ==========================================================
// SAVE EDIT
// ==========================================================

function saveEdit(id) {

    const item =
        todoList.querySelector(
            `.todo-item[data-id="${id}"]`
        );

    if (!item) {
        return;
    }


    const input =
        item.querySelector(
            ".edit-input"
        );

    const priority =
        item.querySelector(
            ".edit-select"
        );

    const date =
        item.querySelector(
            ".edit-date"
        );


    const text =
        input.value.trim();


    if (!text) {

        input.focus();

        showToast(
            "Task cannot be empty"
        );

        return;
    }


    todos =
        todos.map(todo => {

            if (todo.id !== id) {
                return todo;
            }

            return {

                ...todo,

                text,

                priority:
                    priority.value,

                dueDate:
                    date.value,

                updatedAt:
                    Date.now()
            };
        });


    editingId = null;

    saveTodos();

    renderTodos();

    showToast("Task updated");
}


// ==========================================================
// TOGGLE
// ==========================================================

function toggleTodo(id) {

    todos =
        todos.map(todo => {

            if (todo.id !== id) {
                return todo;
            }

            return {

                ...todo,

                completed:
                    !todo.completed,

                updatedAt:
                    Date.now()
            };
        });


    saveTodos();

    renderTodos();
}


// ==========================================================
// DELETE
// ==========================================================

function deleteTodo(id) {

    const todo =
        todos.find(
            item => item.id === id
        );

    if (!todo) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${todo.text}"?`
        );


    if (!confirmed) {
        return;
    }


    todos =
        todos.filter(
            item => item.id !== id
        );


    editingId = null;

    saveTodos();

    renderTodos();

    showToast("Task deleted");
}


// ==========================================================
// CLEAR COMPLETED
// ==========================================================

function clearCompleted() {

    const completed =
        todos.filter(
            todo => todo.completed
        );


    if (completed.length === 0) {
        return;
    }


    const confirmed =
        window.confirm(
            `Clear ${completed.length} completed task(s)?`
        );


    if (!confirmed) {
        return;
    }


    todos =
        todos.filter(
            todo => !todo.completed
        );


    editingId = null;

    saveTodos();

    renderTodos();

    showToast(
        "Completed tasks cleared"
    );
}


// ==========================================================
// UPDATE UI
// ==========================================================

function updateUI() {

    const total =
        todos.length;

    const active =
        todos.filter(
            todo => !todo.completed
        ).length;

    const completed =
        total - active;

    const overdue =
        todos.filter(
            todo => isOverdue(todo)
        ).length;

    const visible =
        getFilteredTodos().length;


    // Statistics
    statTotal.textContent =
        total;

    statActive.textContent =
        active;

    statCompleted.textContent =
        completed;

    statOverdue.textContent =
        overdue;


    // Counter
    todoCount.textContent =
        active === 0

            ? "No tasks remaining"

            : `${active} task${
                active === 1
                    ? ""
                    : "s"
              } remaining`;


    // Progress
    const progress =
        total === 0
            ? 0
            : Math.round(
                (completed / total) *
                100
            );


    progressBar.style.width =
        progress + "%";

    progressLabel.textContent =
        progress + "%";


    // Clear completed
    clearCompletedButton.disabled =
        completed === 0;


    // Empty state
    if (visible === 0) {

        emptyState.style.display =
            "block";


        if (todos.length === 0) {

            emptyTitle.textContent =
                "No tasks yet";

            emptyMessage.textContent =
                "Add a task and start getting things done.";

        } else if (currentSearch) {

            emptyTitle.textContent =
                "No matching tasks";

            emptyMessage.textContent =
                `Nothing matches "${currentSearch}".`;

        } else if (
            currentFilter === "active"
        ) {

            emptyTitle.textContent =
                "No active tasks";

            emptyMessage.textContent =
                "Everything is completed. Nice work.";

        } else {

            emptyTitle.textContent =
                "No completed tasks";

            emptyMessage.textContent =
                "Complete a task and it will appear here.";
        }

    } else {

        emptyState.style.display =
            "none";
    }
}


// ==========================================================
// RENDER
// ==========================================================

function renderTodos() {

    todoList.replaceChildren();

    const visibleTodos =
        getFilteredTodos();


    visibleTodos.forEach(todo => {

        todoList.appendChild(
            createTodoElement(todo)
        );
    });


    updateUI();
}


// ==========================================================
// ADD FORM
// ==========================================================

todoForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const text =
            todoInput.value.trim();


        if (!text) {

            todoInput.focus();

            return;
        }


        addTodo(
            text,
            todoPriority.value,
            todoDate.value
        );


        todoInput.value = "";

        todoDate.value = "";

        todoPriority.value =
            "medium";

        todoInput.focus();
    }
);


// ==========================================================
// DELEGATED CLICK EVENTS
// ==========================================================

todoList.addEventListener(
    "click",
    event => {

        const item =
            event.target.closest(
                ".todo-item"
            );


        if (!item) {
            return;
        }


        const id =
            item.dataset.id;

        const action =
            event.target.dataset.action;


        if (action === "edit") {

            editTodo(id);

            return;
        }


        if (action === "save") {

            saveEdit(id);

            return;
        }


        if (action === "cancel") {

            editingId = null;

            renderTodos();

            return;
        }


        if (action === "delete") {

            deleteTodo(id);
        }
    }
);


// ==========================================================
// DELEGATED CHECKBOX EVENT
// ==========================================================

todoList.addEventListener(
    "change",
    event => {

        if (
            !event.target.classList.contains(
                "todo-checkbox"
            )
        ) {
            return;
        }


        const item =
            event.target.closest(
                ".todo-item"
            );


        if (!item) {
            return;
        }


        toggleTodo(
            item.dataset.id
        );
    }
);


// ==========================================================
// KEYBOARD EVENTS
// ==========================================================

todoList.addEventListener(
    "keydown",
    event => {

        if (
            !event.target.classList.contains(
                "edit-input"
            )
        ) {
            return;
        }


        const item =
            event.target.closest(
                ".todo-item"
            );


        if (!item) {
            return;
        }


        if (event.key === "Enter") {

            event.preventDefault();

            saveEdit(
                item.dataset.id
            );
        }


        if (event.key === "Escape") {

            editingId = null;

            renderTodos();
        }
    }
);


// ==========================================================
// FILTER EVENTS
// ==========================================================

filterContainer.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".filter-btn"
            );


        if (!button) {
            return;
        }


        currentFilter =
            button.dataset.filter;


        document
            .querySelectorAll(
                ".filter-btn"
            )
            .forEach(btn => {

                btn.classList.toggle(
                    "active",
                    btn === button
                );
            });


        editingId = null;

        renderTodos();
    }
);


// ==========================================================
// SEARCH
// ==========================================================

searchInput.addEventListener(
    "input",
    event => {

        currentSearch =
            event.target.value;

        editingId = null;

        renderTodos();
    }
);


// ==========================================================
// SORT
// ==========================================================

sortSelect.addEventListener(
    "change",
    event => {

        currentSort =
            event.target.value;

        editingId = null;

        renderTodos();
    }
);


// ==========================================================
// CLEAR COMPLETED
// ==========================================================

clearCompletedButton.addEventListener(
    "click",
    clearCompleted
);


// ==========================================================
// THEME
// ==========================================================

function applyTheme(theme) {

    const dark =
        theme === "dark";


    document.body.classList.toggle(
        "dark",
        dark
    );


    themeIcon.textContent =
        dark
            ? "☀"
            : "☾";
}


const settings =
    loadSettings();


let theme =
    settings.theme;


if (!theme) {

    theme =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches

            ? "dark"
            : "light";
}


applyTheme(theme);


themeToggle.addEventListener(
    "click",
    () => {

        theme =
            document.body.classList.contains(
                "dark"
            )
                ? "light"
                : "dark";


        applyTheme(theme);


        saveSettings({
            ...loadSettings(),
            theme
        });
    }
);


// ==========================================================
// INITIALIZE
// ==========================================================

renderTodos();

todoInput.focus();