/* ==========================================================================
   SAMVED MEMBER 2 - DASHBOARD, ROADMAP & PROGRESS CONTROLLER
   ========================================================================== */

// 1. MOCKED BACKEND API RESPONSE (Section 4.3 Progress Page Data)
// Note: Frontend only displays calculated result from Java backend; no business rules are calculated here.
let backendProgressData = {
  overallProgressPercentage: 42,
  completedMilestones: [
    { title: "10th Board Certification", date: "Completed May 2022", verifyCode: "CBSE-VERIFIED" },
    { title: "12th Board Certification (Science PCM)", date: "Completed May 2024", verifyCode: "CBSE-VERIFIED" },
    { title: "Bachelor's Semester 1-3 Clear", date: "Completed Dec 2025", verifyCode: "UNI-VERIFIED" }
  ],
  currentMilestone: {
    title: "Current Research Project",
    description: "Execute literature review, methodology setup, and draft methodology paper.",
    status: "In Progress"
  },
  nextMilestone: {
    title: "Research Internship",
    description: "Apply and secure an 8-week research internship at a recognized laboratory.",
    status: "Queued"
  }
};

let studentState = {
  name: "Anugrah",
  education: "Bachelor's",
  goal: "Scientist",
  tasks: [
    { id: 1, text: "Read literature review paper", completed: false },
    { id: 2, text: "Meeting with academic advisor", completed: true }
  ],
  deadlines: [
    { id: 1, title: "Research Abstract Submission", daysLeft: 3 },
    { id: 2, title: "Internship Application", daysLeft: 14 }
  ]
};

const roadmapData = [
  { id: "10th", title: "10th Grade Standard", description: "Foundational secondary education focusing on science & mathematics.", requirements: "Completion of 10th Certificate", skills: ["Mathematics", "Physics"], completionState: "Verified" },
  { id: "12th Science", title: "12th Grade Science", description: "Higher secondary specialization in Physics, Chemistry, and Mathematics.", requirements: "Board certification >= 80%", skills: ["Calculus", "Chemistry"], completionState: "Verified" },
  { id: "Bachelor's", title: "Bachelor's Degree", description: "Undergraduate degree building core CS foundations.", requirements: "CGPA >= 8.0", skills: ["Data Structures", "Python"], completionState: "In Progress" },
  { id: "Current Research Project", title: "Current Research Project", description: "Domain research work supervised by faculty.", requirements: "Publish project abstract", skills: ["Scientific Writing", "Data Analysis"], completionState: "Active Milestone" },
  { id: "Internship", title: "Research Internship", description: "Academic internship at a premier lab.", requirements: "8-week duration proof", skills: ["Applied Research"], completionState: "Pending" },
  { id: "Master's", title: "Master's Degree", description: "Post-graduate research and thesis.", requirements: "GATE/GRE & thesis", skills: ["Advanced AI"], completionState: "Upcoming" },
  { id: "PhD", title: "Doctoral Studies (PhD)", description: "Original doctoral research.", requirements: "Defend dissertation", skills: ["Grant Writing"], completionState: "Future Target" },
  { id: "Research Scientist", title: "Research Scientist", description: "Professional appointment.", requirements: "Peer-reviewed publications", skills: ["Leadership"], completionState: "Ultimate Goal" }
];

const sampleOpportunities = [
  { id: 1, type: "Internship", name: "Google Research Internship", deadline: "Oct 15th" },
  { id: 2, type: "Hackathon", name: "AI/ML Dev Competition", deadline: "Nov 01st" }
];

// ==========================================================================
// VIEW SWITCHER LOGIC
// ==========================================================================
function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.nav-menu li').forEach(item => item.classList.remove('active'));

  if (viewName === 'dashboard') {
    document.getElementById('view-dashboard').classList.add('active');
    document.getElementById('nav-dashboard').classList.add('active');
    document.getElementById('page-title').innerText = "Dashboard";
  } else if (viewName === 'roadmap') {
    document.getElementById('view-roadmap').classList.add('active');
    document.getElementById('nav-roadmap').classList.add('active');
    document.getElementById('page-title').innerText = "4.2 Career Roadmap";
    renderDetailedRoadmapStages();
  } else if (viewName === 'progress') {
    document.getElementById('view-progress').classList.add('active');
    document.getElementById('nav-progress').classList.add('active');
    document.getElementById('page-title').innerText = "4.3 Progress Tracking";
    renderProgressPage();
  }
}

// ==========================================================================
// SECTION 4.3 PROGRESS PAGE RENDER FUNCTION
// ==========================================================================
function renderProgressPage() {
  // Render overall progress computed by Java backend
  document.getElementById('backend-progress-pct').innerText = `${backendProgressData.overallProgressPercentage}%`;

  // Render current milestone
  document.getElementById('current-ms-title').innerText = backendProgressData.currentMilestone.title;
  document.getElementById('current-ms-desc').innerText = backendProgressData.currentMilestone.description;

  // Render next milestone
  document.getElementById('next-ms-title').innerText = backendProgressData.nextMilestone.title;
  document.getElementById('next-ms-desc').innerText = backendProgressData.nextMilestone.description;

  // Render completed milestones list
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

// ==========================================================================
// DASHBOARD & ROADMAP SUMMARY RENDERS
// ==========================================================================
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
        <div>${stage.skills.map(s => `<span class="skill-chip">${s}</span>`).join('')}</div>
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

function renderTasks() {
  const container = document.getElementById('task-list-container');
  if (!container) return;
  container.innerHTML = '';

  studentState.tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <div>
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
        <span style="margin-left:8px; font-size:14px;">${task.text}</span>
      </div>
      <button style="border:none; background:none; color:var(--danger); cursor:pointer;" onclick="deleteTask(${task.id})">✕</button>
    `;
    container.appendChild(li);
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

function addNewTask() {
  const input = document.getElementById('new-task-input');
  if (!input || !input.value.trim()) return;
  studentState.tasks.push({ id: Date.now(), text: input.value.trim(), completed: false });
  input.value = '';
  renderTasks();
}

function toggleTask(id) {
  const task = studentState.tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  renderTasks();
}

function deleteTask(id) {
  studentState.tasks = studentState.tasks.filter(t => t.id !== id);
  renderTasks();
}

function completeNextStep() {
  alert("Milestone updated via Java Backend API call.");
}

window.addEventListener('DOMContentLoaded', () => {
  window.StudentProfile.hydrate(studentState, roadmapData, backendProgressData, typeof backendRecommendations !== 'undefined' ? backendRecommendations : null);
  renderRoadmapSummary();
  renderDeadlines();
  renderTasks();
  renderOpportunities();
  switchView('progress');
});