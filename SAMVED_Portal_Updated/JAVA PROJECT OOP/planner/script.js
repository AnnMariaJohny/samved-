(() => {
  const KEYS = {
    tasks: 'samved.planner.tasks.v1',
    deadlines: 'samved.planner.deadlines.v1',
  };
  const today = new Date();
  const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const dateInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const plusDays = (amount) => { const date = new Date(); date.setDate(date.getDate() + amount); return dateInputValue(date); };
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch { return fallback; }
  };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  let tasks = read(KEYS.tasks, [
    { id: newId(), title: 'Read literature review paper', date: plusDays(0), done: false },
    { id: newId(), title: 'Meeting with academic advisor', date: plusDays(1), done: true },
    { id: newId(), title: 'Draft methodology section', date: plusDays(2), done: false },
  ]);
  let deadlines = read(KEYS.deadlines, [
    { id: newId(), title: 'Research Abstract Submission', date: plusDays(3) },
    { id: newId(), title: 'Internship Application', date: plusDays(14) },
  ]);

  const taskList = document.querySelector('#task-list');
  const deadlineList = document.querySelector('#deadline-list');
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const dateLabel = (dateString) => new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const daysUntil = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((due - start) / 86400000);
  };

  function renderTasks() {
    taskList.replaceChildren();
    tasks.forEach((task) => {
      const row = make('li', `planner-item${task.done ? ' is-done' : ''}`);
      const check = make('input'); check.type = 'checkbox'; check.checked = task.done; check.setAttribute('aria-label', `Mark ${task.title} complete`);
      check.addEventListener('change', () => { task.done = check.checked; save(KEYS.tasks, tasks); renderTasks(); });
      const copy = make('div', 'planner-item-copy'); copy.append(make('strong', 'planner-item-title', task.title));
      if (task.date) copy.append(make('span', 'planner-item-meta', dateLabel(task.date)));
      const remove = make('button', 'item-remove', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${task.title}`);
      remove.addEventListener('click', () => { tasks = tasks.filter((item) => item.id !== task.id); save(KEYS.tasks, tasks); renderTasks(); });
      row.append(check, copy, remove); taskList.append(row);
    });
    document.querySelector('#task-empty').hidden = tasks.length > 0;
    document.querySelector('#task-count').textContent = `${tasks.filter((task) => !task.done).length} remaining`;
  }

  function renderDeadlines() {
    deadlineList.replaceChildren();
    [...deadlines].sort((a, b) => a.date.localeCompare(b.date)).forEach((deadline) => {
      const remaining = daysUntil(deadline.date);
      const row = make('li', 'planner-item deadline-item-row');
      const copy = make('div', 'planner-item-copy'); copy.append(make('strong', '', deadline.title), make('span', 'deadline-date', dateLabel(deadline.date)));
      const status = remaining < 0 ? `${Math.abs(remaining)}d overdue` : remaining === 0 ? 'Due today' : `${remaining}d left`;
      const badge = make('span', `days-pill${remaining <= 3 ? ' urgent' : remaining <= 7 ? ' soon' : ''}`, status);
      const remove = make('button', 'item-remove', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${deadline.title}`);
      remove.addEventListener('click', () => { deadlines = deadlines.filter((item) => item.id !== deadline.id); save(KEYS.deadlines, deadlines); renderDeadlines(); });
      row.append(copy, badge, remove); deadlineList.append(row);
    });
    document.querySelector('#deadline-empty').hidden = deadlines.length > 0;
    document.querySelector('#deadline-count').textContent = `${deadlines.length} upcoming`;
  }

  document.querySelector('#task-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    tasks.unshift({ id: newId(), title: data.get('title').trim(), date: data.get('date'), done: false });
    save(KEYS.tasks, tasks); renderTasks(); form.reset();
  });
  document.querySelector('#deadline-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    deadlines.push({ id: newId(), title: data.get('title').trim(), date: data.get('date') });
    save(KEYS.deadlines, deadlines); renderDeadlines(); form.reset();
  });
  document.querySelectorAll('input[type="date"]').forEach((input) => { input.min = dateInputValue(today); });
  document.querySelector('#today-label').textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  try {
    const profile = JSON.parse(localStorage.getItem('samved.student-profile.v1'));
    if (profile?.name) {
      document.querySelector('#sidebar-name').textContent = profile.name;
      document.querySelector('#sidebar-avatar').textContent = profile.name.trim().charAt(0).toUpperCase();
      document.querySelector('#header-profile-name').textContent = profile.name;
    }
  } catch { /* Use the page's default student name. */ }
  renderTasks(); renderDeadlines();
})();
