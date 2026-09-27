// ==========================================
// DOM ELEMENTS
// ==========================================

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");

const todoList = document.getElementById("todo-list");
const todoCount = document.getElementById("todo-count");

const emptyState = document.getElementById("empty-state");
const clearCompletedButton = document.getElementById("clear-completed");

const filterContainer = document.querySelector(".filters");


// ==========================================
// APPLICATION STATE
// ==========================================

// Load todos from localStorage
let todos = JSON.parse(localStorage.getItem("todos")) || [];

// Current filter
let currentFilter = "all";


// ==========================================
// SAVE STATE
// ==========================================

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}


// ==========================================
// CREATE TODO
// ==========================================

function addTodo(text) {

    const todo = {
        id: Date.now(),
        text: text,
        completed: false
    };

    todos.push(todo);

    saveTodos();
    renderTodos();
}


// ==========================================
// GET FILTERED TODOS
// ==========================================

function getFilteredTodos() {

    if (currentFilter === "active") {
        return todos.filter(todo => !todo.completed);
    }

    if (currentFilter === "completed") {
        return todos.filter(todo => todo.completed);
    }

    return todos;
}


// ==========================================
// CREATE TODO ELEMENT
// ==========================================

function createTodoElement(todo) {

    const li = document.createElement("li");

    li.className = "todo-item";

    li.dataset.id = todo.id;

    if (todo.completed) {
        li.classList.add("completed");
    }

    li.innerHTML = `
        <input
            type="checkbox"
            class="todo-checkbox"
            ${todo.completed ? "checked" : ""}
        >

        <span class="todo-text"></span>

        <div class="todo-actions">

            <button
                type="button"
                class="edit-btn"
                data-action="edit"
            >
                Edit
            </button>

            <button
                type="button"
                class="delete-btn"
                data-action="delete"
            >
                Delete
            </button>

        </div>
    `;

    // Use textContent instead of directly inserting user text into HTML
    const textElement = li.querySelector(".todo-text");

    textElement.textContent = todo.text;

    return li;
}


// ==========================================
// RENDER TODOS
// ==========================================

function renderTodos() {

    todoList.innerHTML = "";

    const filteredTodos = getFilteredTodos();

    filteredTodos.forEach(todo => {

        const todoElement = createTodoElement(todo);

        todoList.appendChild(todoElement);
    });

    updateUI();
}


// ==========================================
// UPDATE UI
// ==========================================

function updateUI() {

    const activeCount = todos.filter(todo => !todo.completed).length;

    const completedCount = todos.filter(todo => todo.completed).length;

    const filteredCount = getFilteredTodos().length;


    // -----------------------------
    // Task count
    // -----------------------------

    if (activeCount === 0) {

        todoCount.textContent = "No tasks remaining";

    } else if (activeCount === 1) {

        todoCount.textContent = "1 task remaining";

    } else {

        todoCount.textContent = `${activeCount} tasks remaining`;
    }


    // -----------------------------
    // Empty state
    // -----------------------------

    if (filteredCount === 0) {

        emptyState.style.display = "block";

        if (todos.length === 0) {

            emptyState.querySelector("h2").textContent = "No tasks yet";

            emptyState.querySelector("p").textContent =
                "Add a task and start getting things done.";

        } else if (currentFilter === "active") {

            emptyState.querySelector("h2").textContent =
                "No active tasks";

            emptyState.querySelector("p").textContent =
                "All your tasks are completed.";

        } else if (currentFilter === "completed") {

            emptyState.querySelector("h2").textContent =
                "No completed tasks";

            emptyState.querySelector("p").textContent =
                "Complete a task and it will appear here.";
        }

    } else {

        emptyState.style.display = "none";
    }


    // -----------------------------
    // Clear completed button
    // -----------------------------

    if (completedCount === 0) {

        clearCompletedButton.disabled = true;

        clearCompletedButton.style.opacity = "0.4";

        clearCompletedButton.style.cursor = "default";

    } else {

        clearCompletedButton.disabled = false;

        clearCompletedButton.style.opacity = "1";

        clearCompletedButton.style.cursor = "pointer";
    }
}


// ==========================================
// TOGGLE TODO
// ==========================================

function toggleTodo(id) {

    todos = todos.map(todo => {

        if (todo.id === id) {

            return {
                ...todo,
                completed: !todo.completed
            };
        }

        return todo;
    });

    saveTodos();

    renderTodos();
}


// ==========================================
// EDIT TODO
// ==========================================

