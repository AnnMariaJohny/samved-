/* Career guidance is computed by the Java API. The browser only displays its reasons. */
const recommendationStatus = document.getElementById('recommendation-status');
const recommendationGrid = document.getElementById('recommendations-grid');

function appendText(parent, tag, value, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value == null ? '' : String(value);
  parent.appendChild(element);
  return element;
}

function renderRecommendations(response) {
  recommendationGrid.replaceChildren();
  const source = response.source === 'AI' ? 'AI ordered' : response.source === 'RULES_FALLBACK'
    ? 'Rule fallback' : 'Rule ordered';
  recommendationStatus.textContent = `${source} guidance. ${response.guidance || 'Review the suggestions below.'}`;
  const recommendations = Array.isArray(response.recommendations) ? response.recommendations : [];
  if (recommendations.length === 0) {
    appendText(recommendationGrid, 'p', 'No career matches yet. Add interests and skills in your profile, then return here.');
    return;
  }

  for (const recommendation of recommendations) {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    const header = appendText(card, 'div', '', 'recommendation-header');
    appendText(header, 'h3', recommendation.careerTitle || recommendation.careerId);
    appendText(header, 'span', `${recommendation.score ?? 0}/100 rule overlap`, 'match-score-badge');

    const reasons = document.createElement('div');
    reasons.className = 'reasoning-box';
    appendText(reasons, 'strong', 'Why this appears:');
    const reasonList = document.createElement('ul');
    for (const reason of recommendation.reasons || []) appendText(reasonList, 'li', reason);
    reasons.appendChild(reasonList);
    card.appendChild(reasons);

    const skills = document.createElement('div');
    appendText(skills, 'strong', 'Skills you already listed: ');
    appendText(skills, 'span', (recommendation.matchedSkills || []).join(', ') || 'None yet');
    card.appendChild(skills);
    const gaps = document.createElement('div');
    appendText(gaps, 'strong', 'Skills to explore: ');
    appendText(gaps, 'span', (recommendation.skillGaps || []).join(', ') || 'No starter gaps identified');
    card.appendChild(gaps);
    appendText(card, 'small', `Rule version: ${recommendation.ruleVersion || response.ruleVersion || 'unknown'}`);
    recommendationGrid.appendChild(card);
  }
}

async function loadRecommendations() {
  try {
    const response = await window.SamvedApi.request('GET', '/api/v1/recommendations/me');
    renderRecommendations(response);
  } catch (error) {
    recommendationStatus.textContent = `Could not load recommendations: ${error.message || 'Please sign in and try again.'}`;
    recommendationGrid.replaceChildren();
  }
}

loadRecommendations();
