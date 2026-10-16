/* ==========================================================================
   SAMVED MEMBER 2 - DASHBOARD, ROADMAP, PROGRESS, TASKS, DEADLINES & OPPORTUNITIES
   ========================================================================== */

// 1. SECTION 4.7 OPPORTUNITIES DISCOVERY DATA
let discoveryOpportunities = [
  { id: 301, name: "AMD AI DevMaster Hackathon 2026", type: "Hackathons", deadline: "Oct 25, 2026", location: "Virtual / Online", eligibility: "Undergraduate CS Students", saved: false },
  { id: 302, name: "Google Research Summer Internship", type: "Internships", deadline: "Nov 15, 2026", location: "Bangalore, India", eligibility: "B.Tech / B.Sc 3rd & 4th Year", saved: true },
  { id: 303, name: "Quantum Computing Foundations Workshop", type: "Workshops", deadline: "Oct 18, 2026", location: "IIT Madras / Online", eligibility: "Open to All Science Students", saved: false },
  { id: 304, name: "IISc Undergraduate Research Fellowship", type: "Research", deadline: "Dec 01, 2026", location: "IISc Bangalore", eligibility: "CGPA >= 8.5 in Science", saved: false },
  { id: 305, name: "National Merit STEM Scholarship", type: "Scholarships", deadline: "Nov 30, 2026", location: "National Level", eligibility: "Family Income < 6 LPA", saved: true },
  { id: 306, name: "ACM Student Project Competition", type: "Competitions", deadline: "Oct 28, 2026", location: "Virtual Submission", eligibility: "ACM Student Members", saved: false }
];

let backendDeadlinesData = [
  { id: 201, title: "Research Abstract Final Submission", targetDate: "2026-10-05", daysRemaining: 3, urgency: "urgent" },
  { id: 202, title: "National Science Internship Application", targetDate: "2026-10-16", daysRemaining: 14, urgency: "moderate" },
  { id: 203, title: "AI/ML Dev Hackathon Proposal", targetDate: "2026-10-23", daysRemaining: 21, urgency: "safe" }
];

let studentTasks = [
  { id: 101, title: "Read Literature Review", description: "Read recent papers on machine learning models.", deadline: "2026-10-15", status: "In Progress" },
  { id: 102, title: "Meeting with Advisor", description: "Discuss research abstract draft.", deadline: "2026-10-10", status: "Completed" },
  { id: 103, title: "Draft Methodology Section", description: "Outline experimental setup.", deadline: "2026-10-20", status: "Pending" }
];

let backendProgressData = {
  overallProgressPercentage: 42,
  completedMilestones: [
    { title: "10th Board Certification", date: "Completed May 2022", verifyCode: "CBSE-VERIFIED" },
    { title: "12th Board Certification (Science PCM)", date: "Completed May 2024", verifyCode: "CBSE-VERIFIED" },
    { title: "Bachelor's Semester 1-3 Clear", date: "Completed Dec 2025", verifyCode: "UNI-VERIFIED" }
  ],
  currentMilestone: { title: "Current Research Project", description: "Execute literature review and methodology setup.", status: "In Progress" },
  nextMilestone: { title: "Research Internship", description: "Apply and secure an 8-week research internship.", status: "Queued" }
};

let studentState = {
  name: "Anugrah",
  education: "Bachelor's",
  goal: "Scientist"
};

const roadmapData = [
  { id: "10th", title: "10th Grade Standard", description: "Foundational education.", requirements: "Completion of 10th", skills: ["Mathematics"], completionState: "Verified" },
  { id: "12th Science", title: "12th Grade Science", description: "Higher secondary science.", requirements: "Board cert >= 80%", skills: ["Calculus"], completionState: "Verified" },
  { id: "Bachelor's", title: "Bachelor's Degree", description: "Undergraduate CS.", requirements: "CGPA >= 8.0", skills: ["Python"], completionState: "In Progress" },
  { id: "Current Research Project", title: "Current Research Project", description: "Domain research.", requirements: "Publish abstract", skills: ["Writing"], completionState: "Active" },
  { id: "Internship", title: "Research Internship", description: "Academic internship.", requirements: "8-week proof", skills: ["Research"], completionState: "Pending" },
  { id: "Master's", title: "Master's Degree", description: "Post-graduate research.", requirements: "Thesis defense", skills: ["Advanced AI"], completionState: "Upcoming" },
  { id: "PhD", title: "Doctoral Studies (PhD)", description: "Doctoral research.", requirements: "Defend dissertation", skills: ["Grant Writing"], completionState: "Future Target" },
  { id: "Research Scientist", title: "Research Scientist", description: "Professional goal.", requirements: "Publications", skills: ["Leadership"], completionState: "Ultimate Goal" }
];

