(() => {
  const storageKey = 'samved.student-profile.v1';
  let saveStatusTimer;
  const educationOptions = [
    { value: '10th', label: '10th Passed' },
    { value: '12th Science', label: '12th Science Passed' },
    { value: "Bachelor's", label: "Bachelor's (In Progress)" },
    { value: "Master's", label: "Master's Passed" }
  ];
  const goalOptions = [
    'Scientist', 'Software Engineer', 'Researcher', 'Data Scientist', 'AI Engineer',
    'Cybersecurity Analyst', 'Product Manager', 'UI/UX Designer', 'Business Analyst',
    'Doctor', 'Teacher', 'Entrepreneur', 'Civil Servant', 'Banking Professional',
    'Graphic Designer', 'Cloud Engineer', 'Robotics Engineer', 'Lawyer', 'Architect',
    'Finance Analyst'
  ];
  const defaultProfile = { name: 'Anugrah', education: "Bachelor's", goal: 'Scientist' };
  const educationProgress = { '10th': 0, '12th Science': 1, "Bachelor's": 2, "Master's": 5 };
  const progressPercentages = { '10th': 13, '12th Science': 25, "Bachelor's": 42, "Master's": 75 };
  const plans = {
    'Scientist': { field: 'scientific research', degree: 'Science degree in a selected research field', project: 'Complete a supervised scientific research project', internship: 'Research laboratory internship', advanced: "Master's and doctoral research training", practice: 'Publish peer-reviewed research', skills: ['Research methods', 'Data analysis', 'Scientific writing'], credential: 'Research methods certification', action: 'Write a research question and outline an experiment.' },
    'Software Engineer': { field: 'software engineering', degree: 'Computer science or software engineering degree', project: 'Build and deploy a software application', internship: 'Software engineering internship', advanced: 'Advanced software systems specialization', practice: 'Ship and maintain a production software project', skills: ['Programming', 'Algorithms', 'Software testing'], credential: 'Cloud or software engineering certification', action: 'Build a tested application and publish its code portfolio.' },
    'Researcher': { field: 'academic research', degree: 'Degree in a research-focused discipline', project: 'Complete a faculty-supervised research project', internship: 'Academic research internship', advanced: 'Graduate research and thesis training', practice: 'Present or publish original research', skills: ['Research design', 'Data analysis', 'Academic writing'], credential: 'Research ethics certification', action: 'Prepare a research proposal and request faculty feedback.' },
    'Data Scientist': { field: 'data science', degree: 'Statistics, mathematics, or data science degree', project: 'Build an end-to-end data analysis project', internship: 'Data science internship', advanced: 'Advanced statistics and machine learning specialization', practice: 'Deliver a validated analytics project', skills: ['Statistics', 'Python', 'Data visualization'], credential: 'Applied machine learning certification', action: 'Publish a reproducible analysis using a real dataset.' },
    'AI Engineer': { field: 'artificial intelligence engineering', degree: 'Computer science or artificial intelligence degree', project: 'Build and evaluate an AI application', internship: 'AI engineering internship', advanced: 'Advanced machine learning specialization', practice: 'Deploy and monitor an AI system', skills: ['Python', 'Machine learning', 'Model evaluation'], credential: 'Applied AI engineering certification', action: 'Build an evaluated model and document its limitations.' },
    'Cybersecurity Analyst': { field: 'cybersecurity', degree: 'Cybersecurity or computer science degree', project: 'Complete a defensive security assessment', internship: 'Cybersecurity analyst internship', advanced: 'Advanced security operations specialization', practice: 'Run a documented incident-response exercise', skills: ['Network security', 'Threat analysis', 'Incident response'], credential: 'Entry-level security certification', action: 'Create a home lab and document a defensive security exercise.' },
    'Product Manager': { field: 'product management', degree: 'Degree in business, technology, or a related field', project: 'Research and prototype a user-focused product', internship: 'Associate product management internship', advanced: 'Product strategy and analytics specialization', practice: 'Lead a measurable product release', skills: ['User research', 'Product analytics', 'Roadmapping'], credential: 'Product management certification', action: 'Write a product brief with user evidence and success metrics.' },
    'UI/UX Designer': { field: 'user experience design', degree: 'Design or human-computer interaction degree', project: 'Design and test an accessible product experience', internship: 'UX or product design internship', advanced: 'Advanced interaction design specialization', practice: 'Publish a research-backed design case study', skills: ['User research', 'Prototyping', 'Accessibility'], credential: 'UX research certification', action: 'Test a prototype with users and document the design decisions.' },
    'Business Analyst': { field: 'business analysis', degree: 'Business, information systems, or analytics degree', project: 'Map and improve a business process', internship: 'Business analysis internship', advanced: 'Business intelligence and process strategy specialization', practice: 'Deliver a requirements-backed improvement project', skills: ['Requirements analysis', 'SQL', 'Process mapping'], credential: 'Business analysis certification', action: 'Create a process map and a concise stakeholder requirements brief.' },
    'Doctor': { field: 'medicine', degree: 'Pre-medical or medical sciences degree', project: 'Complete a supervised clinical or public health project', internship: 'Clinical observership or medical internship', advanced: 'Medical degree and supervised residency training', practice: 'Complete licensing and supervised clinical practice', skills: ['Biology', 'Clinical communication', 'Evidence-based care'], credential: 'First aid and clinical skills certification', action: 'Map the accredited medical education and licensing requirements in your region.' },
    'Teacher': { field: 'education', degree: 'Degree in education or a chosen teaching subject', project: 'Plan and deliver a measured learning unit', internship: 'Supervised teaching placement', advanced: 'Teacher licensure and advanced pedagogy training', practice: 'Build a teaching portfolio with learner outcomes', skills: ['Lesson planning', 'Assessment', 'Inclusive teaching'], credential: 'Teaching qualification for your region', action: 'Design a lesson plan with clear learning and assessment goals.' },
    'Entrepreneur': { field: 'entrepreneurship', degree: 'Business or domain-focused degree', project: 'Validate a customer problem with a small prototype', internship: 'Startup operations or product internship', advanced: 'Venture finance and business strategy training', practice: 'Launch and measure a validated business pilot', skills: ['Customer discovery', 'Business modeling', 'Financial planning'], credential: 'Small business finance training', action: 'Interview potential customers and test one business assumption.' },
    'Civil Servant': { field: 'public administration', degree: 'Degree aligned with public service examinations', project: 'Prepare a policy research and analysis brief', internship: 'Public administration or policy internship', advanced: 'Public policy and civil service examination preparation', practice: 'Complete the relevant public service selection process', skills: ['Policy analysis', 'Current affairs', 'Structured writing'], credential: 'Public policy or governance course', action: 'Check the official eligibility and examination syllabus for your region.' },
    'Banking Professional': { field: 'banking and finance', degree: 'Finance, economics, or accounting degree', project: 'Analyze a banking or financial risk case', internship: 'Banking operations or credit internship', advanced: 'Banking risk and financial regulation specialization', practice: 'Complete role-specific banking qualifications', skills: ['Financial analysis', 'Risk assessment', 'Compliance'], credential: 'Financial compliance certification', action: 'Build a financial analysis case study and review banking regulations.' },
    'Graphic Designer': { field: 'graphic design', degree: 'Graphic design or visual communication degree', project: 'Create a cohesive identity and campaign portfolio', internship: 'Graphic design studio internship', advanced: 'Brand systems and visual communication specialization', practice: 'Publish a polished client-style design portfolio', skills: ['Typography', 'Visual systems', 'Design software'], credential: 'Digital design tools certification', action: 'Create three portfolio pieces for one clearly defined audience.' },
    'Cloud Engineer': { field: 'cloud engineering', degree: 'Computer science, IT, or cloud computing degree', project: 'Deploy a secure cloud-native application', internship: 'Cloud engineering internship', advanced: 'Cloud architecture and reliability specialization', practice: 'Automate and monitor a production-style cloud service', skills: ['Networking', 'Cloud platforms', 'Infrastructure as code'], credential: 'Cloud practitioner certification', action: 'Deploy a small service and document its security and cost controls.' },
    'Robotics Engineer': { field: 'robotics engineering', degree: 'Robotics, electrical, or mechanical engineering degree', project: 'Build and test an autonomous robotics prototype', internship: 'Robotics engineering internship', advanced: 'Advanced controls and autonomous systems specialization', practice: 'Validate a complete robotics system against requirements', skills: ['Control systems', 'Embedded programming', 'Mechanical design'], credential: 'Robotics systems certification', action: 'Prototype a sensor-driven system and record its test results.' },
    'Lawyer': { field: 'law', degree: 'Recognized law degree for your region', project: 'Prepare a supervised legal research brief', internship: 'Legal clinic or law firm internship', advanced: 'Bar qualification and specialist legal training', practice: 'Complete licensing and supervised legal practice', skills: ['Legal research', 'Case analysis', 'Professional writing'], credential: 'Legal practice qualification for your region', action: 'Check the official law-school and licensing path for your jurisdiction.' },
    'Architect': { field: 'architecture', degree: 'Accredited architecture degree', project: 'Develop a sustainable design studio project', internship: 'Architecture practice internship', advanced: 'Professional architecture training and licensing', practice: 'Complete a documented building design portfolio', skills: ['Spatial design', 'Building systems', 'Technical drawing'], credential: 'Architecture licensing requirements for your region', action: 'Review accredited architecture programs and portfolio requirements.' },
    'Finance Analyst': { field: 'financial analysis', degree: 'Finance, economics, or accounting degree', project: 'Build a documented company valuation model', internship: 'Financial analyst internship', advanced: 'Advanced valuation and investment analysis specialization', practice: 'Present a defensible investment analysis', skills: ['Accounting', 'Valuation', 'Financial modeling'], credential: 'Financial modeling certification', action: 'Build a valuation model and explain its assumptions and risks.' }
  };

  function readProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return {
        name: typeof saved?.name === 'string' && saved.name.trim() ? saved.name.trim() : defaultProfile.name,
        education: educationOptions.some(option => option.value === saved?.education) ? saved.education : defaultProfile.education,
        goal: goalOptions.includes(saved?.goal) ? saved.goal : defaultProfile.goal
      };
    } catch {
      return { ...defaultProfile };
    }
  }

  function getRoadmap(goal) {
    const plan = plans[goal] || plans[defaultProfile.goal];
    return [
      { id: '10th', title: '10th Grade Foundations', description: `Build core academic foundations for ${plan.field}.`, requirements: 'Complete secondary education and strengthen communication, mathematics, and problem-solving.', skills: ['Communication', 'Mathematics', 'Problem-solving'], completionState: 'Foundational stage' },
      { id: '12th Science', title: 'Senior Secondary Preparation', description: `Choose relevant subjects and build a foundation for ${plan.field}.`, requirements: 'Complete senior secondary education and check subject prerequisites for local programs.', skills: ['Subject foundations', 'Research', 'Digital literacy'], completionState: 'Secondary education stage' },
      { id: "Bachelor's", title: plan.degree, description: `Earn a recognized undergraduate qualification for ${plan.field}.`, requirements: 'Complete an accredited degree and build a portfolio of relevant work.', skills: plan.skills, completionState: 'Undergraduate study' },
      { id: `${goal} Project`, title: plan.project, description: `Complete a practical project that demonstrates readiness for ${goal}.`, requirements: `Document your process, outcomes, and reflection for a ${goal} portfolio.`, skills: plan.skills, completionState: 'Goal-focused project' },
      { id: `${goal} Internship`, title: plan.internship, description: `Gain supervised experience in ${plan.field}.`, requirements: 'Apply to relevant placements and record evidence of completed work.', skills: [plan.skills[0], 'Collaboration', 'Professional communication'], completionState: 'Career experience' },
      { id: "Master's", title: plan.advanced, description: `Pursue advanced study or credentials that support a career in ${plan.field}.`, requirements: 'Select accredited advanced training that fits your location and career path.', skills: [plan.skills[1], plan.skills[2], 'Specialist practice'], completionState: 'Advanced training' },
      { id: 'Professional Practice', title: plan.practice, description: `Apply your training in a supervised, measurable ${plan.field} setting.`, requirements: 'Meet local professional, portfolio, or licensing requirements.', skills: ['Professional standards', 'Project delivery', 'Reflection'], completionState: 'Professional milestone' },
      { id: goal, title: `${goal} Career Goal`, description: `Build a sustainable career as a ${goal} through continued learning and demonstrated results.`, requirements: `Demonstrate the qualifications and experience expected for ${goal} roles in your region.`, skills: plan.skills, completionState: 'Career goal' }
    ];
  }

  function updateRoadmap(roadmap, goal) {
    if (!Array.isArray(roadmap) || roadmap.length === 0) return [];
    const stages = getRoadmap(goal);
    roadmap.splice(0, roadmap.length, ...stages.map((stage, index) => ({ ...stage, ...(roadmap[index] || {}) })));
    stages.forEach((stage, index) => Object.assign(roadmap[index], stage));
    return roadmap;
  }

  function getCompletedStageIndex(education) {
    return educationProgress[education] ?? educationProgress[defaultProfile.education];
  }

  function updateProgress(progress, roadmap, profile) {
    if (!progress || !Array.isArray(roadmap) || roadmap.length === 0) return;
    const activeIndex = Math.min(getCompletedStageIndex(profile.education) + 1, roadmap.length - 1);
    const current = roadmap[activeIndex];
    const next = roadmap[Math.min(activeIndex + 1, roadmap.length - 1)];
    progress.overallProgressPercentage = progressPercentages[profile.education] || 42;
    progress.currentMilestone = { ...progress.currentMilestone, title: current.title, description: current.description, status: 'In Progress' };
    progress.nextMilestone = { ...progress.nextMilestone, title: next.title, description: next.description, status: 'Queued' };
  }

  function getRecommendations(goal) {
    const plan = plans[goal] || plans[defaultProfile.goal];
    return [
      {
        id: 401,
        recommendationTitle: plan.project,
        reasoning: `This project builds practical evidence for your ${goal} roadmap and current education stage.`,
        skillMatchPercentage: 88,
        matchedSkills: plan.skills.slice(0, 2),
        missingSkills: [plan.skills[2]],
        suggestedNextAction: plan.action
      },
      {
        id: 402,
        recommendationTitle: `Prepare for a ${goal} placement`,
        reasoning: `Relevant supervised experience will help you apply your ${plan.field} training in a real setting.`,
        skillMatchPercentage: 92,
        matchedSkills: [plan.skills[0], plan.skills[1]],
        missingSkills: [plan.credential],
        suggestedNextAction: `Prepare a portfolio and research requirements for a ${plan.internship.toLowerCase()}.`
      }
    ];
  }

  function setOptions(select, options) {
    if (!select) return;
    const matches = select.options.length === options.length && options.every((option, index) =>
      select.options[index].value === option.value && select.options[index].textContent === option.label
    );
    if (matches) return;
    const currentValue = select.value;
    select.replaceChildren(...options.map(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      return option;
    }));
    if (options.some(option => option.value === currentValue)) select.value = currentValue;
  }

  function apply(profile, state, roadmap, progress, recommendations) {
    Object.assign(state, profile);
    const nameInput = document.getElementById('m1-name');
    const educationInput = document.getElementById('m1-edu');
    const goalInput = document.getElementById('m1-goal');
    setOptions(educationInput, educationOptions);
    setOptions(goalInput, goalOptions.map(goal => ({ value: goal, label: goal })));
    if (nameInput && document.activeElement !== nameInput) nameInput.value = profile.name;
    if (educationInput && document.activeElement !== educationInput) educationInput.value = profile.education;
    if (goalInput && document.activeElement !== goalInput) goalInput.value = profile.goal;

    const sidebarName = document.getElementById('sidebar-name');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const welcomeHeading = document.getElementById('welcome-heading');
    const goalLabel = document.getElementById('header-goal-text');
    const headerName = document.getElementById('header-profile-name');
    const recommendationGoal = document.getElementById('rec-goal-label');
    const roadmapGoalTitle = document.getElementById('roadmap-goal-title');
    const nextStepTitle = document.getElementById('next-step-title');
    const nextStepDescription = document.getElementById('next-step-desc');
    const plan = plans[profile.goal] || plans[defaultProfile.goal];
    if (sidebarName) sidebarName.textContent = profile.name;
    if (sidebarAvatar) sidebarAvatar.textContent = profile.name.charAt(0).toUpperCase();
    if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${profile.name}!`;
    if (goalLabel) goalLabel.textContent = profile.goal;
    if (headerName) headerName.textContent = profile.name;
    if (recommendationGoal) recommendationGoal.textContent = profile.goal;
    if (roadmapGoalTitle) roadmapGoalTitle.textContent = profile.goal;
    if (nextStepTitle) nextStepTitle.textContent = plan.project;
    if (nextStepDescription) nextStepDescription.textContent = plan.action;

    updateRoadmap(roadmap, profile.goal);
    updateProgress(progress, roadmap, profile);
    if (Array.isArray(recommendations)) recommendations.splice(0, recommendations.length, ...getRecommendations(profile.goal));
  }

  function hydrate(state, roadmap, progress, recommendations) {
    apply(readProfile(), state, roadmap, progress, recommendations);
    bindProfileInputs();
  }

  function bindProfileInputs() {
    const sync = () => {
      if (typeof window.syncMember1Data === 'function') window.syncMember1Data();
    };
    document.getElementById('m1-name')?.addEventListener('input', sync);
    document.getElementById('m1-edu')?.addEventListener('change', sync);
    document.getElementById('m1-goal')?.addEventListener('change', sync);
  }

  function saveFromInputs(state, roadmap, progress, recommendations) {
    const nameInput = document.getElementById('m1-name');
    const educationInput = document.getElementById('m1-edu');
    const goalInput = document.getElementById('m1-goal');
    const profile = {
      name: nameInput?.value.trim() || state.name || defaultProfile.name,
      education: educationOptions.some(option => option.value === educationInput?.value) ? educationInput.value : defaultProfile.education,
      goal: goalOptions.includes(goalInput?.value) ? goalInput.value : defaultProfile.goal
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
    } catch {
      // Keep the current page usable if browser storage is unavailable.
    }
    apply(profile, state, roadmap, progress, recommendations);
    const saveStatus = document.getElementById('profile-save-status');
    if (saveStatus) {
      saveStatus.textContent = 'Profile saved across pages.';
      window.clearTimeout(saveStatusTimer);
      saveStatusTimer = window.setTimeout(() => {
        saveStatus.textContent = '';
      }, 2500);
    }
  }

  window.StudentProfile = { hydrate, saveFromInputs, getCompletedStageIndex, getProgressPercentage: education => progressPercentages[education] || 42 };
})();