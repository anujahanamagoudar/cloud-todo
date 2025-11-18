// ===========================
//  CLOUD TODO FRONTEND
// ===========================

const API_BASE = "https://cloud-todo-production.up.railway.app/api";

// ===========================
// Load tasks from backend
// ===========================
async function loadTasks() {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error("Failed to load tasks:", err);
  }
}

// ===========================
// Add a new task
// ===========================
async function addTask(text, dueDate, priority) {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, dueDate, priority }),
    });

    await res.json();
    loadTasks(); // refresh UI
  } catch (err) {
    console.error("Failed to add task:", err);
  }
}

// ===========================
// Update a task
// ===========================
async function updateTask(id, updatedData) {
  try {
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    loadTasks();
  } catch (err) {
    console.error("Failed to update task:", err);
  }
}

// ===========================
// Delete a task
// ===========================
async function deleteTask(id) {
  try {
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
    });
    loadTasks();
  } catch (err) {
    console.error("Failed to delete task:", err);
  }
}

// ===========================
// Render tasks to UI
// ===========================
function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item";

    item.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.completed ? "checked" : ""}/>
        <span class="${task.completed ? "completed" : ""}">${task.text}</span>
      </div>

      <div class="task-right">
        <span class="priority ${task.priority}">${task.priority}</span>

        ${task.dueDate ? `<span class="due">Due: ${task.dueDate}</span>` : ""}

        <button class="delete-btn">🗑️</button>
      </div>
    `;

    // checkbox toggle
    item.querySelector("input").addEventListener("change", (e) => {
      updateTask(task._id, { completed: e.target.checked });
    });

    // delete
    item.querySelector(".delete-btn").addEventListener("click", () => {
      deleteTask(task._id);
    });

    list.appendChild(item);
  });
}

// ===========================
// Form submit - add task
// ===========================
document.getElementById("addTaskForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const text = document.getElementById("taskInput").value.trim();
  const dueDate = document.getElementById("dueDateInput").value;
  const priority = document.getElementById("priorityInput").value;

  if (text === "") return;

  addTask(text, dueDate, priority);

  e.target.reset();
});

// ===========================
// DARK MODE TOGGLE
// ===========================
const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  if (themeToggle) themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ===========================
// INITIAL LOAD
// ===========================
loadTasks();
