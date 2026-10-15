SamvedSession.then(async profile => {
  if (!profile) return;
  const el=id=>document.getElementById(id);
  function bar(container,label,percent) {
    const row=document.createElement('div'); row.className='chart-row';
    const caption=document.createElement('p'); caption.textContent=label; row.appendChild(caption);
    const track=document.createElement('div'); track.className='bar'; track.setAttribute('role','meter');
    track.setAttribute('aria-label',label); track.setAttribute('aria-valuenow',percent); track.setAttribute('aria-valuemin','0'); track.setAttribute('aria-valuemax','100');
    const fill=document.createElement('span'); fill.style.width=`${percent}%`; track.appendChild(fill); row.appendChild(track); container.appendChild(row);
  }
  try {
    const [progress,tasks]=await Promise.all([SamvedApi.request('GET','/api/v1/progress/me'),SamvedApi.request('GET','/api/v1/tasks')]);
    el('completion').textContent=`${progress.percent}%`; el('completion-bar').style.width=`${progress.percent}%`;
    el('task-count').textContent=`${tasks.filter(t=>t.status==='COMPLETED').length} of ${tasks.length} tasks completed.`;
    const levels={BEGINNER:33,INTERMEDIATE:66,ADVANCED:100};
    profile.skills.forEach(skill=>bar(el('skill-chart'),`${skill.name} — ${skill.proficiency}`,levels[skill.proficiency]));
    if(!profile.skills.length) el('skill-chart').textContent='Add skills in My Profile to see them here.';
    profile.academics.forEach(record=>bar(el('academic-chart'),`${record.course}, ${record.periodType} ${record.period}: ${record.score}${record.scoreType==='CGPA_10'?' / 10':'%'}`,record.scoreType==='CGPA_10'?record.score*10:record.score));
    if(!profile.academics.length) el('academic-chart').textContent='Add academic records in My Profile to see them here.';
    el('analytics-status').textContent='Showing your saved account data.';
  } catch(error) { el('analytics-status').textContent=error.message; }
});