// VIEW SWITCHER
function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.nav-menu li').forEach(item => item.classList.remove('active'));

  const activate = (viewId, navId, title) => {
    const v = document.getElementById(viewId);
    if (v) v.classList.add('active');
    const n = document.getElementById(navId);
    if (n) n.classList.add('active');
    const t = document.getElementById('page-title');
    if (t && title) t.innerText = title;
  };

  if (viewName === 'dashboard') {
    activate('view-dashboard', 'nav-dashboard', "Dashboard");
  } else if (viewName === 'roadmap') {
    activate('view-roadmap', 'nav-roadmap', "Career Roadmap");
    renderDetailedRoadmapStages();
  } else if (viewName === 'progress') {
    activate('view-progress', 'nav-progress', "Progress Tracking");
    renderProgressPage();
  } else if (viewName === 'tasks') {
    activate('view-tasks', 'nav-tasks', "Daily Tasks Interface");
    renderFullTaskGrid();
  } else if (viewName === 'deadlines') {
    activate('view-deadlines', 'nav-deadlines', "Deadline System");
    renderFullDeadlinesGrid();
  } else if (viewName === 'opportunities') {
    activate('view-opportunities', 'nav-opportunities', "Opportunity Discovery");
    renderOpportunitiesDiscovery('All');
  }
}

