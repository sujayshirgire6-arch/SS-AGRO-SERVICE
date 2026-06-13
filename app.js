const STORAGE_KEY = "capracare-goat-manager-v1";

const sampleData = {
  goats: [
    {
      id: crypto.randomUUID(),
      tag: "D-014",
      sex: "Doe",
      breed: "Saanen",
      birthDate: "2023-02-10",
      weight: 54,
      status: "Milking",
      location: "North pen",
      notes: "High producer. Calm during milking."
    },
    {
      id: crypto.randomUUID(),
      tag: "B-002",
      sex: "Buck",
      breed: "Boer",
      birthDate: "2022-09-21",
      weight: 82,
      status: "Breeder",
      location: "Buck yard",
      notes: "Strong body condition."
    },
    {
      id: crypto.randomUUID(),
      tag: "D-019",
      sex: "Doe",
      breed: "Nubian",
      birthDate: "2023-11-05",
      weight: 41,
      status: "Pregnant",
      location: "Kidding pen",
      notes: "Watch appetite and minerals."
    },
    {
      id: crypto.randomUUID(),
      tag: "K-031",
      sex: "Kid",
      breed: "Saanen cross",
      birthDate: "2026-03-18",
      weight: 15,
      status: "Growing",
      location: "Nursery",
      notes: "Bottle feeding twice daily."
    }
  ],
  health: [],
  breeding: [],
  milk: [],
  tasks: [],
  finance: []
};

const today = new Date();
const iso = (date) => new Date(date).toISOString().slice(0, 10);
const addDays = (days) => iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));

sampleData.health = [
  {
    id: crypto.randomUUID(),
    goatId: sampleData.goats[0].id,
    date: addDays(-3),
    type: "Hoof trim",
    notes: "Front hooves trimmed, rear hooves checked.",
    followUp: addDays(45)
  },
  {
    id: crypto.randomUUID(),
    goatId: sampleData.goats[2].id,
    date: addDays(-1),
    type: "Pregnancy check",
    notes: "Normal condition. Increase clean bedding.",
    followUp: addDays(7)
  }
];

sampleData.breeding = [
  {
    id: crypto.randomUUID(),
    doeId: sampleData.goats[2].id,
    buckId: sampleData.goats[1].id,
    bredDate: "2026-01-20",
    dueDate: "2026-06-18",
    status: "Pregnant",
    notes: "Move to kidding pen one week before due date."
  }
];

sampleData.milk = Array.from({ length: 9 }, (_, index) => ({
  id: crypto.randomUUID(),
  goatId: sampleData.goats[0].id,
  date: addDays(index - 8),
  morning: +(1.7 + index * 0.04).toFixed(1),
  evening: +(1.4 + index * 0.03).toFixed(1),
  notes: index === 8 ? "Clean filter, normal taste." : ""
}));

sampleData.tasks = [
  {
    id: crypto.randomUUID(),
    title: "Prepare kidding kit",
    goatId: sampleData.goats[2].id,
    dueDate: addDays(1),
    category: "Breeding",
    priority: "High",
    done: false
  },
  {
    id: crypto.randomUUID(),
    title: "Order mineral blocks",
    goatId: "",
    dueDate: addDays(3),
    category: "Supplies",
    priority: "Medium",
    done: false
  },
  {
    id: crypto.randomUUID(),
    title: "Clean nursery bedding",
    goatId: sampleData.goats[3].id,
    dueDate: addDays(0),
    category: "Care",
    priority: "High",
    done: false
  }
];

sampleData.finance = [
  {
    id: crypto.randomUUID(),
    date: addDays(-6),
    type: "Income",
    category: "Milk sales",
    amount: 64,
    notes: "Weekly household deliveries"
  },
  {
    id: crypto.randomUUID(),
    date: addDays(-4),
    type: "Expense",
    category: "Feed",
    amount: 38,
    notes: "Pellets and hay"
  }
];

