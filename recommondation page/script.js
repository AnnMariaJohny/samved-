/* ==========================================================================
   SAMVED MEMBER 2 - DASHBOARD, ROADMAP, PROGRESS, TASKS, DEADLINES, 
   OPPORTUNITIES & RECOMMENDATION UI CONTROLLER
   ========================================================================== */

// 1. SECTION 4.8 BACKEND RECOMMENDATIONS DATA (Mocked Java API Response)
// Frontend displays pre-calculated recommendation object without duplicating business logic.
let backendRecommendations = [
  {
    id: 401,
    recommendationTitle: "Enroll in Scientific Writing & Methodology Certification",
    reasoning: "Your career goal is Research Scientist. Based on Member 1 skills (Python, Data Analysis), you require formal scientific writing credentials to pass the active milestone.",
    skillMatchPercentage: 88,
    matchedSkills: ["Python", "Data Analysis"],
    missingSkills: ["Scientific Writing", "Peer Review Protocol"],
    suggestedNextAction: "Complete 'Academic Research Writing 101' before semester deadline."
  },
  {
    id: 402,
    recommendationTitle: "Apply for IISc Summer Undergraduate Fellowship",
    reasoning: "Matches your target career node 'Research Internship' and your current CGPA verified in backend.",
    skillMatchPercentage: 92,
    matchedSkills: ["Python", "Mathematics", "Calculus"],
    missingSkills: ["Lab Protocols"],
    suggestedNextAction: "Prepare CV and request faculty recommendation letter."
  }
];

let discoveryOpportunities = [
  { id: 301, name: "AMD AI DevMaster Hackathon 2026", type: "Hackathons", deadline: "Oct 25, 2026", location: "Virtual / Online", eligibility: "Undergraduate CS Students", saved: false },
  { id: 302, name: "Google Research Summer Internship", type: "Internships", deadline: "Nov 15, 2026", location: "Bangalore, India", eligibility: "B.Tech / B.Sc 3rd & 4th Year", saved: true }
];

let backendDeadlinesData = [
  { id: 201, title: "Research Abstract Final Submission", targetDate: "2026-10-05", daysRemaining: 3, urgency: "urgent" },
  { id: 202, title: "National Science Internship Application", targetDate: "2026-10-16", daysRemaining: 14, urgency: "moderate" }
];

let studentTasks = [
  { id: 101, title: "Read Literature Review", description: "Read recent papers on machine learning models.", deadline: "2026-10-15", status: "In Progress" },
  { id: 102, title: "Meeting with Advisor", description: "Discuss research abstract draft.", deadline: "2026-10-10", status: "Completed" }
];

let backendProgressData = {
  overallProgressPercentage: 42,
  completedMilestones: [
    { title: "10th Board Certification", date: "Completed May 2022", verifyCode: "CBSE-VERIFIED" },
    { title: "12th Board Certification (Science PCM)", date: "Completed May 2024", verifyCode: "CBSE-VERIFIED" }
  ],
  currentMilestone: { title: "Current Research Project", description: "Execute literature review and methodology setup.", status: "In Progress" },
  nextMilestone: { title: "Research Internship", description: "Apply and secure an 8-week research internship.", status: "Queued" }
};

let studentState = { name: "Anugrah", education: "Bachelor's", goal: "Scientist" };

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
  }
}

