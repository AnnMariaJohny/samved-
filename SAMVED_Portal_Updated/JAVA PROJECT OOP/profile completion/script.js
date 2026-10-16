(() => {
  const studentState = { name: 'Anugrah', education: "Bachelor's", goal: 'Scientist' };
  window.syncMember1Data = () => window.StudentProfile?.saveFromInputs(studentState, [], null, null);
  window.StudentProfile?.hydrate(studentState, [], null, null);

  const key = 'samved.planner.profile-sections.v1';
  const names = ['Academic Details', 'Interests', 'Skills', 'Strengths', 'Values', 'Career Goal', 'Assessment', 'Profile'];
  let completed = [];
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(stored)) completed = [...new Set(stored.filter(name => names.includes(name)))];
  } catch { /* Keep the checklist usable if storage is unavailable. */ }

  const cards = [...document.querySelectorAll('.profile-section-card')];
  const progress = document.getElementById('profile-progress');
  const fill = document.getElementById('profile-progress-fill');
  const count = document.getElementById('profile-count');
  const percent = document.getElementById('profile-percent');

  function render() {
    const value = Math.round(completed.length / names.length * 100);
    cards.forEach(card => {
      const done = completed.includes(card.dataset.section);
      card.classList.toggle('is-complete', done);
      const button = card.querySelector('.profile-toggle');
      button.textContent = done ? 'Completed ✓' : 'Mark complete';
      button.setAttribute('aria-pressed', String(done));
    });
    count.textContent = `${completed.length} of ${names.length} complete`;
    percent.textContent = `${value}%`;
    progress.setAttribute('aria-valuenow', String(value));
    fill.style.width = `${value}%`;
  }

  cards.forEach(card => card.querySelector('.profile-toggle').addEventListener('click', () => {
    const name = card.dataset.section;
    completed = completed.includes(name) ? completed.filter(item => item !== name) : [...completed, name];
    try { localStorage.setItem(key, JSON.stringify(completed)); } catch { /* UI remains interactive. */ }
    render();
  }));

  render();
})();
