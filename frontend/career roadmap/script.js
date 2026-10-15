/* Shared browser controller for the four Developer A pages. Backend logic stays in Java. */
const samvedPage = decodeURIComponent(location.pathname).toLowerCase();
const samvedView = samvedPage.includes('daily tasks') ? 'tasks' :
  samvedPage.includes('progress tracker') ? 'progress' :
  samvedPage.includes('oppertunity page') ? 'opportunities' : 'roadmap';
let samvedRoadmaps = [];
let samvedTasks = [];
let samvedOpportunities = [];
let selectedOpportunityType = null;

const byId = id => document.getElementById(id);
const setText = (id, value) => { if (byId(id)) byId(id).textContent = value; };
const clear = id => { if (byId(id)) byId(id).replaceChildren(); };
const api = (method, path, body) => window.SamvedApi.request(method, path, body);

function showMessage(container, message) {
  if (!container) return;
  container.replaceChildren();
  const line = document.createElement('p');
  line.textContent = message;
  line.setAttribute('role', 'status');
  container.append(line);
}

function reportError(error) {
  const message = error?.message || 'The server could not complete this request.';
  showMessage(byId('samved-status'), message);
}

function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.nav-menu li').forEach(item => item.classList.remove('active'));
  byId(`view-${viewName}`)?.classList.add('active');
  byId(`nav-${viewName}`)?.classList.add('active');
  const names = {roadmap: 'Career Roadmap', tasks: 'Daily Tasks', progress: 'Progress Tracker', opportunities: 'Opportunities'};
  setText('page-title', names[viewName] || 'SAMVED');
}

