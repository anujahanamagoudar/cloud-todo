// main.js — defensive (avoid null refs and common runtime errors)

(function () {
  // getElement helper (returns null if not found)
  const $ = (id) => document.getElementById(id);

  const taskInput = $("taskInput");
  const addBtn = $("addBtn");
  const taskList = $("taskList");
  const searchInput = $("searchInput");
  const filterSelect = $("filterSelect");
  const sortSelect = $("sortSelect");
  const dueInput = $("dueInput");
  const prioritySelect = $("prioritySelect");
  const deleteCompletedBtn = $("deleteCompleted");
  const clearAllBtn = $("clearAll");
  const exportBtn = $("exportBtn");
  const importFile = $("importFile");

  if (!taskList) {
    console.error("Critical: #taskList not found in HTML. Make sure index.html includes <ul id='taskList'>.");
    return;
  }

  // load tasks safely
  let tasks = [];
  try {
    const raw = localStorage.getItem("tasks");
    tasks = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(tasks)) tasks = [];
  } catch (e) {
    console.warn("Could not parse tasks from localStorage, resetting.", e);
    tasks = [];
  }

  const save = () => {
    try {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (e) {
      console.warn("Saving tasks failed:", e);
    }
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  function isOverdue(t) {
    return t && t.dueDate ? t.dueDate < todayISO() && !t.completed : false;
  }

  // Render tasks into #taskList
  function renderTasks() {
    const q = (searchInput && searchInput.value || "").trim().toLowerCase();
    const filter = (filterSelect && filterSelect.value) || "all";
    const sort = (sortSelect && sortSelect.value) || "created_desc";

    let list = tasks.slice();

    // Filter
    if (filter === "active") list = list.filter(t => !t.completed);
    if (filter === "completed") list = list.filter(t => t.completed);
    if (filter === "overdue") list = list.filter(isOverdue);
    if (filter === "high") list = list.filter(t => t.priority === "high");
    if (filter === "medium") list = list.filter(t => t.priority === "medium");
    if (filter === "low") list = list.filter(t => t.priority === "low");

    // Search
    if (q) list = list.filter(t => (t.text || "").toLowerCase().includes(q));

    // Sort
    if (sort === "created_desc") list.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "created_asc") list.sort((a, b) => a.createdAt - b.createdAt);
    if (sort === "due_asc") list.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    if (sort === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      list.sort((a, b) => order[a.priority] - order[b.priority]);
    }

    // clear
    taskList.innerHTML = "";

    list.forEach(t => {
      // defensive checks
      if (!t || !t.id) return;

      const li = document.createElement("li");
      li.className = "task-item";
      if (t.completed) li.classList.add("completed");
      if (isOverdue(t)) li.classList.add("overdue");

      const left = document.createElement("div");
      left.className = "left";

      const checkbox = document.createElement("div");
      checkbox.className = "checkbox" + (t.completed ? " checked" : "");
      checkbox.title = "Mark complete";
      checkbox.textContent = t.completed ? "✔" : "";
      checkbox.addEventListener("click", () => {
        t.completed = !t.completed;
        save(); renderTasks();
      });

      const textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.contentEditable = "true";
      textSpan.spellcheck = false;
      textSpan.innerText = t.text || "";
      textSpan.addEventListener("blur", () => {
        const newText = textSpan.innerText.trim();
        if (newText) t.text = newText;
        save(); renderTasks();
      });

      const meta = document.createElement("div");
      meta.className = "task-meta";

      const priorityBadge = document.createElement("span");
      priorityBadge.className = t.priority === "high" ? "priority-high" : t.priority === "medium" ? "priority-medium" : "priority-low";
      priorityBadge.textContent = (t.priority || "medium").toUpperCase();
      priorityBadge.style.cursor = "pointer";

      const dueEl = document.createElement("span");
      dueEl.className = "timestamp";
      dueEl.textContent = t.dueDate ? `Due: ${t.dueDate}` : "";

      const created = document.createElement("span");
      created.className = "timestamp";
      let createdText = "";
      try { createdText = new Date(t.createdAt).toLocaleString(); } catch(e) { createdText = ""; }
      created.textContent = createdText;

      meta.appendChild(priorityBadge);
      if (t.dueDate) meta.appendChild(dueEl);
      meta.appendChild(created);

      left.appendChild(checkbox);
      left.appendChild(textSpan);
      left.appendChild(meta);

      const btns = document.createElement("div");
      btns.className = "btns";

      const editBtn = document.createElement("button");
      editBtn.className = "btn edit small";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        textSpan.focus();
        const range = document.createRange();
        range.selectNodeContents(textSpan);
        const sel = window.getSelection();
        sel && (sel.removeAllRanges(), sel.addRange(range));
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn delete small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        tasks = tasks.filter(x => x.id !== t.id);
        save(); renderTasks();
      });

      // priority change on click
      priorityBadge.addEventListener("click", () => {
        t.priority = t.priority === "high" ? "medium" : t.priority === "medium" ? "low" : "high";
        save(); renderTasks();
      });

      // change due date quickly
      dueEl.addEventListener("click", () => {
        const newDate = prompt("Set due date (YYYY-MM-DD), empty to remove:", t.dueDate || "");
        if (newDate === null) return;
        t.dueDate = (newDate.trim() || undefined);
        save(); renderTasks();
      });

      btns.appendChild(editBtn);
      btns.appendChild(deleteBtn);

      li.appendChild(left);
      li.appendChild(btns);
      taskList.appendChild(li);

      // drag & drop (defensive)
      li.draggable = true;
      li.addEventListener("dragstart", (e) => {
        try { e.dataTransfer && e.dataTransfer.setData("text/plain", t.id); } catch (_) {}
        li.classList.add("dragging");
      });
      li.addEventListener("dragend", () => li.classList.remove("dragging"));
      li.addEventListener("drop", (e) => {
        try {
          e.preventDefault();
          const id = (e.dataTransfer && e.dataTransfer.getData("text/plain")) || "";
          const fromIndex = tasks.findIndex(x => x.id === id);
          const toIndex = tasks.findIndex(x => x.id === t.id);
          if (fromIndex >= 0 && toIndex >= 0) {
            const moved = tasks.splice(fromIndex, 1)[0];
            tasks.splice(toIndex, 0, moved);
            save(); renderTasks();
          }
        } catch (err) { /* ignore drop errors */ }
      });
      li.addEventListener("dragover", (e) => e.preventDefault());
    });
  }

  function addTask() {
    if (!taskInput) return;
    const text = (taskInput.value || "").trim();
    if (!text) return;
    const newTask = {
      id: uid(),
      text,
      completed: false,
      createdAt: Date.now(),
      dueDate: (dueInput && dueInput.value) || undefined,
      priority: (prioritySelect && prioritySelect.value) || "medium"
    };
    tasks.unshift(newTask);
    if (taskInput) taskInput.value = "";
    if (dueInput) dueInput.value = "";
    save(); renderTasks();
  }

  // bulk actions
  deleteCompletedBtn && deleteCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter(t => !t.completed);
    save(); renderTasks();
  });
  clearAllBtn && clearAllBtn.addEventListener("click", () => {
    if (!confirm("Clear all tasks?")) return;
    tasks = []; save(); renderTasks();
  });

  // export
  exportBtn && exportBtn.addEventListener("click", () => {
    try {
      const data = JSON.stringify(tasks, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Export failed"); }
  });

  // import
  importFile && importFile.addEventListener("change", (ev) => {
    try {
      const f = (ev.target && ev.target.files && ev.target.files[0]);
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(String(reader.result));
          if (Array.isArray(imported)) {
            const existingIds = new Set(tasks.map(t => t.id));
            imported.forEach((t) => {
              if (!t.id) t.id = uid();
              if (!existingIds.has(t.id)) tasks.push(t);
            });
            save(); renderTasks();
            alert("Imported tasks");
          } else alert("JSON must be an array");
        } catch (e) { alert("Invalid JSON file"); }
      };
      reader.readAsText(f);
    } catch (e) { alert("Import failed"); }
  });

  // search/filter/sort listeners
  searchInput && searchInput.addEventListener("input", () => renderTasks());
  filterSelect && filterSelect.addEventListener("change", () => renderTasks());
  sortSelect && sortSelect.addEventListener("change", () => renderTasks());

  addBtn && addBtn.addEventListener("click", addTask);
  taskInput && taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

  // initial render
  renderTasks();
})();
