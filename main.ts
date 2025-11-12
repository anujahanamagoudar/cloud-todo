const inputEl = document.getElementById("taskInput") as HTMLInputElement;
const addBtn = document.getElementById("addBtn") as HTMLButtonElement;
const taskList = document.getElementById("taskList") as HTMLUListElement;

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

let tasks: Task[] = JSON.parse(localStorage.getItem("tasks") || "[]");

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";

    const span = document.createElement("span");
    span.textContent = task.text;
    span.addEventListener("click", () => toggleTask(task.id));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete-btn";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(span);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = inputEl.value.trim();
  if (!text) return;

  const newTask: Task = {
    id: Date.now(),
    text,
    completed: false,
  };

  tasks.push(newTask);
  saveAndRender();
  inputEl.value = "";
}

function deleteTask(id: number) {
  tasks = tasks.filter((t) => t.id !== id);
  saveAndRender();
}

function toggleTask(id: number) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  saveAndRender();
}

function saveAndRender() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

addBtn.addEventListener("click", addTask);

renderTasks();
