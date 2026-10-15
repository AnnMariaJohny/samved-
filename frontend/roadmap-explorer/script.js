/* Public catalogue discovery; the Parse key remains in the Java server. */
(() => {
  const results = document.getElementById('results');
  const status = document.getElementById('status');
  const query = document.getElementById('query');
  const customPlan = document.getElementById('custom-plan');

  function showCustomPlan(plan) {
    customPlan.replaceChildren();
    if (plan.source !== 'AI_GENERATED') return;
    const card = document.createElement('article');
    const title = document.createElement('h2'); title.textContent = `AI starter roadmap: ${plan.jobTitle}`;
    const note = document.createElement('p');
    note.textContent = 'SAMVED generated this plan because roadmap.sh has no exact path for this title. Review it before acting on qualification requirements.';
    const summary = document.createElement('p'); summary.textContent = plan.summary;
    const list = document.createElement('ol');
    for (const milestone of plan.milestones || []) {
      const item = document.createElement('li');
      const heading = document.createElement('strong'); heading.textContent = milestone.title;
      const details = document.createElement('p'); details.textContent = milestone.description;
      item.append(heading, details); list.append(item);
    }
    card.append(title, note, summary, list);
    customPlan.append(card);
  }

  function show(items, label) {
    results.replaceChildren();
    status.textContent = items.length ? `${items.length} ${label} found.` : 'No matching roadmaps found. Try another topic.';
    for (const entry of items) {
      const roadmap = entry.roadmap || entry;
      const card = document.createElement('article');
      const title = document.createElement('h2'); title.textContent = roadmap.title;
      const description = document.createElement('p'); description.textContent = roadmap.description || 'Explore this learning path.';
      const link = document.createElement('a');
      link.href = window.SamvedRoadmapViewer.localLink(roadmap.url) || '#';
      link.textContent = 'View roadmap inside SAMVED';
      card.append(title, description, link);
      results.append(card);
    }
  }

  async function load(path, label) {
    status.textContent = 'Loading roadmap.sh catalogue…';
    results.replaceChildren();
    customPlan.replaceChildren();
    try { const items = await window.SamvedApi.request('GET', path); show(items, label); return true; }
    catch (error) { status.textContent = error.message || 'Roadmaps are temporarily unavailable.'; return false; }
  }

  document.getElementById('discovery-form').addEventListener('submit', async event => {
    event.preventDefault();
    const term = query.value.trim();
    if (!term) return;
    const found = await load(`/api/v1/roadmaps/discover?query=${encodeURIComponent(term)}`, 'suggested roadmaps');
    if (!found) return;
    if (term.length > 80) {
      status.textContent += ' Use a job title of 80 characters or fewer for a custom plan.';
      return;
    }
    try {
      const plan = await window.SamvedApi.request('GET',
        `/api/v1/roadmaps/for-role?jobTitle=${encodeURIComponent(term)}`);
      showCustomPlan(plan);
    } catch (error) {
      status.textContent += ` Custom plan unavailable: ${error.message}`;
    }
  });
  document.getElementById('browse-all').addEventListener('click', () =>
    load('/api/v1/roadmaps/catalogue', 'roadmaps'));
})();
