/* Deadlines and reminders are read from the Java API, scoped to the signed-in student. */
const api = window.SamvedApi;
const byId = id => document.getElementById(id);

function addText(parent, tag, value) {
  const element = document.createElement(tag);
  element.textContent = value;
  parent.appendChild(element);
  return element;
}

function status(message) { byId('deadline-status').textContent = message; }

async function loadTasks() {
  const list = byId('deadline-list');
  const tasks = await api.request('GET', '/api/v1/tasks');
  list.replaceChildren();
  const dueTasks = tasks.filter(task => task.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (!dueTasks.length) { addText(list, 'p', 'No deadlines saved yet.'); return; }
  for (const task of dueTasks) {
    const row = addText(list, 'div', '');
    row.className = 'card';
    addText(row, 'strong', task.title);
    addText(row, 'p', `Due ${task.dueDate} · ${task.status.replaceAll('_', ' ')}`);
    if (task.description) addText(row, 'p', task.description);
    if (task.status !== 'COMPLETED') {
      const button = addText(row, 'button', 'Mark complete');
      button.type = 'button';
      button.className = 'btn-sync';
      button.addEventListener('click', async () => {
        try {
          await api.request('PATCH', `/api/v1/tasks/${encodeURIComponent(task.id)}/status`, {status: 'COMPLETED'});
          await refresh();
        } catch (error) { status(`Could not update task: ${error.message}`); }
      });
    }
  }
}

async function loadNotifications() {
  const list = byId('notification-list');
  const items = await api.request('GET', '/api/v1/notifications');
  list.replaceChildren();
  byId('unread-count').textContent = `${items.filter(item => !item.readAt).length} unread`;
  if (!items.length) { addText(list, 'p', 'No reminders yet.'); return; }
  for (const item of items) {
    const row = addText(list, 'div', '');
    row.className = 'card';
    addText(row, 'p', `${item.message} (${item.dueDate})`);
    if (!item.readAt) {
      const button = addText(row, 'button', 'Mark read');
      button.type = 'button';
      button.className = 'btn-sync';
      button.addEventListener('click', async () => {
        try {
          await api.request('PATCH', `/api/v1/notifications/${encodeURIComponent(item.id)}/read`);
          await loadNotifications();
        } catch (error) { status(`Could not mark reminder read: ${error.message}`); }
      });
    }
  }
}

async function refresh() {
  const results = await Promise.allSettled([loadTasks(), loadNotifications()]);
  const errors = results.filter(result => result.status === 'rejected');
  status(errors.length ? `Some data is unavailable: ${errors[0].reason.message}` : 'Deadlines and reminders are up to date.');
}

byId('deadline-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await api.request('POST', '/api/v1/tasks', {
      title: byId('deadline-title').value.trim(),
      dueDate: byId('deadline-date').value,
      description: byId('deadline-description').value.trim() || null
    });
    event.target.reset();
    await refresh();
    status('Task and deadline saved.');
  } catch (error) { status(`Could not save deadline: ${error.message}`); }
});

refresh();