function editTodo(id) {

    const todoItem = document.querySelector(
        `.todo-item[data-id="${id}"]`
    );

    if (!todoItem) {
        return;
    }

    const textElement = todoItem.querySelector(".todo-text");

    const currentText = textElement.textContent;


    // Create input field
    const editInput = document.createElement("input");

    editInput.type = "text";

    editInput.className = "edit-input";

    editInput.value = currentText;

    editInput.maxLength = 100;


    // Replace text with input
    textElement.replaceWith(editInput);

    editInput.focus();

    editInput.select();


    // Change Edit button to Save
    const editButton = todoItem.querySelector(".edit-btn");

    editButton.textContent = "Save";

    editButton.dataset.action = "save";


    // Store original text
    todoItem.dataset.originalText = currentText;
}


// ==========================================
// SAVE EDIT
// ==========================================

function saveEdit(id) {

    const todoItem = document.querySelector(
        `.todo-item[data-id="${id}"]`
    );

    if (!todoItem) {
        return;
    }

    const editInput = todoItem.querySelector(".edit-input");

    if (!editInput) {
        return;
    }

    const newText = editInput.value.trim();


    // Don't save empty task
    if (newText === "") {

        editInput.focus();

        return;
    }


    todos = todos.map(todo => {

        if (todo.id === id) {

            return {
                ...todo,
                text: newText
            };
        }

        return todo;
    });

    saveTodos();

    renderTodos();
}


// ==========================================
// DELETE TODO
// ==========================================

function deleteTodo(id) {

    todos = todos.filter(todo => todo.id !== id);

    saveTodos();

    renderTodos();
}


// ==========================================
// CLEAR COMPLETED
// ==========================================

function clearCompleted() {

    const completedCount =
        todos.filter(todo => todo.completed).length;

    if (completedCount === 0) {
        return;
    }

    todos = todos.filter(todo => !todo.completed);

    saveTodos();

    renderTodos();
}


// ==========================================
// ADD TODO FORM
// ==========================================

todoForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const text = todoInput.value.trim();


    // Prevent empty task
    if (text === "") {

        todoInput.focus();

        return;
    }


    addTodo(text);


    // Clear input
    todoInput.value = "";

    todoInput.focus();
});


// ==========================================
// EVENT DELEGATION
// ==========================================

todoList.addEventListener("click", function (event) {

    const todoItem =
        event.target.closest(".todo-item");

    if (!todoItem) {
        return;
    }


    const id =
        Number(todoItem.dataset.id);

    const action =
        event.target.dataset.action;


    // -----------------------------
    // Edit
    // -----------------------------

    if (action === "edit") {

        editTodo(id);

        return;
    }


    // -----------------------------
    // Save
    // -----------------------------

    if (action === "save") {

        saveEdit(id);

        return;
    }


    // -----------------------------
    // Delete
    // -----------------------------

    if (action === "delete") {

        deleteTodo(id);

        return;
    }
});


// ==========================================
// CHECKBOX EVENT
// ==========================================

todoList.addEventListener("change", function (event) {

    if (!event.target.classList.contains("todo-checkbox")) {
        return;
    }


    const todoItem =
        event.target.closest(".todo-item");

    if (!todoItem) {
        return;
    }


    const id =
        Number(todoItem.dataset.id);

    toggleTodo(id);
});


// ==========================================
// ENTER / ESCAPE WHILE EDITING
// ==========================================

todoList.addEventListener("keydown", function (event) {

    if (!event.target.classList.contains("edit-input")) {
        return;
    }


    const todoItem =
        event.target.closest(".todo-item");

    const id =
        Number(todoItem.dataset.id);


    // Save with Enter
    if (event.key === "Enter") {

        saveEdit(id);
    }


    // Cancel with Escape
    if (event.key === "Escape") {

        renderTodos();
    }
});


// ==========================================
// FILTER EVENT
// ==========================================

filterContainer.addEventListener("click", function (event) {

    if (!event.target.classList.contains("filter-btn")) {
        return;
    }


    currentFilter =
        event.target.dataset.filter;


    // Remove active from all buttons
    document.querySelectorAll(".filter-btn").forEach(button => {

        button.classList.remove("active");
    });


    // Activate clicked button
    event.target.classList.add("active");


    renderTodos();
});


// ==========================================
// CLEAR COMPLETED EVENT
// ==========================================

clearCompletedButton.addEventListener(
    "click",
    clearCompleted
);


// ==========================================
// INITIALIZE APPLICATION
// ==========================================

renderTodos();