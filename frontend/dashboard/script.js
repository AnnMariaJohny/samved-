/* Dashboard data comes from the Java API; never restore the old browser demo state. */
const api = window.SamvedApi;
const byId = id => document.getElementById(id);
let tasks = [];
let loadErrors = 0;

function textNode(parent, tag, value, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value == null ? '' : String(value);
  parent.appendChild(node);
  return node;
}

function showStatus(message) { byId('dashboard-status').textContent = message; }

function renderRoadmaps() {
  byId('roadmap-pct').hidden = true;
  byId('overall-progress-bar').parentElement.hidden = true;
  return window.SamvedRoadmapHub.mount(byId('roadmap-nodes-container'));
}

async function loadRoadmaps() {
  try {
    const ready = await renderRoadmaps();
    if (ready) showStatus('Your roadmap choices are ready.');
  } catch (error) {
    loadErrors += 1;
    byId('roadmap-nodes-container').textContent = `Roadmap unavailable: ${error.message}`;
  }
}

async function loadProgress() {
  try {
    const result = await api.request('GET', '/api/v1/progress/me');
    const percent = Math.min(100, Math.max(0, Number(result.percent) || 0));
    byId('roadmap-pct').textContent = `${percent}% complete`;
    byId('overall-progress-bar').style.width = `${percent}%`;
  } catch (error) { loadErrors += 1; byId('roadmap-pct').textContent = `Progress unavailable: ${error.message}`; }
}

