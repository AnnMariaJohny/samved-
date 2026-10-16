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
      <button class="btn-sync opportunity-view" type="button" style="width:100%; font-size:12px;">View Details</button>
    `;
    card.querySelector('.opportunity-view').addEventListener('click', () => {
      const dialog = document.getElementById('opportunity-dialog');
      if (!dialog) return;
      document.getElementById('opportunity-dialog-type').textContent = opp.type;
      document.getElementById('opportunity-dialog-title').textContent = opp.name;
      document.getElementById('opportunity-dialog-description').textContent = `This ${opp.type.toLowerCase()} may be a good fit for your career journey. Build your ${opp.reqSkill} skills and review the eligibility details before applying.`;
      document.getElementById('opportunity-dialog-deadline').textContent = `Deadline: ${opp.deadline} · Suggested skill: ${opp.reqSkill}`;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
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
  const title = document.getElementById('next-step-title');
  const button = document.querySelector('.next-step-card .btn-gold');
  if (!title || !button || button.disabled) return;
  title.textContent = 'Great progress — choose your next step';
  button.textContent = 'Completed ✓';
  button.disabled = true;
  button.setAttribute('aria-pressed', 'true');
  button.closest('.next-step-card').classList.add('step-complete');
}

// A small, searchable career guide that works entirely in the browser.
const careerGuide = [
  { title: 'Software Engineer', tags: 'software technology coding developer', icon: '⌘', intro: 'Build and maintain the software people use every day.', first: 'Try a small project in a language such as JavaScript, Python, or Java.' },
  { title: 'Data Scientist', tags: 'data science research statistics', icon: '▥', intro: 'Use data, statistics, and clear questions to find useful patterns.', first: 'Explore a public dataset and explain one pattern you discover.' },
  { title: 'AI Engineer', tags: 'artificial intelligence technology machine learning', icon: '✧', intro: 'Create and connect AI systems to solve practical problems.', first: 'Learn basic Python and experiment with a beginner-friendly machine learning lesson.' },
  { title: 'Scientist', tags: 'science research laboratory', icon: '⚗', intro: 'Ask questions about the world and investigate them with evidence.', first: 'Pick a topic you are curious about and read an introductory research article.' },
  { title: 'UI/UX Designer', tags: 'design creative product user experience', icon: '◈', intro: 'Make digital products easier and more enjoyable for people to use.', first: 'Redesign one screen you use often and ask someone for feedback.' },
  { title: 'Doctor', tags: 'health medicine biology care', icon: '＋', intro: 'Help people protect and improve their health through medical care.', first: 'Learn about local course requirements and speak with a healthcare professional.' },
  { title: 'Teacher', tags: 'education teaching learning', icon: '✎', intro: 'Help learners build knowledge, confidence, and new skills.', first: 'Choose a subject you enjoy and try explaining one idea to a friend.' },
  { title: 'Cybersecurity Analyst', tags: 'security technology computers network', icon: '⬡', intro: 'Help protect computers, networks, and information from digital threats.', first: 'Start with networking basics and safe, beginner-level security exercises.' },
  { title: 'Entrepreneur', tags: 'business startup founder creative', icon: '↗', intro: 'Turn a useful idea into a service or organization that can grow.', first: 'Ask a few people about a problem they would like solved.' },
  { title: 'Architect', tags: 'buildings design creative engineering', icon: '⌂', intro: 'Design spaces and buildings that meet people’s needs.', first: 'Sketch a space you would improve and note what its users need.' },
  { title: 'Civil Servant', tags: 'government public policy service', icon: '◎', intro: 'Support communities by helping public services and institutions work well.', first: 'Explore public-service roles and the requirements in your region.' },
  { title: 'Product Manager', tags: 'product business technology planning', icon: '◉', intro: 'Help a team decide what to build and why it matters to its users.', first: 'Pick an app you use and write down one improvement and who it helps.' }
];

function renderCareerExplorer(query = '') {
  const results = document.getElementById('career-suggestions');
  const search = document.getElementById('career-search');
  const clear = document.getElementById('career-search-clear');
  if (!results || !search) return;
  const normalized = query.trim().toLowerCase();
  const matches = careerGuide.filter(career => `${career.title} ${career.tags}`.toLowerCase().includes(normalized)).slice(0, 6);
  results.replaceChildren();
  if (clear) clear.hidden = !normalized;
  matches.forEach((career, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'career-suggestion';
    button.textContent = career.title;
    button.style.animationDelay = `${index * 35}ms`;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => showCareer(career, button));
    results.append(button);
  });
  if (normalized && matches.length) showCareer(matches[0], results.querySelector('.career-suggestion'));
  if (normalized && !matches.length) {
    const empty = document.createElement('span');
    empty.className = 'career-no-results';
    empty.textContent = 'No matches yet. Try “design”, “science”, or “technology”.';
    results.append(empty);
    const detail = document.getElementById('career-detail');
    if (detail) {
      detail.hidden = false;
      detail.innerHTML = '<span class="career-detail-icon" aria-hidden="true">⌕</span><div><strong>No career match yet</strong><p>Try a shorter career name or a related interest such as design, science, or technology.</p></div>';
    }
  } else if (!normalized) {
    const detail = document.getElementById('career-detail');
    if (detail) {
      detail.replaceChildren();
      detail.hidden = true;
    }
  }
}

function showCareer(career, button) {
  const detail = document.getElementById('career-detail');
  if (!detail) return;
  detail.hidden = false;
  document.querySelectorAll('.career-suggestion[aria-pressed="true"]').forEach(item => item.setAttribute('aria-pressed', 'false'));
  if (button) button.setAttribute('aria-pressed', 'true');
  detail.innerHTML = `<span class="career-detail-icon" aria-hidden="true">${career.icon}</span><div><strong>${career.title}</strong><p>${career.intro}</p><p><b>A first step:</b> ${career.first}</p></div>`;
}

function setupDashboardProfileCompletion() {
  const storageKey = 'samved.planner.profile-sections.v1';
  const sectionNames = ['Academic Details', 'Interests', 'Skills', 'Strengths', 'Values', 'Career Goal', 'Assessment', 'Profile'];
  let completed = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) completed = [...new Set(saved.filter(name => sectionNames.includes(name)))];
  } catch { /* Keep the checklist interactive when browser storage is unavailable. */ }
  const buttons = [...document.querySelectorAll('#dashboard-profile-sections [data-section]')];
  const render = () => {
    const count = completed.length;
    const percent = Math.round(count / sectionNames.length * 100);
    buttons.forEach(button => {
      const done = completed.includes(button.dataset.section);
      button.classList.toggle('is-complete', done);
      button.setAttribute('aria-pressed', String(done));
    });
    const countLabel = document.getElementById('profile-completion-count');
    const percentLabel = document.getElementById('dashboard-profile-percent');
    const progress = document.getElementById('dashboard-profile-progress');
    const fill = document.getElementById('dashboard-profile-progress-fill');
    if (countLabel) countLabel.textContent = `${count} of ${sectionNames.length}`;
    if (percentLabel) percentLabel.textContent = `${percent}%`;
    if (progress) progress.setAttribute('aria-valuenow', String(percent));
    if (fill) fill.style.width = `${percent}%`;
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.section;
    completed = completed.includes(name) ? completed.filter(item => item !== name) : [...completed, name];
    try { localStorage.setItem(storageKey, JSON.stringify(completed)); } catch { /* Keep this page usable without storage. */ }
    render();
  }));
  render();
}

// PAGE INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  window.StudentProfile.hydrate(studentState, roadmapStages, null, null);
  setupDashboardProfileCompletion();
  renderRoadmap();
  renderDeadlines();
  renderTasks();
  renderOpportunities();
  const careerSearch = document.getElementById('career-search');
  if (careerSearch) {
    renderCareerExplorer();
    careerSearch.addEventListener('input', () => renderCareerExplorer(careerSearch.value));
    document.getElementById('career-search-clear').addEventListener('click', () => {
      careerSearch.value = '';
      renderCareerExplorer();
      careerSearch.focus();
    });
  }

  const roadmap = document.getElementById('roadmap-nodes-container');
  const roadmapBack = document.getElementById('roadmap-back');
  const roadmapForward = document.getElementById('roadmap-forward');
  const updateRoadmapControls = () => {
    if (!roadmap) return;
    if (roadmapBack) roadmapBack.disabled = roadmap.scrollLeft <= 1;
    if (roadmapForward) roadmapForward.disabled = roadmap.scrollLeft + roadmap.clientWidth >= roadmap.scrollWidth - 1;
  };
  if (roadmap && roadmapBack && roadmapForward) {
    roadmapBack.addEventListener('click', () => roadmap.scrollBy({ left: -roadmap.clientWidth * .75, behavior: 'smooth' }));
    roadmapForward.addEventListener('click', () => roadmap.scrollBy({ left: roadmap.clientWidth * .75, behavior: 'smooth' }));
    roadmap.addEventListener('scroll', updateRoadmapControls, { passive: true });
    window.addEventListener('resize', updateRoadmapControls);
    requestAnimationFrame(updateRoadmapControls);
  }

  const opportunityDialog = document.getElementById('opportunity-dialog');
  const closeDialog = document.getElementById('opportunity-dialog-close');
  if (opportunityDialog && closeDialog) {
    closeDialog.addEventListener('click', () => opportunityDialog.close());
    opportunityDialog.addEventListener('click', event => {
      if (event.target === opportunityDialog) opportunityDialog.close();
    });
  }

  const taskInput = document.getElementById('new-task-input');
  if (taskInput) taskInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') addNewTask();
  });
});
