/* ==========================================================================
   SAMVED MEMBER 2 - DASHBOARD, ROADMAP, PROGRESS & TASKS CONTROLLER
   ========================================================================== */

// 1. SECTION 4.5 DAILY TASKS STATE DATA
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
  currentMilestone: { title: "Current Research Project", description: "Execute literature review, methodology setup, and draft methodology paper.", status: "In Progress" },
  nextMilestone: { title: "Research Internship", description: "Apply and secure an 8-week research internship at a recognized laboratory.", status: "Queued" }
};

let studentState = {
  name: "Anugrah",
  education: "Bachelor's",
  goal: "Scientist",
  deadlines: [
    { id: 1, title: "Research Abstract Submission", daysLeft: 3 },
    { id: 2, title: "Internship Application", daysLeft: 14 }
  ]
};

const roadmapData = [
  { id: "10th", title: "10th Grade Standard", description: "Foundational secondary education.", requirements: "Completion of 10th Certificate", skills: ["Mathematics", "Physics"], completionState: "Verified" },
  { id: "12th Science", title: "12th Grade Science", description: "Higher secondary specialization.", requirements: "Board certification >= 80%", skills: ["Calculus", "Chemistry"], completionState: "Verified" },
  { id: "Bachelor's", title: "Bachelor's Degree", description: "Undergraduate degree in CS.", requirements: "CGPA >= 8.0", skills: ["Data Structures", "Python"], completionState: "In Progress" },
  { id: "Current Research Project", title: "Current Research Project", description: "Domain research work.", requirements: "Publish project abstract", skills: ["Scientific Writing"], completionState: "Active Milestone" },
  { id: "Internship", title: "Research Internship", description: "Academic internship.", requirements: "8-week duration proof", skills: ["Applied Research"], completionState: "Pending" },
  { id: "Master's", title: "Master's Degree", description: "Post-graduate research.", requirements: "GATE/GRE & thesis", skills: ["Advanced AI"], completionState: "Upcoming" },
  { id: "PhD", title: "Doctoral Studies (PhD)", description: "Original doctoral research.", requirements: "Defend dissertation", skills: ["Grant Writing"], completionState: "Future Target" },
  { id: "Research Scientist", title: "Research Scientist", description: "Professional appointment.", requirements: "Peer-reviewed publications", skills: ["Leadership"], completionState: "Ultimate Goal" }
];

const sampleOpportunities = [
  { id: 1, type: "Internship", name: "Google Research Internship", deadline: "Oct 15th" },
  { id: 2, type: "Hackathon", name: "AI/ML Dev Competition", deadline: "Nov 01st" }
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
  }
}

// ==========================================================================
// SECTION 4.5 DAILY TASKS LOGIC (ADD, EDIT, DELETE, COMPLETE)
// ==========================================================================
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
        <div style="font-size:12px; font-weight:600; color:var(--accent-gold);">
          Deadline: ${task.deadline}
        </div>
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
    // Edit existing task
    const task = studentTasks.find(t => t.id == editId);
    if (task) {
      task.title = title;
      task.deadline = deadline;
      task.description = desc;
      task.status = status;
    }
  } else {
    // Add new task
    studentTasks.push({
      id: Date.now(),
      title,
      deadline,
      description: desc,
      status
    });
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
  if (task) {
    task.status = (task.status === 'Completed') ? 'Pending' : 'Completed';
  }
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

// OTHER VIEWS RENDERS
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
      <div>
        <h4 style="font-size:14px; color:var(--text-dark);">${ms.title}</h4>
        <span style="font-size:12px; color:var(--text-muted);">${ms.date}</span>
      </div>
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
    if (idx <= currentEduIndex) {
      status = 'completed';
    } else if (idx === currentEduIndex + 1) {
      status = 'active';
    }

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

    if (idx <= currentEduIndex) {
      statusClass = 'completed';
      badgeLabel = 'Completed';
      badgeClass = 'badge-completed';
    } else if (idx === currentEduIndex + 1) {
      statusClass = 'active';
      badgeLabel = 'Current Active Stage';
      badgeClass = 'badge-active';
    }

    const card = document.createElement('div');
    card.className = `stage-card ${statusClass}`;
    card.innerHTML = `
      <div style="flex-grow:1;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
          <h3 style="font-size:16px; color:var(--text-dark);">${stage.title}</h3>
          <span class="stage-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">${stage.description}</p>
        <div style="font-size:12px; margin-bottom:6px;">
          <strong>Requirements:</strong> <span style="color:#475569">${stage.requirements}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderDeadlines() {
  const container = document.getElementById('deadlines-container');
  if (!container) return;
  container.innerHTML = '';

  studentState.deadlines.forEach(item => {
    const div = document.createElement('div');
    div.className = 'deadline-item';
    div.innerHTML = `
      <span style="font-size:13px; font-weight:600;">${item.title}</span>
      <span class="deadline-tag ${item.daysLeft <= 3 ? 'tag-urgent' : 'tag-normal'}">${item.daysLeft} days left</span>
    `;
    container.appendChild(div);
  });
}

function renderOpportunities() {
  const container = document.getElementById('opportunities-grid');
  if (!container) return;
  container.innerHTML = '';

  sampleOpportunities.forEach(opp => {
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
  renderDeadlines();
  renderQuickTasks();
  renderOpportunities();
  switchView('tasks');
});