function renderTasks() {
  const list = byId('task-list-container');
  list.replaceChildren();
  if (!tasks.length) { textNode(list, 'li', 'No tasks yet.'); return; }
  for (const task of tasks) {
    const item = textNode(list, 'li', '', `task-item ${task.status === 'COMPLETED' ? 'completed' : ''}`);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'COMPLETED';
    checkbox.setAttribute('aria-label', `Complete ${task.title}`);
    checkbox.addEventListener('change', async () => {
      try {
        await api.request('PATCH', `/api/v1/tasks/${encodeURIComponent(task.id)}/status`,
          {status: checkbox.checked ? 'COMPLETED' : 'PENDING'});
        await loadTasks();
        await loadNotifications();
        await loadProgress();
      } catch (error) { checkbox.checked = !checkbox.checked; showStatus(`Could not update task: ${error.message}`); }
    });
    item.appendChild(checkbox);
    textNode(item, 'span', task.title);
    const remove = textNode(item, 'button', 'Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${task.title}`);
    remove.addEventListener('click', async () => {
      try {
        await api.request('DELETE', `/api/v1/tasks/${encodeURIComponent(task.id)}`);
        await loadTasks();
        await loadNotifications();
        await loadProgress();
      } catch (error) { showStatus(`Could not remove task: ${error.message}`); }
    });
  }
}

function renderDeadlines() {
  const container = byId('deadlines-container');
  container.replaceChildren();
  const upcoming = tasks.filter(task => task.dueDate && task.status !== 'COMPLETED')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
  if (!upcoming.length) { textNode(container, 'p', 'No upcoming task deadlines.'); return; }
  for (const task of upcoming) textNode(container, 'p', `${task.title} — ${task.dueDate}`);
}

async function loadTasks() {
  try {
    const result = await api.request('GET', '/api/v1/tasks');
    tasks = Array.isArray(result) ? result : [];
    renderTasks();
    renderDeadlines();
  } catch (error) {
    loadErrors += 1;
    byId('task-list-container').textContent = `Tasks unavailable: ${error.message}`;
    byId('deadlines-container').textContent = 'Deadlines unavailable.';
  }
}

async function loadNotifications() {
  const container = byId('notifications-container');
  try {
    const items = await api.request('GET', '/api/v1/notifications');
    container.replaceChildren();
    byId('notification-count').textContent = `${items.filter(item => !item.readAt).length} unread`;
    if (!items.length) { textNode(container, 'p', 'No due-date reminders yet. Add a due date to a task.'); return; }
    for (const item of items) {
      const row = textNode(container, 'div', '', 'notification-row');
      textNode(row, 'p', `${item.message} (${item.dueDate})`);
      if (!item.readAt) {
        const button = textNode(row, 'button', 'Mark read', 'btn-sync');
        button.type = 'button';
        button.addEventListener('click', async () => {
          try {
            await api.request('PATCH', `/api/v1/notifications/${encodeURIComponent(item.id)}/read`);
            await loadNotifications();
          } catch (error) { showStatus(`Could not mark reminder read: ${error.message}`); }
        });
      }
    }
  } catch (error) {
    loadErrors += 1;
    container.textContent = `Reminders unavailable: ${error.message}`;
  }
}

async function loadRecommendations() {
  try {
    const result = await api.request('GET', '/api/v1/recommendations/me');
    const first = result.recommendations?.[0];
    byId('recommendation-summary').textContent = first
      ? `${first.careerTitle}: ${first.score}/100 rule overlap (${result.source || 'RULES'} ordering). ${result.guidance}`
      : result.guidance || 'Add profile details to see suggestions.';
    const skills = byId('recommended-skills-list');
    skills.replaceChildren();
    if (first) for (const skill of first.skillGaps || []) textNode(skills, 'span', skill, 'skill-chip');
  } catch (error) { loadErrors += 1; byId('recommendation-summary').textContent = `Guidance unavailable: ${error.message}`; }
}

async function loadOpportunities() {
  const container = byId('opportunities-grid');
  try {
    const page = await api.request('GET', '/api/v1/opportunities?size=3');
    container.replaceChildren();
    if (!page.content?.length) { textNode(container, 'p', 'No verified opportunities available yet.'); return; }
    for (const opportunity of page.content) {
      const card = textNode(container, 'article', '', 'opp-card');
      textNode(card, 'strong', opportunity.title);
      textNode(card, 'p', opportunity.organizer || 'Organizer not listed');
      textNode(card, 'p', opportunity.deadline ? `Deadline: ${opportunity.deadline}` : 'Deadline not listed');
      if (opportunity.matchedSignals?.length) textNode(card, 'p', `Related to: ${opportunity.matchedSignals.join(', ')}`);
      const link = textNode(card, 'a', 'Open original listing');
      const target = opportunity.applicationUrl || opportunity.sourceUrl;
      if (typeof target === 'string' && /^https:\/\//i.test(target)) {
        link.href = target;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else link.removeAttribute('href');
    }
  } catch (error) { loadErrors += 1; container.textContent = `Opportunities unavailable: ${error.message}`; }
}

byId('roadmap-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await api.request('POST', '/api/v1/roadmaps', {
      templateCode: byId('roadmap-template').value,
      goal: byId('roadmap-goal').value.trim() || null
    });
    byId('roadmap-goal').value = '';
    await loadRoadmaps();
    await loadProgress();
    showStatus('Roadmap saved.');
  } catch (error) { showStatus(`Could not create roadmap: ${error.message}`); }
});

byId('task-form').addEventListener('submit', async event => {
  event.preventDefault();
  const input = byId('new-task-input');
  const title = input.value.trim();
  if (!title) return;
  try {
    await api.request('POST', '/api/v1/tasks', {title});
    input.value = '';
    await loadTasks();
    await loadNotifications();
    await loadProgress();
    showStatus('Task saved.');
  } catch (error) { showStatus(`Could not create task: ${error.message}`); }
});

Promise.allSettled([loadRoadmaps(), loadProgress(), loadTasks(), loadNotifications(), loadRecommendations(), loadOpportunities()])
  .then(() => {
    if (byId('dashboard-status').textContent.startsWith('Loading')) {
      showStatus(loadErrors ? 'Some sections are unavailable. Sign in to the Java app and refresh.' : 'Dashboard loaded.');
    }
  });
