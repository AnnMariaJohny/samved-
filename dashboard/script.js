/* ==========================================================================
   SAMVED MEMBER 2 - DASHBOARD & CAREER JOURNEY CONTROLLER
   ========================================================================== */

// 1. STUDENT STATE (Populated from Member 1 Onboarding API/Store)
let studentState = {
  name: "Anugrah",
  education: "Bachelor's",
  goal: "AI Engineer",
  skills: ["Python", "Data Analysis", "Research Methods"],
  tasks: [
    { id: 1, text: "Read literature review paper", completed: false },
    { id: 2, text: "Meeting with academic advisor", completed: true },
    { id: 3, text: "Draft methodology section", completed: false }
  ],
  deadlines: [
    { id: 1, title: "Research Abstract Submission", daysLeft: 3 },
    { id: 2, title: "Internship Application", daysLeft: 14 }
  ]
};

// 2. 8-STAGE ROADMAP DEFINITION
const roadmapStages = [
  { id: "10th", title: "10th" },
  { id: "12th Science", title: "12th Science" },
  { id: "Bachelor's", title: "Bachelor's" },
  { id: "Current Research Project", title: "Current Project" },
  { id: "Internship", title: "Internship" },
  { id: "Master's", title: "Master's" },
  { id: "PhD", title: "PhD" },
  { id: "Research Scientist", title: "Research Scientist" }
];

// 3. OPPORTUNITIES DATABASE
const sampleOpportunities = [
  { id: 1, type: "Internship", name: "Google Research Internship", deadline: "Oct 15th", reqSkill: "Python" },
  { id: 2, type: "Hackathon", name: "AI/ML Dev Competition", deadline: "Nov 01st", reqSkill: "Data Analysis" },
  { id: 3, type: "Workshop", name: "Scientific Writing Workshop", deadline: "Oct 20th", reqSkill: "Research Methods" }
];

// ==========================================================================
// CORE RENDER FUNCTIONS
// ==========================================================================

// Render Roadmap Timeline & Shining Active Node
function renderRoadmap() {
  const container = document.getElementById('roadmap-nodes-container');
  if (!container) return;
  container.innerHTML = '';

  const currentEduIndex = window.StudentProfile.getCompletedStageIndex(studentState.education);

  roadmapStages.forEach((stage, idx) => {
    const node = document.createElement('div');
    node.className = 'roadmap-node';

    let status = '';
    if (idx <= currentEduIndex) {
      status = 'completed';
    } else if (idx === currentEduIndex + 1) {
      status = 'active'; // ACTIVE SHINING NODE
    }

    if (status) node.classList.add(status);
    node.innerHTML = `
      <div class="node-circle">${status === 'completed' ? '✓' : idx + 1}</div>
      <div class="node-title">${stage.title}</div>
    `;

    container.appendChild(node);
  });

  // Calculate Progress Percentage
  const pct = window.StudentProfile.getProgressPercentage(studentState.education);

  const pctLabel = document.getElementById('roadmap-pct');
  const barFill = document.getElementById('overall-progress-bar');
  if (pctLabel) pctLabel.innerText = `${pct}% Complete`;
  if (barFill) barFill.style.width = `${pct}%`;
}

// Render Deadlines
function renderDeadlines() {
  const container = document.getElementById('deadlines-container');
  if (!container) return;
  container.innerHTML = '';

  studentState.deadlines.forEach(item => {
    const div = document.createElement('div');
    div.className = 'deadline-item';
    const isUrgent = item.daysLeft <= 3;

    div.innerHTML = `
      <span style="font-size:13px; font-weight:600;">${item.title}</span>
      <span class="deadline-tag ${isUrgent ? 'tag-urgent' : 'tag-normal'}">
        ${item.daysLeft} days remaining
      </span>
    `;
    container.appendChild(div);
  });
}

// Render Tasks
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

// Render Opportunities
function renderOpportunities() {
  const container = document.getElementById('opportunities-grid');
  if (!container) return;
  container.innerHTML = '';

  sampleOpportunities.forEach(opp => {
    const card = document.createElement('div');
    card.className = 'opp-card';
    card.innerHTML = `
      <span class="opp-type">${opp.type}</span>
      <h4 style="font-size:14px; margin-bottom:6px;">${opp.name}</h4>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">Deadline: ${opp.deadline}</p>
      <button class="btn-sync" style="width:100%; font-size:12px;">View Details</button>
    `;
    container.appendChild(card);
  });
}

// ==========================================================================
// ACTION HANDLERS
// ==========================================================================

function addNewTask() {
  const input = document.getElementById('new-task-input');
  if (!input || !input.value.trim()) return;

  studentState.tasks.push({
    id: Date.now(),
    text: input.value.trim(),
    completed: false
  });
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

// Sync Member 1 Onboarding Inputs to Member 2 Dashboard
function syncMember1Data() {
  window.StudentProfile.saveFromInputs(studentState, roadmapStages, null, null);
  renderRoadmap();
}

function completeNextStep() {
  alert("Next action step marked completed! API update sent to Java backend.");
}

// PAGE INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  window.StudentProfile.hydrate(studentState, roadmapStages, null, null);
  renderRoadmap();
  renderDeadlines();
  renderTasks();
  renderOpportunities();
});