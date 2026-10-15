/* ==========================================================================
   SAMVED MEMBER 2 - COMPLETE CONTROLLER (INCLUDES 4.9 CANVAS CHARTS)
   ========================================================================== */

// 1. DATA MODELS
let academicData = [
  { semester: "Sem 1", cgpa: 8.2 },
  { semester: "Sem 2", cgpa: 8.5 },
  { semester: "Sem 3", cgpa: 8.7 },
  { semester: "Sem 4", cgpa: 8.9 }
];

let skillMasteryData = [
  { skill: "Python", level: 85 },
  { skill: "Data Struct", level: 80 },
  { skill: "Research", level: 75 },
  { skill: "Writing", level: 65 }
];

let backendRecommendations = [
  {
    id: 401,
    recommendationTitle: "Enroll in Scientific Writing Certification",
    reasoning: "Your career goal is Research Scientist. Based on Member 1 skills, you require formal writing credentials.",
    skillMatchPercentage: 88,
    matchedSkills: ["Python", "Data Analysis"],
    missingSkills: ["Scientific Writing"],
    suggestedNextAction: "Complete 'Academic Research Writing 101'."
  }
];

let discoveryOpportunities = [
  { id: 301, name: "AMD AI DevMaster Hackathon 2026", type: "Hackathons", deadline: "Oct 25, 2026", location: "Online", eligibility: "CS Students", saved: false }
];

let backendDeadlinesData = [
  { id: 201, title: "Research Abstract Final Submission", targetDate: "2026-10-05", daysRemaining: 3, urgency: "urgent" }
];

let studentTasks = [
  { id: 101, title: "Read Literature Review", description: "Read recent papers.", deadline: "2026-10-15", status: "In Progress" }
];

let backendProgressData = {
  overallProgressPercentage: 42,
  completedMilestones: [{ title: "10th Board Certification", date: "May 2022", verifyCode: "CBSE-VERIFIED" }],
  currentMilestone: { title: "Current Research Project", description: "Execute literature review.", status: "In Progress" },
  nextMilestone: { title: "Research Internship", description: "Apply for 8-week internship.", status: "Queued" }
};

let studentState = { name: "Anugrah", education: "Bachelor's", goal: "Scientist" };

const roadmapData = [
  { id: "10th", title: "10th Grade Standard" }, { id: "12th Science", title: "12th Grade Science" },
  { id: "Bachelor's", title: "Bachelor's Degree" }, { id: "Current Research Project", title: "Current Research Project" },
  { id: "Internship", title: "Research Internship" }, { id: "Master's", title: "Master's Degree" },
  { id: "PhD", title: "Doctoral Studies (PhD)" }, { id: "Research Scientist", title: "Research Scientist Goal" }
];

// VIEW SWITCHER
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
  } else if (viewName === 'tasks') {
    document.getElementById('view-tasks').classList.add('active');
    document.getElementById('nav-tasks').classList.add('active');
    document.getElementById('page-title').innerText = "4.5 Daily Tasks Interface";
    renderFullTaskGrid();
  } else if (viewName === 'deadlines') {
    document.getElementById('view-deadlines').classList.add('active');
    document.getElementById('nav-deadlines').classList.add('active');
    document.getElementById('page-title').innerText = "4.6 Deadline System";
    renderFullDeadlinesGrid();
  } else if (viewName === 'opportunities') {
    document.getElementById('view-opportunities').classList.add('active');
    document.getElementById('nav-opportunities').classList.add('active');
    document.getElementById('page-title').innerText = "4.7 Opportunity Discovery";
    renderOpportunitiesDiscovery('All');
  } else if (viewName === 'recommendations') {
    document.getElementById('view-recommendations').classList.add('active');
    document.getElementById('nav-recommendations').classList.add('active');
    document.getElementById('page-title').innerText = "4.8 Recommendation UI";
    renderRecommendationsPage();
  } else if (viewName === 'charts') {
    document.getElementById('view-charts').classList.add('active');
    document.getElementById('nav-charts').classList.add('active');
    document.getElementById('page-title').innerText = "4.9 Analytics & Visual Charts";
    renderAllCanvasCharts();
  }
}

// ==========================================================================
// SECTION 4.9 BROWSER-SIDE CANVAS CHARTS
// ==========================================================================
function renderAllCanvasCharts() {
  renderCGPALineChart();
  renderSkillBarChart();
}