function milestoneCard(milestone) {
  const card = document.createElement('article');
  card.className = `stage-card ${milestone.status === 'COMPLETED' ? 'completed' : milestone.status === 'IN_PROGRESS' ? 'active' : 'locked'}`;
  const title = document.createElement('h3'); title.textContent = milestone.title;
  const description = document.createElement('p'); description.textContent = milestone.description;
  const status = document.createElement('span');
  status.className = 'stage-badge'; status.textContent = milestone.status.replaceAll('_', ' ');
  const action = document.createElement('button');
  action.className = 'btn-sm btn-complete';
  action.type = 'button';
  action.textContent = milestone.status === 'COMPLETED' ? 'Mark pending' : 'Mark completed';
  action.addEventListener('click', async () => {
    try {
      await api('PATCH', `/api/v1/milestones/${milestone.id}/status`,
        {status: milestone.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'});
      await refreshAll();
    } catch (error) { reportError(error); }
  });
  card.append(title, status, description, action);
  return card;
}

function renderRoadmap() {
  const holder = byId('roadmap-stages-container');
  if (holder) window.SamvedRoadmapHub.mount(holder);
}

function taskCard(task) {
  const card = document.createElement('article'); card.className = 'single-task-card';
  const title = document.createElement('h3'); title.textContent = task.title;
  const description = document.createElement('p'); description.textContent = task.description || 'No description';
  const date = document.createElement('p'); date.textContent = task.dueDate ? `Due ${task.dueDate}` : 'No due date';
  const status = document.createElement('span'); status.textContent = task.status.replaceAll('_', ' ');
  const actions = document.createElement('div'); actions.className = 'task-card-actions';
  const complete = document.createElement('button'); complete.type = 'button'; complete.textContent = task.status === 'COMPLETED' ? 'Undo' : 'Complete';
  complete.addEventListener('click', () => toggleTaskComplete(task.id));
  const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.addEventListener('click', () => editTask(task.id));
  const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete'; remove.addEventListener('click', () => deleteTask(task.id));
  actions.append(complete, edit, remove); card.append(title, status, description, date, actions);
  return card;
}

function renderTasks() {
  const grid = byId('full-task-grid');
  if (grid) {
    grid.replaceChildren();
    if (!samvedTasks.length) showMessage(grid, 'No tasks yet. Create your first task above.');
    else samvedTasks.forEach(task => grid.append(taskCard(task)));
  }
  setText('task-count-badge', `${samvedTasks.length} Tasks`);
  const quick = byId('quick-task-list-container') || byId('task-list-container');
  if (quick) {
    quick.replaceChildren();
    samvedTasks.slice(0, 3).forEach(task => { const li = document.createElement('li'); li.textContent = task.title; quick.append(li); });
  }
}

async function saveTask(event) {
  event.preventDefault();
  const id = byId('task-edit-id')?.value;
  const current = samvedTasks.find(task => String(task.id) === id);
  const payload = {
    roadmapId: current?.roadmapId || null, milestoneId: current?.milestoneId || null,
    title: byId('task-title').value.trim(),
    description: byId('task-desc')?.value.trim() || null,
    dueDate: byId('task-deadline')?.value || null
  };
  try {
    const saved = await api(id ? 'PUT' : 'POST', id ? `/api/v1/tasks/${id}` : '/api/v1/tasks', payload);
    const status = byId('task-status')?.value;
    const normalized = status?.toUpperCase().replaceAll(' ', '_');
    if (normalized && normalized !== saved.status)
      await api('PATCH', `/api/v1/tasks/${saved.id}/status`, {status: normalized});
    resetTaskForm(); await refreshAll();
  } catch (error) { reportError(error); }
}

function editTask(id) {
  const task = samvedTasks.find(item => item.id === id);
  if (!task) return;
  byId('task-edit-id').value = task.id;
  byId('task-title').value = task.title;
  byId('task-desc').value = task.description || '';
  byId('task-deadline').value = task.dueDate || '';
  byId('task-status').value = task.status === 'IN_PROGRESS' ? 'In Progress' : task.status === 'COMPLETED' ? 'Completed' : 'Pending';
  setText('task-form-heading', 'Edit Task');
  byId('task-title').focus();
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try { await api('DELETE', `/api/v1/tasks/${id}`); await refreshAll(); }
  catch (error) { reportError(error); }
}

async function toggleTaskComplete(id) {
  const task = samvedTasks.find(item => item.id === id);
  if (!task) return;
  try {
    await api('PATCH', `/api/v1/tasks/${id}/status`, {status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'});
    await refreshAll();
  } catch (error) { reportError(error); }
}

function resetTaskForm() {
  byId('task-form')?.reset();
  if (byId('task-edit-id')) byId('task-edit-id').value = '';
  setText('task-form-heading', 'Create New Task');
}

async function addNewTask() {
  const input = byId('new-task-input');
  if (!input?.value.trim()) return;
  try { await api('POST', '/api/v1/tasks', {title: input.value.trim()}); input.value = ''; await refreshAll(); }
  catch (error) { reportError(error); }
}

function renderProgress(progress) {
  const percent = progress.percent ?? 0;
  setText('backend-progress-pct', `${percent}%`);
  setText('roadmap-pct', `${percent}% Complete`);
  if (byId('overall-progress-bar')) byId('overall-progress-bar').style.width = `${percent}%`;
  const all = samvedRoadmaps.flatMap(plan => plan.milestones || []);
  const current = all.find(m => m.status === 'IN_PROGRESS') || all.find(m => m.status === 'PENDING');
  const next = current ? all.find(m => m.position > current.position && m.status === 'PENDING') : null;
  setText('current-ms-title', current?.title || 'No active milestone');
  setText('current-ms-desc', current?.description || 'Create a roadmap to start tracking progress.');
  setText('next-ms-title', next?.title || 'No next milestone');
  setText('next-ms-desc', next?.description || 'Your plan will appear here.');
  const list = byId('completed-milestones-container');
  if (list) {
    list.replaceChildren();
    all.filter(m => m.status === 'COMPLETED').forEach(m => { const li = document.createElement('li'); li.textContent = m.title; list.append(li); });
    if (!list.children.length) showMessage(list, 'No completed milestones yet.');
  }
}

function opportunityCard(opportunity) {
  const card = document.createElement('article'); card.className = 'single-task-card';
  const heading = document.createElement('h3'); heading.textContent = opportunity.title;
  const summary = document.createElement('p'); summary.textContent = opportunity.summary;
  const meta = document.createElement('p');
  const preciseDeadline = opportunity.closesAt && opportunity.deadlineZone
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: opportunity.deadlineZone })
        .format(new Date(opportunity.closesAt)) + ` (${opportunity.deadlineZone})`
    : null;
  meta.textContent = `${opportunity.type} · ${opportunity.organizer} · ${preciseDeadline
    ? `Registration closes ${preciseDeadline}` : opportunity.deadline ? `Deadline date ${opportunity.deadline}` : 'Deadline unknown'}`;
  const source = document.createElement('p'); source.textContent = `Verified source: ${opportunity.sourceName}`;
  const reviewed = document.createElement('p');
  reviewed.textContent = `Checked: ${opportunity.verifiedAt ? new Date(opportunity.verifiedAt).toLocaleDateString() : 'Unknown'}`;
  const relevance = document.createElement('p');
  relevance.textContent = opportunity.matchedSignals?.length
    ? `Related to your profile: ${opportunity.matchedSignals.join(', ')}`
    : 'Explore this opportunity and check eligibility on the source page.';
  const link = document.createElement('a'); link.textContent = 'View original listing';
  try {
    const destination = new URL(opportunity.applicationUrl);
    if (destination.protocol !== 'https:') throw new Error('Unsupported link');
    link.href = destination.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  } catch { link.textContent = 'Application link unavailable'; }
  card.append(heading, meta, summary, relevance, source, reviewed, link);
  return card;
}

function renderOpportunities() {
  for (const id of ['discovery-opp-grid', 'opportunities-grid', 'quick-opportunities-grid', 'opp-grid']) {
    const grid = byId(id);
    if (!grid) continue;
    grid.replaceChildren();
    if (!samvedOpportunities.length) showMessage(grid, 'No verified active opportunities are available yet. Check again later.');
    else samvedOpportunities.forEach(item => grid.append(opportunityCard(item)));
  }
}

async function filterOpportunities(label, button) {
  const types = {All: null, Jobs: 'JOB', Internships: 'INTERNSHIP',
    Hackathons: 'HACKATHON', Competitions: 'COMPETITION', Quizzes: 'QUIZ',
    Workshops: 'WORKSHOP', Scholarships: 'SCHOLARSHIP', Events: 'EVENT', Courses: 'COURSE'};
  selectedOpportunityType = Object.hasOwn(types, label) ? types[label] : 'UNSUPPORTED';
  document.querySelectorAll('.filter-btn').forEach(item => item.classList.toggle('active', item === button));
  if (selectedOpportunityType === 'UNSUPPORTED') {
    samvedOpportunities = []; renderOpportunities();
    showMessage(byId('discovery-opp-grid'), 'This category has no curated records yet.');
    return;
  }
  try { await loadOpportunities(); } catch (error) { reportError(error); }
}

async function loadOpportunities() {
  const query = selectedOpportunityType
    ? `?type=${encodeURIComponent(selectedOpportunityType)}&size=50` : '?size=50';
  const page = await api('GET', `/api/v1/opportunities${query}`);
  samvedOpportunities = page.content || [];
  renderOpportunities();
}

async function refreshAll() {
  const status = byId('samved-status');
  if (status) status.textContent = 'Loading saved data…';
  try {
    if (samvedView === 'roadmap' || samvedView === 'progress')
      samvedRoadmaps = await api('GET', '/api/v1/roadmaps/me');
    if (samvedView === 'tasks') samvedTasks = await api('GET', '/api/v1/tasks');
    if (samvedView === 'opportunities') await loadOpportunities();
    if (samvedView === 'progress' || samvedView === 'roadmap') {
      const progress = await api('GET', '/api/v1/progress/me');
      renderProgress(progress);
    }
    if (samvedView === 'roadmap') renderRoadmap();
    if (samvedView === 'tasks') renderTasks();
    if (status) status.textContent = '';
  } catch (error) { reportError(error); }
}

function completeNextStep() { showMessage(byId('samved-status'), 'Open your roadmap to update the current milestone.'); }
function syncMember1Data() { showMessage(byId('samved-status'), 'Edit your profile in My Profile.'); }

document.addEventListener('DOMContentLoaded', () => {
  switchView(samvedView);
  document.querySelector('.m1-sync-bar')?.remove();
  setText('sidebar-name', 'Student'); setText('header-profile-name', 'Student');
  setText('header-goal-text', 'Your goal');
  // Erase hard-coded prototype cards before the first API response (including error cases).
  ['roadmap-stages-container', 'roadmap-nodes-container', 'full-task-grid',
    'completed-milestones-container', 'discovery-opp-grid'].forEach(clear);
  setText('roadmap-pct', '0% Complete');
  setText('backend-progress-pct', '0%');
  if (byId('overall-progress-bar')) byId('overall-progress-bar').style.width = '0%';
  setText('current-ms-title', 'Loading milestones');
  setText('current-ms-desc', '');
  setText('next-ms-title', '');
  setText('next-ms-desc', '');
  const status = document.createElement('p'); status.id = 'samved-status'; status.setAttribute('role', 'status');
  status.style.padding = '12px';
  byId(`view-${samvedView}`)?.prepend(status);
  refreshAll();
});