// ==========================================================================
// SECTION 4.8 RECOMMENDATION UI RENDER FUNCTION
// ==========================================================================
function renderRecommendationsPage() {
  const container = document.getElementById('recommendations-grid');
  if (!container) return;
  container.innerHTML = '';

  backendRecommendations.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';

    card.innerHTML = `
      <div class="recommendation-header">
        <h3 style="font-size:17px; color:var(--text-dark);">${rec.recommendationTitle}</h3>
        <span class="match-score-badge">${rec.skillMatchPercentage}% Skill Match</span>
      </div>

      <div class="reasoning-box">
        <strong>Relevance / Reasoning:</strong> ${rec.reasoning}
      </div>

      <div style="margin-bottom:16px;">
        <span style="font-size:12px; font-weight:700; color:var(--text-dark); display:block; margin-bottom:6px;">Current Skill Match:</span>
        ${rec.matchedSkills.map(s => `<span class="skill-match-tag">✓ ${s}</span>`).join('')}
        ${rec.missingSkills.map(s => `<span class="skill-match-tag" style="background:#fef3c7; color:#b45309;">+ Need: ${s}</span>`).join('')}
      </div>

      <div class="action-box">
        <div>
          <span style="font-size:11px; font-weight:800; color:var(--accent-gold); text-transform:uppercase; display:block;">Suggested Next Action</span>
          <span style="font-size:13px; font-weight:600; color:var(--text-dark);">${rec.suggestedNextAction}</span>
        </div>
        <button class="btn-gold" style="padding:8px 16px; font-size:12px;" onclick="executeSuggestedAction('${rec.recommendationTitle}')">Execute Action</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function executeSuggestedAction(title) {
  alert(`Action initiated for: ${title}`);
}

// OTHER VIEW RENDERS
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
        <button class="btn-view" onclick="alert('Viewing details')">View Details</button>
        <button class="btn-save ${opp.saved ? 'saved' : ''}" onclick="toggleSaveOpportunity(${opp.id})">${opp.saved ? 'Saved' : 'Save'}</button>
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
  if (opp) { opp.saved = !opp.saved; renderOpportunitiesDiscovery(); }
}

function renderFullDeadlinesGrid() {
  const container = document.getElementById('full-deadlines-grid');
  if (!container) return;
  container.innerHTML = '';

  backendDeadlinesData.forEach(item => {
    const card = document.createElement('div');
    card.className = `deadline-card-row ${item.urgency}`;
    card.innerHTML = `
      <div><h4 style="font-size:15px; color:var(--text-dark);">${item.title}</h4><span style="font-size:12px; color:var(--text-muted)">Target Date: ${item.targetDate}</span></div>
      <div><span class="deadline-pill pill-${item.urgency}">${item.daysRemaining} days remaining</span></div>
    `;
    container.appendChild(card);
  });
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

  studentTasks.forEach(task => {
    const card = document.createElement('div');
    const statusKey = task.status.toLowerCase().replace(" ", "");
    card.className = `single-task-card status-${statusKey}`;
    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <h4 style="font-size:15px; color:var(--text-dark);">${task.title}</h4>
          <span class="stage-badge badge-${task.status === 'Completed' ? 'completed' : 'active'}">${task.status}</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">${task.description || ''}</p>
        <div style="font-size:12px; font-weight:600; color:var(--accent-gold);">Deadline: ${task.deadline}</div>
      </div>
      <div class="task-card-actions">
        <button class="btn-sm btn-complete" onclick="toggleTaskComplete(${task.id})">${task.status === 'Completed' ? 'Undo' : 'Complete'}</button>
        <button class="btn-sm btn-delete" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });

  renderQuickTasks();
}

function deleteTask(id) { studentTasks = studentTasks.filter(t => t.id !== id); renderFullTaskGrid(); }
function toggleTaskComplete(id) { const task = studentTasks.find(t => t.id === id); if (task) task.status = (task.status === 'Completed') ? 'Pending' : 'Completed'; renderFullTaskGrid(); }

function renderQuickTasks() {
  const container = document.getElementById('quick-task-list-container');
  if (!container) return;
  container.innerHTML = '';
  studentTasks.forEach(task => {
    const li = document.createElement('li');
    li.style.cssText = "display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color); font-size:13px;";
    li.innerHTML = `<span>${task.title}</span><span class="stage-badge badge-active">${task.status}</span>`;
    container.appendChild(li);
  });
}

function renderProgressPage() {
  document.getElementById('backend-progress-pct').innerText = `${backendProgressData.overallProgressPercentage}%`;
  document.getElementById('current-ms-title').innerText = backendProgressData.currentMilestone.title;
  document.getElementById('current-ms-desc').innerText = backendProgressData.currentMilestone.description;
  document.getElementById('next-ms-title').innerText = backendProgressData.nextMilestone.title;
  document.getElementById('next-ms-desc').innerText = backendProgressData.nextMilestone.description;
}

function renderRoadmapSummary() {
  const container = document.getElementById('roadmap-nodes-container');
  if (!container) return;
  container.innerHTML = '';
  const currentEduIndex = window.StudentProfile.getCompletedStageIndex(studentState.education);

  roadmapData.forEach((stage, idx) => {
    const node = document.createElement('div');
    node.className = `roadmap-node ${idx <= currentEduIndex ? 'completed' : idx === currentEduIndex + 1 ? 'active' : ''}`;
    node.innerHTML = `<div class="node-circle">${idx <= currentEduIndex ? '✓' : idx + 1}</div><div class="node-title">${stage.id}</div>`;
    container.appendChild(node);
  });

  document.getElementById('roadmap-pct').innerText = `${backendProgressData.overallProgressPercentage}% Complete`;
  document.getElementById('overall-progress-bar').style.width = `${backendProgressData.overallProgressPercentage}%`;
}

function renderDetailedRoadmapStages() {
  const container = document.getElementById('roadmap-stages-container');
  if (!container) return;
  container.innerHTML = '';
  roadmapData.forEach(stage => {
    const card = document.createElement('div');
    card.className = 'stage-card completed';
    card.innerHTML = `<div><h3>${stage.title}</h3><p>${stage.description}</p></div>`;
    container.appendChild(card);
  });
}

function syncMember1Data() {
  window.StudentProfile.saveFromInputs(studentState, roadmapData, backendProgressData, backendRecommendations);
  renderRoadmapSummary();
  renderDetailedRoadmapStages();
  renderProgressPage();
  renderRecommendationsPage();
}

function completeNextStep() { alert("Milestone updated via Java Backend API call."); }

window.addEventListener('DOMContentLoaded', () => {
  window.StudentProfile.hydrate(studentState, roadmapData, backendProgressData, backendRecommendations);
  renderRoadmapSummary();
  renderQuickDeadlines();
  renderQuickTasks();
  renderOpportunitiesDiscovery();
  switchView('recommendations');
});