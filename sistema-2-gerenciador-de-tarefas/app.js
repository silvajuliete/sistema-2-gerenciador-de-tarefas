const STORAGE_KEY = "meu_dia_tarefas_v1";
let tasks = loadTasks();
const $ = id => document.getElementById(id);
const form = $("taskForm");

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function showToast(message) {
  const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2300);
}
function formatDate(date) {
  if (!date) return "Sem prazo";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}
function isOverdue(task) {
  if (!task.date || task.done) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.date + "T00:00:00") < today;
}
function render() {
  const done = tasks.filter(t => t.done).length;
  const pending = tasks.length - done;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $("totalCount").textContent = tasks.length;
  $("pendingCount").textContent = pending;
  $("doneCount").textContent = done;
  $("progressPercent").textContent = percent + "%";
  $("progressBar").style.width = percent + "%";
  const filter = $("statusFilter").value;
  const visible = tasks.filter(t => filter === "todas" || (filter === "concluida" ? t.done : !t.done))
    .sort((a,b) => Number(a.done)-Number(b.done) || (a.date || "9999").localeCompare(b.date || "9999"));
  $("taskList").innerHTML = visible.map(t => `
    <article class="task-item ${t.done ? "completed" : ""}">
      <input class="task-check" type="checkbox" data-action="toggle" data-id="${t.id}" ${t.done ? "checked" : ""} aria-label="Marcar tarefa">
      <div><div class="task-title">${escapeHTML(t.title)}</div>
        ${t.description ? `<p class="task-description">${escapeHTML(t.description)}</p>` : ""}
        <div class="task-meta"><span class="tag ${t.priority}">Prioridade ${t.priority}</span><span class="tag ${isOverdue(t) ? "overdue" : ""}">${isOverdue(t) ? "Prazo vencido · " : "Prazo · "}${formatDate(t.date)}</span><span class="tag">${t.done ? "Concluída" : "Pendente"}</span></div>
      </div>
      <div class="task-actions"><button class="action-btn" data-action="edit" data-id="${t.id}">Editar</button><button class="action-btn delete" data-action="delete" data-id="${t.id}">Excluir</button></div>
    </article>`).join("");
  $("emptyMessage").classList.toggle("hidden", visible.length > 0);
}
function resetForm() {
  form.reset(); $("taskId").value = ""; $("formTitle").textContent = "Adicionar tarefa";
  $("saveTaskBtn").textContent = "＋ Adicionar tarefa"; $("cancelEditBtn").classList.add("hidden");
}
function editTask(task) {
  $("taskId").value = task.id; $("taskTitle").value = task.title;
  $("taskDescription").value = task.description; $("taskPriority").value = task.priority;
  $("taskDate").value = task.date; $("formTitle").textContent = "Editar tarefa";
  $("saveTaskBtn").textContent = "Salvar alterações"; $("cancelEditBtn").classList.remove("hidden");
  $("taskTitle").focus(); window.scrollTo({top:0,behavior:"smooth"});
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const id = $("taskId").value;
  const oldTask = tasks.find(t => t.id === id);
  const task = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    title: $("taskTitle").value.trim(),
    description: $("taskDescription").value.trim(),
    priority: $("taskPriority").value,
    date: $("taskDate").value,
    done: oldTask ? oldTask.done : false
  };
  if (!task.title) { showToast("Informe o nome da tarefa."); return; }
  if (id) { tasks = tasks.map(t => t.id === id ? task : t); showToast("Tarefa atualizada."); }
  else { tasks.push(task); showToast("Tarefa adicionada."); }
  saveTasks(); resetForm(); render();
});
$("cancelEditBtn").addEventListener("click", resetForm);
$("statusFilter").addEventListener("change", render);
$("taskList").addEventListener("click", e => {
  const control = e.target.closest("[data-action]");
  if (!control) return;
  const task = tasks.find(t => t.id === control.dataset.id);
  if (!task) return;
  if (control.dataset.action === "edit") editTask(task);
  if (control.dataset.action === "delete" && confirm(`Deseja excluir "${task.title}"?`)) {
    tasks = tasks.filter(t => t.id !== task.id); saveTasks(); render(); showToast("Tarefa excluída.");
  }
});
$("taskList").addEventListener("change", e => {
  const control = e.target.closest('[data-action="toggle"]');
  if (!control) return;
  const task = tasks.find(t => t.id === control.dataset.id);
  if (task) { task.done = control.checked; saveTasks(); render(); showToast(task.done ? "Tarefa concluída!" : "Tarefa reaberta."); }
});
const now = new Date();
$("todayLabel").textContent = now.toLocaleDateString("pt-BR", {weekday:"long"});
$("todayDate").textContent = now.toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"});
render();
