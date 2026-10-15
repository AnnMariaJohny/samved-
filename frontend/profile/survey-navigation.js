SamvedSession.then(profile=>{
  if(!profile)return;
  const page=location.pathname.split('/').pop().replace('.html','');
  const key={academic:'academics',careergoal:'career'}[page]||page;
  const host=document.querySelector('main')||document.body;
  const box=document.createElement('section');box.className='survey-navigation';
  if(page==='profile'&&host.querySelector('.portal-content'))host.querySelector('.portal-content').prepend(box);else host.prepend(box);
  const title=document.createElement('h3');title.textContent='Complete your career profile';box.appendChild(title);
  const note=document.createElement('p');note.textContent='Complete every profile section and all career assessment questions before using SAMVED. Add at least one entry to each section and save your answers. Your progress is saved so you can return later.';box.appendChild(note);
  const progress=document.createElement('p');box.appendChild(progress);
  const reviewed=document.createElement('button');reviewed.type='button';reviewed.hidden=true;box.appendChild(reviewed);
  const next=document.createElement('a');next.className='survey-next';box.appendChild(next);
  const dashboard=document.createElement('a');dashboard.href='/dashboard/index.html';dashboard.textContent='My roadmap recommendations';box.appendChild(dashboard);
  const status=document.createElement('p');status.setAttribute('role','status');box.appendChild(status);
  let generation=0;
  async function refresh(){const current=++generation;try{
    const checklist=await SamvedApi.request('GET','/api/v1/students/me/onboarding');if(current!==generation)return;
    title.textContent=checklist.ready?'Your career profile is complete':'Complete your career profile';
    progress.textContent=`${checklist.completed} of ${checklist.total} sections complete${checklist.ready?' — your roadmap recommendations are ready.':'.'}`;
    const step=checklist.sections.find(s=>s.key===key);reviewed.hidden=!step||step.complete||key!=='career';
    dashboard.hidden=!checklist.ready;
    reviewed.textContent='I am still exploring — save this career direction';
    const pending=checklist.sections.find(s=>!s.complete);
    next.hidden=!!step&&!step.complete;
    status.textContent=step&&!step.complete?'Save this section above to continue. All features unlock after all eight sections are complete.':'';
    next.textContent=pending?`Continue: ${pending.title}`:'See recommended roadmaps';next.href=pending?pending.href:'/dashboard/index.html';
    const el=id=>document.getElementById(id),pct=Math.round(checklist.completed/checklist.total*100);
    if(el('progressText'))el('progressText').textContent=progress.textContent;
    if(el('completionFill'))el('completionFill').style.width=`${pct}%`;
    if(el('completionPercentage'))el('completionPercentage').textContent=`${pct}%`;
    for(const section of checklist.sections){const id=({academics:'academic'}[section.key]||section.key)+'Status';if(el(id))el(id).textContent=section.complete?'Completed':section.detail;}
  }catch(error){status.textContent=`Could not check your survey progress: ${error.message}`;}}
  reviewed.onclick=async()=>{reviewed.disabled=true;status.textContent='Saving your review…';try{
    await SamvedApi.request('PUT',`/api/v1/students/me/review/${encodeURIComponent(key)}`);status.textContent='Section reviewed. Continue to the next section.';await refresh();
  }catch(error){status.textContent=error.message;}finally{reviewed.disabled=false;}};
  window.addEventListener('samved-profile-saved',refresh);refresh();
});