// 1. CGPA LINE CHART
function renderCGPALineChart() {
  const canvas = document.getElementById('cgpaChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  // Axes
  ctx.beginPath();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // Plot Points
  const stepX = width / (academicData.length - 1);
  const minCGPA = 7.0;
  const maxCGPA = 10.0;

  ctx.beginPath();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;

  academicData.forEach((d, i) => {
    const x = padding + i * stepX;
    const y = canvas.height - padding - ((d.cgpa - minCGPA) / (maxCGPA - minCGPA)) * height;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points & Labels
  academicData.forEach((d, i) => {
    const x = padding + i * stepX;
    const y = canvas.height - padding - ((d.cgpa - minCGPA) / (maxCGPA - minCGPA)) * height;

    // Circle
    ctx.beginPath();
    ctx.fillStyle = '#d97706';
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Text Label
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${d.semester} (${d.cgpa})`, x - 20, y - 10);
  });
}

// 2. SKILL BAR CHART
function renderSkillBarChart() {
  const canvas = document.getElementById('skillsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;
  const barWidth = width / skillMasteryData.length - 20;

  skillMasteryData.forEach((d, i) => {
    const x = padding + i * (barWidth + 20) + 10;
    const barHeight = (d.level / 100) * height;
    const y = canvas.height - padding - barHeight;

    // Bar
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Label
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.fillText(d.skill, x, canvas.height - padding + 15);
    ctx.fillText(`${d.level}%`, x + 5, y - 5);
  });
}

// OTHER RENDERS
function renderRecommendationsPage() {
  const container = document.getElementById('recommendations-grid');
  if (!container) return;
  container.innerHTML = '';
  backendRecommendations.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `<h3>${rec.recommendationTitle}</h3><p>${rec.reasoning}</p>`;
    container.appendChild(card);
  });
}

function renderOpportunitiesDiscovery() {
  const container = document.getElementById('discovery-opp-grid');
  if (!container) return;
  container.innerHTML = '';
  discoveryOpportunities.forEach(opp => {
    const card = document.createElement('div');
    card.className = 'discovery-card';
    card.innerHTML = `<h3>${opp.name}</h3>`;
    container.appendChild(card);
  });
}

function renderFullDeadlinesGrid() {
  const container = document.getElementById('full-deadlines-grid');
  if (!container) return;
  container.innerHTML = '';
  backendDeadlinesData.forEach(item => {
    const card = document.createElement('div');
    card.className = `deadline-card-row ${item.urgency}`;
    card.innerHTML = `<h4>${item.title}</h4><span>${item.daysRemaining} days remaining</span>`;
    container.appendChild(card);
  });
}

function renderFullTaskGrid() {
  const container = document.getElementById('full-task-grid');
  if (!container) return;
  container.innerHTML = '';
  studentTasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'single-task-card';
    card.innerHTML = `<h4>${task.title}</h4>`;
    container.appendChild(card);
  });
}

function renderProgressPage() {
  document.getElementById('backend-progress-pct').innerText = `${backendProgressData.overallProgressPercentage}%`;
}

function renderRoadmapSummary() {
  const container = document.getElementById('roadmap-nodes-container');
  if (!container) return;
  container.innerHTML = '';
  const currentEduIndex = window.StudentProfile.getCompletedStageIndex(studentState.education);
  roadmapData.forEach((stage, idx) => {
    const node = document.createElement('div');
    const isCompleted = idx <= currentEduIndex;
    node.className = `roadmap-node ${isCompleted ? 'completed' : idx === currentEduIndex + 1 ? 'active' : ''}`;
    node.innerHTML = `<div class="node-circle">${isCompleted ? '✓' : idx + 1}</div><div class="node-title">${stage.id}</div>`;
    container.appendChild(node);
  });
}

function syncMember1Data() {
  window.StudentProfile.saveFromInputs(studentState, roadmapData, backendProgressData, backendRecommendations);
  renderRoadmapSummary();
  if (typeof renderDetailedRoadmapStages === 'function') renderDetailedRoadmapStages();
  renderProgressPage();
  renderRecommendationsPage();
}

function completeNextStep() { alert("Demo only: backend update pending."); }

window.addEventListener('DOMContentLoaded', () => {
  window.StudentProfile.hydrate(studentState, roadmapData, backendProgressData, backendRecommendations);
  renderRoadmapSummary();
  renderFullDeadlinesGrid();
  renderFullTaskGrid();
  renderOpportunitiesDiscovery();
  switchView('charts');
});