let state = loadState();
let activeView = "dashboard";
let modalMode = "goat";
let editingId = null;

const views = {
  dashboard: document.querySelector("#dashboardView"),
  herd: document.querySelector("#herdView"),
  health: document.querySelector("#healthView"),
  breeding: document.querySelector("#breedingView"),
  milk: document.querySelector("#milkView"),
  tasks: document.querySelector("#tasksView"),
  finance: document.querySelector("#financeView"),
  reports: document.querySelector("#reportsView")
};

const titles = {
  dashboard: "Dashboard",
  herd: "Herd",
  health: "Health",
  breeding: "Breeding",
  milk: "Milk",
  tasks: "Tasks",
  finance: "Finance",
  reports: "Reports"
};

const fieldSets = {
  goat: [
    ["tag", "Tag", "text", true],
    ["sex", "Sex", "select", true, ["Doe", "Buck", "Wether", "Kid"]],
    ["breed", "Breed", "text", true],
    ["birthDate", "Birth date", "date", true],
    ["weight", "Weight (kg)", "number", false],
    ["status", "Status", "select", true, ["Milking", "Pregnant", "Dry", "Breeder", "Growing", "Sold", "Watch"]],
    ["location", "Location", "text", false],
    ["notes", "Notes", "textarea", false, null, "full"]
  ],
  health: [
    ["goatId", "Goat", "goat", true],
    ["date", "Date", "date", true],
    ["type", "Record type", "select", true, ["Check", "Vaccination", "Treatment", "Deworming", "Hoof trim", "Injury", "Pregnancy check"]],
    ["followUp", "Follow-up date", "date", false],
    ["notes", "Notes", "textarea", false, null, "full"]
  ],
  breeding: [
    ["doeId", "Doe", "goatDoe", true],
    ["buckId", "Buck", "goatBuck", true],
    ["bredDate", "Bred date", "date", true],
    ["dueDate", "Due date", "date", false],
    ["status", "Status", "select", true, ["Planned", "Bred", "Pregnant", "Kidded", "Open"]],
    ["notes", "Notes", "textarea", false, null, "full"]
  ],
  milk: [
    ["goatId", "Doe", "goatDoe", true],
    ["date", "Date", "date", true],
    ["morning", "Morning liters", "number", false],
    ["evening", "Evening liters", "number", false],
    ["notes", "Notes", "textarea", false, null, "full"]
  ],
  task: [
    ["title", "Task", "text", true],
    ["goatId", "Goat", "goatOptional", false],
    ["dueDate", "Due date", "date", true],
    ["category", "Category", "select", true, ["Care", "Health", "Breeding", "Milk", "Supplies", "Repair", "Sales"]],
    ["priority", "Priority", "select", true, ["Low", "Medium", "High"]],
    ["done", "Status", "select", true, ["false", "true"]]
  ],
  finance: [
    ["date", "Date", "date", true],
    ["type", "Type", "select", true, ["Income", "Expense"]],
    ["category", "Category", "text", true],
    ["amount", "Amount", "number", true],
    ["notes", "Notes", "textarea", false, null, "full"]
  ]
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(sampleData);
  try {
    return { ...structuredClone(sampleData), ...JSON.parse(stored) };
  } catch {
    return structuredClone(sampleData);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function goatName(id) {
  const goat = state.goats.find((item) => item.id === id);
  return goat ? goat.tag : "General";
}

function goatOptions(filter) {
  return state.goats
    .filter((goat) => {
      if (filter === "doe") return goat.sex === "Doe";
      if (filter === "buck") return goat.sex === "Buck";
      return true;
    })
    .map((goat) => `<option value="${goat.id}">${goat.tag} - ${goat.breed}</option>`)
    .join("");
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
}

function daysUntil(dateValue) {
  const target = new Date(`${dateValue}T00:00:00`);
  const current = new Date(iso(today) + "T00:00:00");
  return Math.round((target - current) / 86400000);
}

function matchesSearch(goat) {
  const query = document.querySelector("#searchInput").value.trim().toLowerCase();
  if (!query) return true;
  return [goat.tag, goat.breed, goat.status, goat.location, goat.notes]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function setView(viewName) {
  activeView = viewName;
  Object.entries(views).forEach(([name, element]) => element.classList.toggle("active", name === viewName));
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  document.querySelector("#pageTitle").textContent = titles[viewName];
}

function render() {
  renderStats();
  renderDashboard();
  renderHerd();
  renderHealth();
  renderBreeding();
  renderMilk();
  renderTasks();
  renderFinance();
  renderReports();
}

function renderStats() {
  const does = state.goats.filter((goat) => goat.sex === "Doe").length;
  const kids = state.goats.filter((goat) => goat.sex === "Kid" || goat.status === "Growing").length;
  const dueSoon = state.breeding.filter((item) => item.dueDate && daysUntil(item.dueDate) <= 14 && daysUntil(item.dueDate) >= 0).length;
  const overdueTasks = state.tasks.filter((task) => !task.done && daysUntil(task.dueDate) < 0).length;

  document.querySelector("#statsGrid").innerHTML = [
    ["Total goats", state.goats.length],
    ["Does", does],
    ["Kids growing", kids],
    ["Kidding soon", dueSoon],
    ["Overdue tasks", overdueTasks]
  ]
    .map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderDashboard() {
  const todayTasks = state.tasks
    .filter((task) => !task.done && daysUntil(task.dueDate) <= 2)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  document.querySelector("#todayList").innerHTML = todayTasks.length
    ? todayTasks
        .map((task) => {
          const day = daysUntil(task.dueDate);
          const label = day < 0 ? "Overdue" : day === 0 ? "Today" : `In ${day} day${day === 1 ? "" : "s"}`;
          return `<article class="list-row"><strong>${task.title}<span class="badge ${day < 0 ? "alert" : "warn"}">${label}</span></strong><span class="meta">${goatName(task.goatId)} - ${task.category}</span></article>`;
        })
        .join("")
    : `<p class="empty">No urgent tasks. The daily list is clear.</p>`;

  const watchItems = [
    ...state.breeding
      .filter((item) => item.dueDate && daysUntil(item.dueDate) <= 21 && daysUntil(item.dueDate) >= 0)
      .map((item) => ({
        title: `${goatName(item.doeId)} due for kidding`,
        text: `${item.dueDate} with ${goatName(item.buckId)}`,
        badge: `${daysUntil(item.dueDate)} days`
      })),
    ...state.health
      .filter((item) => item.followUp && daysUntil(item.followUp) <= 7 && daysUntil(item.followUp) >= 0)
      .map((item) => ({
        title: `${goatName(item.goatId)} follow-up`,
        text: item.notes || item.type,
        badge: item.followUp
      }))
  ];

  document.querySelector("#watchList").innerHTML = watchItems.length
    ? watchItems.map((item) => `<article class="list-row"><strong>${item.title}<span class="badge warn">${item.badge}</span></strong><span class="meta">${item.text}</span></article>`).join("")
    : `<p class="empty">No watch items for the next week.</p>`;
}

function renderHerd() {
  const goats = state.goats.filter(matchesSearch);
  document.querySelector("#herdGrid").innerHTML = goats.length
    ? goats
        .map(
          (goat) => `<article class="goat-card">
            <header>
              <div><div class="goat-name">${goat.tag}</div><span class="meta">${goat.breed}</span></div>
              <span class="badge">${goat.status}</span>
            </header>
            <dl>
              <div><dt>Sex</dt><dd>${goat.sex}</dd></div>
              <div><dt>Weight</dt><dd>${goat.weight || "-"} kg</dd></div>
              <div><dt>Born</dt><dd>${goat.birthDate || "-"}</dd></div>
              <div><dt>Location</dt><dd>${goat.location || "-"}</dd></div>
            </dl>
            <p class="meta">${goat.notes || "No notes yet."}</p>
            <div class="card-actions">
              <button class="ghost" data-edit="goat" data-id="${goat.id}" type="button">Edit</button>
              <button class="ghost" data-delete="goat" data-id="${goat.id}" type="button">Delete</button>
            </div>
          </article>`
        )
        .join("")
    : `<p class="empty">No goats match the current search.</p>`;
}

function renderHealth() {
  const records = [...state.health].sort((a, b) => b.date.localeCompare(a.date));
  document.querySelector("#healthTimeline").innerHTML = records.length
    ? records
        .map(
          (item) => `<article class="timeline-item">
            <strong>${item.date}</strong>
            <div><h3>${item.type} - ${goatName(item.goatId)}</h3><p class="meta">${item.notes || "No notes."}</p></div>
            <span class="badge ${item.followUp && daysUntil(item.followUp) <= 7 ? "warn" : ""}">${item.followUp ? `Follow ${item.followUp}` : "Complete"}</span>
          </article>`
        )
        .join("")
    : `<p class="empty">No health records yet.</p>`;
}

function renderBreeding() {
  document.querySelector("#breedingTable").innerHTML = state.breeding.length
    ? state.breeding
        .map(
          (item) => `<article class="table-card">
            <strong>${goatName(item.doeId)} x ${goatName(item.buckId)}</strong>
            <span>${item.bredDate}</span>
            <span>${item.dueDate || "-"}</span>
            <span class="badge ${item.dueDate && daysUntil(item.dueDate) <= 14 ? "warn" : ""}">${item.status}</span>
            <span class="meta">${item.notes || ""}</span>
          </article>`
        )
        .join("")
    : `<p class="empty">No breeding records yet.</p>`;
}

function renderMilk() {
  const lastSeven = Array.from({ length: 7 }, (_, index) => addDays(index - 6));
  const totals = lastSeven.map((date) => {
    return state.milk
      .filter((entry) => entry.date === date)
      .reduce((sum, entry) => sum + Number(entry.morning || 0) + Number(entry.evening || 0), 0);
  });
  const max = Math.max(...totals, 1);

  document.querySelector("#milkChart").innerHTML = lastSeven
    .map((date, index) => {
      const value = totals[index];
      return `<div class="bar"><div class="bar-fill" style="height:${Math.max(8, (value / max) * 210)}px"></div><strong>${value.toFixed(1)}L</strong><span class="meta">${date.slice(5)}</span></div>`;
    })
    .join("");

  document.querySelector("#milkList").innerHTML = [...state.milk]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map((entry) => `<article class="list-row"><strong>${goatName(entry.goatId)}<span>${(Number(entry.morning || 0) + Number(entry.evening || 0)).toFixed(1)}L</span></strong><span class="meta">${entry.date} - AM ${entry.morning || 0}L, PM ${entry.evening || 0}L</span></article>`)
    .join("") || `<p class="empty">No milk entries yet.</p>`;
}

function renderTasks() {
  const columns = [
    ["Overdue", (task) => !task.done && daysUntil(task.dueDate) < 0],
    ["Upcoming", (task) => !task.done && daysUntil(task.dueDate) >= 0],
    ["Done", (task) => task.done]
  ];

  document.querySelector("#taskBoard").innerHTML = columns
    .map(([title, filter]) => {
      const tasks = state.tasks.filter(filter).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return `<section class="task-column"><h3>${title}</h3>${
        tasks.length
          ? tasks
              .map(
                (task) => `<article class="task-card">
                  <strong>${task.title}</strong>
                  <span class="meta">${task.dueDate} - ${goatName(task.goatId)}</span>
                  <span class="badge ${task.priority === "High" ? "alert" : task.priority === "Medium" ? "warn" : ""}">${task.priority}</span>
                  <button class="ghost" data-toggle-task="${task.id}" type="button">${task.done ? "Reopen" : "Mark done"}</button>
                </article>`
              )
              .join("")
          : `<p class="empty">Nothing here.</p>`
      }</section>`;
    })
    .join("");
}

function renderFinance() {
  const income = state.finance.filter((entry) => entry.type === "Income").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expense = state.finance.filter((entry) => entry.type === "Expense").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  document.querySelector("#financeStats").innerHTML = [
    ["Income", money(income)],
    ["Expenses", money(expense)],
    ["Balance", money(income - expense)]
  ]
    .map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");

  document.querySelector("#financeList").innerHTML = [...state.finance]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (entry) => `<article class="table-card">
        <strong>${entry.category}</strong>
        <span>${entry.date}</span>
        <span class="badge ${entry.type === "Expense" ? "alert" : ""}">${entry.type}</span>
        <span>${money(entry.amount)}</span>
        <span class="meta">${entry.notes || ""}</span>
      </article>`
    )
    .join("") || `<p class="empty">No finance entries yet.</p>`;
}

function renderReports() {
  const activeGoats = state.goats.filter((goat) => goat.status !== "Sold").length;
  const milkingDoes = state.goats.filter((goat) => goat.status === "Milking").length;
  const milkTotal = state.milk.reduce((sum, entry) => sum + Number(entry.morning || 0) + Number(entry.evening || 0), 0);
  const nextKidding = [...state.breeding].filter((item) => item.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const healthDue = state.health.filter((item) => item.followUp && daysUntil(item.followUp) >= 0).sort((a, b) => a.followUp.localeCompare(b.followUp)).slice(0, 4);

  document.querySelector("#reportsGrid").innerHTML = `
    <article class="report-card">
      <h2>Herd Snapshot</h2>
      <ul>
        <li>${activeGoats} active goats in care</li>
        <li>${milkingDoes} does currently milking</li>
        <li>${state.goats.filter((goat) => goat.status === "Pregnant").length} pregnant does</li>
      </ul>
    </article>
    <article class="report-card">
      <h2>Milk Summary</h2>
      <ul>
        <li>${milkTotal.toFixed(1)} liters recorded</li>
        <li>${state.milk.length} production entries</li>
        <li>${state.milk.length ? (milkTotal / state.milk.length).toFixed(1) : "0.0"} liters per entry average</li>
      </ul>
    </article>
    <article class="report-card">
      <h2>Breeding Outlook</h2>
      <ul>
        <li>${nextKidding ? `${goatName(nextKidding.doeId)} due on ${nextKidding.dueDate}` : "No upcoming kidding dates"}</li>
        <li>${state.breeding.length} breeding records</li>
      </ul>
    </article>
    <article class="report-card">
      <h2>Health Follow-Ups</h2>
      ${
        healthDue.length
          ? `<ul>${healthDue.map((item) => `<li>${goatName(item.goatId)} on ${item.followUp}: ${item.type}</li>`).join("")}</ul>`
          : `<p class="meta">No scheduled health follow-ups.</p>`
      }
    </article>
  `;
}

function openModal(mode, record = null) {
  modalMode = mode;
  editingId = record?.id || null;
  document.querySelector("#modalTitle").textContent = `${record ? "Edit" : "Add"} ${mode === "goat" ? "goat" : mode} record`;
  document.querySelector("#modalFields").innerHTML = fieldSets[mode].map((field) => renderField(field, record)).join("");
  document.querySelector("#entryModal").showModal();
}

function renderField([name, label, type, required, options, wide], record) {
  const value = record?.[name] ?? defaultValue(name, type);
  const requiredAttr = required ? "required" : "";
  const className = wide === "full" ? "field full" : "field";
  let input = "";

  if (type === "textarea") {
    input = `<textarea id="${name}" name="${name}" ${requiredAttr}>${value}</textarea>`;
  } else if (type === "select") {
    input = `<select id="${name}" name="${name}" ${requiredAttr}>${options.map((option) => `<option value="${option}" ${String(value) === String(option) ? "selected" : ""}>${option === "true" ? "Done" : option === "false" ? "Open" : option}</option>`).join("")}</select>`;
  } else if (type.startsWith("goat")) {
    const filter = type === "goatDoe" ? "doe" : type === "goatBuck" ? "buck" : "";
    const optional = type === "goatOptional" ? `<option value="">General</option>` : "";
    input = `<select id="${name}" name="${name}" ${requiredAttr}>${optional}${goatOptions(filter)}</select>`;
    setTimeout(() => {
      const select = document.querySelector(`#${name}`);
      if (select) select.value = value;
    });
  } else {
    input = `<input id="${name}" name="${name}" type="${type}" value="${value}" ${type === "number" ? 'step="0.1"' : ""} ${requiredAttr} />`;
  }

  return `<div class="${className}"><label for="${name}">${label}</label>${input}</div>`;
}

function defaultValue(name, type) {
  if (name === "date" || name === "dueDate" || name === "bredDate") return iso(today);
  if (name === "done") return "false";
  if (type === "goat" || type === "goatDoe" || type === "goatBuck") return state.goats[0]?.id || "";
  return "";
}

function saveModal(event) {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    document.querySelector("#entryModal").close();
    return;
  }

  const form = new FormData(event.currentTarget);
  const entry = Object.fromEntries(form.entries());
  const numericFields = ["weight", "morning", "evening", "amount"];
  numericFields.forEach((field) => {
    if (field in entry) entry[field] = Number(entry[field] || 0);
  });
  if ("done" in entry) entry.done = entry.done === "true";

  const collectionName = modalMode === "task" ? "tasks" : modalMode;
  const collection = state[collectionName];
  if (editingId) {
    const index = collection.findIndex((item) => item.id === editingId);
    collection[index] = { ...collection[index], ...entry };
  } else {
    collection.push({ id: crypto.randomUUID(), ...entry });
  }

  persist();
  render();
  document.querySelector("#entryModal").close();
}

function deleteRecord(collectionName, id) {
  if (!confirm("Delete this record?")) return;
  state[collectionName] = state[collectionName].filter((item) => item.id !== id);
  persist();
  render();
}

function bindEvents() {
  document.querySelector("#nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) setView(button.dataset.view);
  });

  document.body.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-open-modal]");
    const shortcut = event.target.closest("[data-view-shortcut]");
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");
    const taskToggle = event.target.closest("[data-toggle-task]");

    if (openButton) openModal(openButton.dataset.openModal);
    if (shortcut) setView(shortcut.dataset.viewShortcut);
    if (editButton) {
      const collectionName = editButton.dataset.edit;
      const record = state[collectionName].find((item) => item.id === editButton.dataset.id);
      openModal(collectionName, record);
    }
    if (deleteButton) deleteRecord(deleteButton.dataset.delete, deleteButton.dataset.id);
    if (taskToggle) {
      const task = state.tasks.find((item) => item.id === taskToggle.dataset.toggleTask);
      task.done = !task.done;
      persist();
      render();
    }
  });

  document.querySelector("#quickAddBtn").addEventListener("click", () => openModal("goat"));
  document.querySelector("#entryForm").addEventListener("submit", saveModal);
  document.querySelector("#searchInput").addEventListener("input", renderHerd);
  document.querySelector("#printBtn").addEventListener("click", () => window.print());
  document.querySelector("#exportBtn").addEventListener("click", exportData);
  document.querySelector("#importInput").addEventListener("change", importData);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `capracare-backup-${iso(today)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = JSON.parse(reader.result);
      persist();
      render();
    } catch {
      alert("That file could not be imported.");
    }
  };
  reader.readAsText(file);
}

bindEvents();
render();
