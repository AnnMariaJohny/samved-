/* ==========================================================================
   SAMVED MEMBER 2 - DASHBOARD & CAREER ROADMAP CONTROLLER
   ========================================================================== */

// 1. STUDENT STATE (Populated from Member 1 Onboarding Data)
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

// 2. DETAILED SECTION 4.2 ROADMAP STAGES DATA (Mocked from Java Backend API)
const roadmapData = [
  {
    id: "10th",
    title: "10th Grade Standard",
    description: "Foundational secondary education focusing on general science & mathematics.",
    requirements: "Completion of Secondary Education Certificate with minimum 75%",
    skills: ["Mathematics", "Basic Physics", "Chemistry Basics"],
    completionState: "Verified via Academic Board"
  },
  {
    id: "12th Science",
    title: "12th Grade Science (PCM/PCB)",
    description: "Higher secondary specialization in Physics, Chemistry, and Mathematics.",
    requirements: "Board certification with aggregate >= 80% in core sciences",
    skills: ["Calculus", "Organic Chemistry", "Analytical Reasoning"],
    completionState: "Verified via Higher Secondary Board"
  },
  {
    id: "Bachelor's",
    title: "Bachelor's Degree (B.Sc / B.Tech)",
    description: "Undergraduate degree building core computer science and engineering foundations.",
    requirements: "Maintain aggregate CGPA >= 8.0 across 8 semesters",
    skills: ["Data Structures", "Python", "Algorithms", "Linear Algebra"],
    completionState: "In Progress (Semester 4)"
  },
  {
    id: "Current Research Project",
    title: "Current Research Project",
    description: "Hands-on domain research work supervised by department faculty.",
    requirements: "Complete experimental methodology and publish project abstract",
    skills: ["Scientific Writing", "Experimental Design", "Data Analysis"],
    completionState: "Active Milestone"
  },
  {
    id: "Internship",
    title: "Research Internship",
    description: "Industrial or academic internship at a premier lab or university.",
    requirements: "Minimum 8-week duration with official completion proof certificate",
    skills: ["Applied Research", "Lab Protocols", "Peer Collaboration"],
    completionState: "Pending Application"
  },
  {
    id: "Master's",
    title: "Master's Degree (M.Sc / M.Tech)",
    description: "Advanced post-graduate research and specialized thesis defense.",
    requirements: "Clear entrance exam (GATE/GRE) and submit Master's thesis",
    skills: ["Advanced AI", "Mathematical Modeling", "Thesis Writing"],
    completionState: "Upcoming Stage"
  },
  {
    id: "PhD",
    title: "Doctoral Studies (PhD)",
    description: "Original doctoral research contributing novel domain findings.",
    requirements: "Pass qualifying exams and defend doctoral dissertation",
    skills: ["Grant Writing", "Journal Publication", "Peer Review"],
    completionState: "Future Target"
  },
  {
    id: "Research Scientist",
    title: "Research Scientist Goal",
    description: "Professional appointment at a top research organization or institute.",
    requirements: "Peer-reviewed publications & recognized research output",
    skills: ["Project Leadership", "Innovation", "Domain Expertise"],
    completionState: "Ultimate Career Goal"
  }
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
    document.getElementById('page-title').innerText = "Career Roadmap";
    renderDetailedRoadmapStages();
  }
}

// ==========================================================================
// CORE RENDER FUNCTIONS
// ==========================================================================

// Render Timeline Nodes on Dashboard Summary
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
      status = 'active'; // SHINING NODE
    }

    if (status) node.classList.add(status);
    node.innerHTML = `
      <div class="node-circle">${status === 'completed' ? '✓' : idx + 1}</div>
      <div class="node-title">${stage.id}</div>
    `;

    container.appendChild(node);
  });

  const pct = window.StudentProfile.getProgressPercentage(studentState.education);
  document.getElementById('roadmap-pct').innerText = `${pct}% Complete`;
  document.getElementById('overall-progress-bar').style.width = `${pct}%`;
}