// ==========================================================================
// SECTION 4.7 OPPORTUNITY DISCOVERY RENDER & ACTIONS
// ==========================================================================
function renderOpportunitiesDiscovery(categoryFilter = 'All') {
  const container = document.getElementById('discovery-opp-grid');
  if (!container) return;
  container.innerHTML = '';

  const filtered = (categoryFilter === 'All')
    ? discoveryOpportunities
    : discoveryOpportunities.filter(o => o.type === categoryFilter);

  filtered.forEach(opp => {
    const card = document.createElement('div');
    card.className = 'discovery-card';
    card.innerHTML = `
      <div>
        <span class="opp-badge">${opp.type}</span>
        <h3 style="font-size:16px; color:var(--text-dark); margin-bottom:10px;">${opp.name}</h3>

        <div class="opp-detail-row"><strong>Deadline:</strong> ${opp.deadline}</div>
        <div class="opp-detail-row"><strong>Location:</strong> ${opp.location}</div>
        <div class="opp-detail-row"><strong>Eligibility:</strong> ${opp.eligibility}</div>
      </div>

      <div class="opp-actions">
        <button class="btn-view" onclick="viewOpportunityDetails('${opp.name}')">View Details</button>
        <button class="btn-save ${opp.saved ? 'saved' : ''}" onclick="toggleSaveOpportunity(${opp.id})">
          ${opp.saved ? 'Saved' : 'Save'}
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function filterOpportunities(category, btnElement) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderOpportunitiesDiscovery(category);
}

function toggleSaveOpportunity(id) {
  const opp = discoveryOpportunities.find(o => o.id === id);
  if (opp) {
    opp.saved = !opp.saved;
    renderOpportunitiesDiscovery(document.querySelector('.filter-btn.active')?.innerText || 'All');
  }
}

function viewOpportunityDetails(name) {
  alert(`Viewing official details and applying for: ${name}`);
}

// DASHBOARD QUICK WIDGET
function renderQuickOpportunities() {
  const container = document.getElementById('quick-opportunities-grid');
  if (!container) return;
  container.innerHTML = '';

  discoveryOpportunities.slice(0, 2).forEach(opp => {
    const card = document.createElement('div');
    card.className = 'opp-card';
    card.innerHTML = `
      <span class="opp-type">${opp.type}</span>
      <h4 style="font-size:13px; margin-bottom:6px;">${opp.name}</h4>
      <p style="font-size:11px; color:var(--text-muted);">${opp.deadline}</p>
    `;
    container.appendChild(card);
  });
}

// TASKS & DEADLINES & PROGRESS
function renderFullDeadlinesGrid() {
  const container = document.getElementById('full-deadlines-grid');
  if (!container) return;
  container.innerHTML = '';

  backendDeadlinesData.forEach(item => {
    const card = document.createElement('div');
    card.className = `deadline-card-row ${item.urgency}`;
    card.innerHTML = `
      <div>
        <h4 style="font-size:15px; color:var(--text-dark);">${item.title}</h4>
        <span style="font-size:12px; color:var(--text-muted)">Target Date: ${item.targetDate}</span>
      </div>
      <div><span class="deadline-pill pill-${item.urgency}">${item.daysRemaining} days remaining</span></div>
    `;
    container.appendChild(card);
  });

  renderQuickDeadlines();
}

function renderQuickDeadlines() {
  const container = document.getElementById('quick-deadlines-container');
  if (!container) return;
  container.innerHTML = '';

  backendDeadlinesData.slice(0, 3).forEach(item => {
    const div = document.createElement('div');
    div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-color); font-size:13px;";
    div.innerHTML = `
      <span style="font-weight:600; color:var(--text-dark);">${item.title}</span>
      <span class="deadline-pill pill-${item.urgency}" style="font-size:11px; padding:3px 8px;">${item.daysRemaining} days remaining</span>
    `;
    container.appendChild(div);
  });
}

function renderFullTaskGrid() {
  const container = document.getElementById('full-task-grid');
  if (!container) return;
  container.innerHTML = '';

  document.getElementById('task-count-badge').innerText = `${studentTasks.length} Tasks`;

  studentTasks.forEach(task => {
    const card = document.createElement('div');
    const statusKey = task.status.toLowerCase().replace(" ", "");
    card.className = `single-task-card status-${statusKey}`;
    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <h4 style="font-size:15px; color:var(--text-dark);">${task.title}</h4>
          <span class="stage-badge badge-${task.status === 'Completed' ? 'completed' : task.status === 'In Progress' ? 'active' : 'locked'}">${task.status}</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">${task.description || 'No description provided.'}</p>
        <div style="font-size:12px; font-weight:600; color:var(--accent-gold);">Deadline: ${task.deadline}</div>
      </div>
      <div class="task-card-actions">
        <button class="btn-sm btn-complete" onclick="toggleTaskComplete(${task.id})">${task.status === 'Completed' ? 'Undo' : 'Complete'}</button>
        <button class="btn-sm btn-edit" onclick="editTask(${task.id})">Edit</button>
        <button class="btn-sm btn-delete" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });

  renderQuickTasks();
}

function saveTask(e) {
  e.preventDefault();
  const editId = document.getElementById('task-edit-id').value;
  const title = document.getElementById('task-title').value;
  const deadline = document.getElementById('task-deadline').value;
  const desc = document.getElementById('task-desc').value;
  const status = document.getElementById('task-status').value;

  if (editId) {
    const task = studentTasks.find(t => t.id == editId);
    if (task) { task.title = title; task.deadline = deadline; task.description = desc; task.status = status; }
  } else {
    studentTasks.push({ id: Date.now(), title, deadline, description: desc, status });
  }

  resetTaskForm();
  renderFullTaskGrid();
}

function editTask(id) {
  const task = studentTasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById('task-edit-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-deadline').value = task.deadline;
  document.getElementById('task-desc').value = task.description;
  document.getElementById('task-status').value = task.status;
  document.getElementById('task-form-heading').innerText = "Edit Task";
}

function deleteTask(id) {
  studentTasks = studentTasks.filter(t => t.id !== id);
  renderFullTaskGrid();
}

function toggleTaskComplete(id) {
  const task = studentTasks.find(t => t.id === id);
  if (task) task.status = (task.status === 'Completed') ? 'Pending' : 'Completed';
  renderFullTaskGrid();
}

function resetTaskForm() {
  document.getElementById('task-edit-id').value = '';
  document.getElementById('task-form').reset();
  document.getElementById('task-form-heading').innerText = "Create New Task";
}

function renderQuickTasks() {
  const container = document.getElementById('quick-task-list-container');
  if (!container) return;
  container.innerHTML = '';

  studentTasks.forEach(task => {
    const li = document.createElement('li');
    li.style.cssText = "display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color); font-size:13px;";
    li.innerHTML = `
      <span style="${task.status === 'Completed' ? 'text-decoration:line-through; color:var(--text-muted)' : ''}">${task.title}</span>
      <span class="stage-badge badge-${task.status === 'Completed' ? 'completed' : 'active'}">${task.status}</span>
    `;
    container.appendChild(li);
  });
}

function renderProgressPage() {
  document.getElementById('backend-progress-pct').innerText = `${backendProgressData.overallProgressPercentage}%`;
  document.getElementById('current-ms-title').innerText = backendProgressData.currentMilestone.title;
  document.getElementById('current-ms-desc').innerText = backendProgressData.currentMilestone.description;
  document.getElementById('next-ms-title').innerText = backendProgressData.nextMilestone.title;
  document.getElementById('next-ms-desc').innerText = backendProgressData.nextMilestone.description;

  const container = document.getElementById('completed-milestones-container');
  if (!container) return;
  container.innerHTML = '';

  backendProgressData.completedMilestones.forEach(ms => {
    const li = document.createElement('li');
    li.className = 'completed-milestone-item';
    li.innerHTML = `
      <div><h4 style="font-size:14px; color:var(--text-dark);">${ms.title}</h4><span style="font-size:12px; color:var(--text-muted);">${ms.date}</span></div>
      <span class="stage-badge badge-completed">${ms.verifyCode}</span>
    `;
    container.appendChild(li);
  });
}

function renderRoadmapSummary() {
  const container = document.getElementById('roadmap-nodes-container');
  if (!container) return;
  container.innerHTML = '';

  const currentEduIndex = window.StudentProfile.getCompletedStageIndex(studentState.education);

  roadmapData.forEach((stage, idx) => {
    const node = document.createElement('div');
    node.className = 'roadmap-node';

    let status = '';
    if (idx <= currentEduIndex) { status = 'completed'; }
    else if (idx === currentEduIndex + 1) { status = 'active'; }

    if (status) node.classList.add(status);
    node.innerHTML = `
      <div class="node-circle">${status === 'completed' ? '✓' : idx + 1}</div>
      <div class="node-title">${stage.id}</div>
    `;

    container.appendChild(node);
  });

  document.getElementById('roadmap-pct').innerText = `${backendProgressData.overallProgressPercentage}% Complete`;
  document.getElementById('overall-progress-bar').style.width = `${backendProgressData.overallProgressPercentage}%`;
}

function renderDetailedRoadmapStages() {
  const container = document.getElementById('roadmap-stages-container');
  if (!container) return;
  container.innerHTML = '';

  const currentEduIndex = window.StudentProfile.getCompletedStageIndex(studentState.education);

  roadmapData.forEach((stage, idx) => {
    let statusClass = 'locked';
    let badgeLabel = 'Upcoming';
    let badgeClass = 'badge-locked';

    if (idx <= currentEduIndex) { statusClass = 'completed'; badgeLabel = 'Completed'; badgeClass = 'badge-completed'; }
    else if (idx === currentEduIndex + 1) { statusClass = 'active'; badgeLabel = 'Current Active Stage'; badgeClass = 'badge-active'; }

    const card = document.createElement('div');
    card.className = `stage-card ${statusClass}`;
    card.innerHTML = `
      <div style="flex-grow:1;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
          <h3 style="font-size:16px; color:var(--text-dark);">${stage.title}</h3>
          <span class="stage-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">${stage.description}</p>
        <div style="font-size:12px; margin-bottom:6px;"><strong>Requirements:</strong> <span style="color:#475569">${stage.requirements}</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

function syncMember1Data() {
  window.StudentProfile.saveFromInputs(studentState, roadmapData, backendProgressData, typeof backendRecommendations !== 'undefined' ? backendRecommendations : null);
  renderRoadmapSummary();
  renderDetailedRoadmapStages();
  renderProgressPage();
  if (typeof renderRecommendationsPage === 'function') renderRecommendationsPage();
}

function completeNextStep() {
  alert("Milestone updated via Java Backend API call.");
}

window.addEventListener('DOMContentLoaded', () => {
  window.StudentProfile.hydrate(studentState, roadmapData, backendProgressData, typeof backendRecommendations !== 'undefined' ? backendRecommendations : null);
  renderRoadmapSummary();
  renderQuickDeadlines();
  renderQuickTasks();
  renderQuickOpportunities();
  switchView('opportunities');
});
