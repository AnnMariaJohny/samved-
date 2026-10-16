/* Architecture documentation opens separately so unfinished forms remain intact. */
(() => {
  if(document.getElementById('bv-entry')||location.pathname.startsWith('/backend-visualization/'))return;
  const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/backend-visualization/entry.css';document.head.append(sheet);
  const map={login:'auth',register:'auth',profile:'profile','academic-details':'profile',interests:'profile',skills:'profile',strengths:'profile',values:'profile','career-goal':'profile',assessment:'assessment','form assessment':'assessment','profile completion':'onboarding',onboarding:'onboarding',preparation:'actionplan',dashboard:'client','career roadmap':'roadmaps','daily tasks':'tasks',planner:'planner','deadline system':'planner','progress tracker':'progress',charts:'progress','oppertunity page':'opportunities',activities:'opportunities','recommondation page':'careers',journal:'client'};
  const bar=document.createElement('div');bar.id='bv-entry';bar.className='bv-entry-bar';
  const a=document.createElement('a');a.className='bv-entry-button';a.href='/backend-visualization/index.html#feature='+(map[document.body.dataset.page]||'client');a.target='_blank';a.rel='noopener';a.title='Backend Visualizer — explore this feature’s data flow and code';a.setAttribute('aria-label','BV — Open backend visualization in a new tab');
  const dot=document.createElement('span');dot.className='bv-entry-dot';dot.setAttribute('aria-hidden','true');a.append(dot,document.createTextNode('BV'));
  const label=document.createElement('span');label.className='bv-entry-label';label.textContent='Backend view';bar.append(label,a);document.body.prepend(bar);
})();