// Render Section 4.2 Detailed Roadmap Stage Cards
function renderDetailedRoadmapStages() {
  const container = document.getElementById('roadmap-stages-container');
  if (!container) return;
  container.innerHTML = '';

  const currentEduIndex = window.StudentProfile.getCompletedStageIndex(studentState.education);
  const progress = window.StudentProfile.getProgressPercentage(studentState.education);
  const goalTitle = document.getElementById('roadmap-goal-title');
  const goalShort = document.getElementById('roadmap-goal-short');
  const progressLabel = document.getElementById('roadmap-view-pct');
  const stageCount = document.getElementById('roadmap-stage-count');
  if (goalTitle) goalTitle.textContent = studentState.goal;
  if (goalShort) goalShort.textContent = studentState.goal;
  if (progressLabel) progressLabel.textContent = `${progress}% Complete`;
  if (stageCount) stageCount.textContent = `${roadmapData.length} career stages`;

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

    const card = document.createElement('article');
    card.className = `stage-card ${statusClass}`;
    card.innerHTML = `
      <div style="flex-grow:1;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
          <h3 style="font-size:16px; color:var(--text-dark);">${stage.title}</h3>
          <span class="stage-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">${stage.description}</p>
        <div class="stage-requirements" style="font-size:12px; margin-bottom:6px;">
          <strong>Requirements:</strong> <span style="color:#475569">${stage.requirements}</span>
        </div>
        <div class="stage-state" style="font-size:12px; margin-bottom:10px;">
          <strong>State:</strong> <span style="color:var(--accent-blue)">${stage.completionState}</span>
        </div>
        <div class="stage-skills">
          ${stage.skills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
        </div>
      </div>
      <button class="stage-open" type="button" aria-label="View details for ${stage.title}">View details <span aria-hidden="true">→</span></button>
    `;

    const openDetails = () => {
      const dialog = document.getElementById('roadmap-stage-dialog');
      document.getElementById('roadmap-dialog-title').textContent = stage.title;
      document.getElementById('roadmap-dialog-description').textContent = stage.description;
      document.getElementById('roadmap-dialog-requirements').textContent = stage.requirements;
      document.getElementById('roadmap-dialog-status').textContent = badgeLabel;
      const skills = document.getElementById('roadmap-dialog-skills');
      skills.replaceChildren(...stage.skills.map(skill => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip';
        chip.textContent = skill;
        return chip;
      }));
      if (dialog && !dialog.open) dialog.showModal();
    };
    card.querySelector('.stage-open').addEventListener('click', openDetails);

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

// MEMBER 1 DATA SYNC LOGIC
function syncMember1Data() {
  window.StudentProfile.saveFromInputs(
    studentState,
    typeof roadmapData !== 'undefined' ? roadmapData : roadmapStages,
    typeof backendProgressData !== 'undefined' ? backendProgressData : null,
    typeof backendRecommendations !== 'undefined' ? backendRecommendations : null
  );
  if (typeof renderRoadmapSummary === 'function') renderRoadmapSummary();
  if (typeof renderRoadmap === 'function') renderRoadmap();
  if (typeof renderDetailedRoadmapStages === 'function') renderDetailedRoadmapStages();
  if (typeof renderProgressPage === 'function') renderProgressPage();
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

// PAGE INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  window.StudentProfile.hydrate(studentState, roadmapData, typeof backendProgressData !== 'undefined' ? backendProgressData : null, typeof backendRecommendations !== 'undefined' ? backendRecommendations : null);
  renderRoadmapSummary();
  renderDeadlines();
  renderTasks();
  renderOpportunities();
  switchView('roadmap');

  const stageDialog = document.getElementById('roadmap-stage-dialog');
  if (stageDialog) {
    stageDialog.querySelector('.roadmap-dialog-close').addEventListener('click', () => stageDialog.close());
    stageDialog.querySelector('.roadmap-dialog-done').addEventListener('click', () => stageDialog.close());
    stageDialog.addEventListener('click', event => {
      if (event.target === stageDialog) stageDialog.close();
    });
  }
});
