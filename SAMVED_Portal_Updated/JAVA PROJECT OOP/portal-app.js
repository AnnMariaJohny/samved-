/* Live Java/MySQL integration for the HTML pages in SAMVED_Portal_Updated. */
(() => {
  const api = window.SamvedApi;
  const onboarding = window.SamvedOnboarding;
  const request = (method, path, body) => api.request(method, '/api/v1/' + path, body);
  const el = id => document.getElementById(id);
  const page = document.body.dataset.page;
  const aliases = {
    '/auth/login.html':'/login.html', '/auth/register.html':'/register.html',
    '/profile/profile.html':'/profile/index.html', '/profile/academic.html':'/academic-details/index.html',
    '/profile/careergoal.html':'/career-goal/index.html', '/assessment/assessment.html':'/form%20assessment/index.html',
    ...Object.fromEntries(['interests','skills','strengths','values'].map(s => ['/profile/'+s+'.html','/'+s+'/index.html']))
  };
  const canonical = path => aliases[path] || path;
  const setup = new Set(['onboarding','profile','profile completion','academic-details','interests','skills','strengths','values','career-goal','assessment','form assessment']);
  let account, checklist;
  function node(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined && text !== null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function status(message, error=false) {
    const n=el('portal-status'); if(n) {n.textContent=message;n.classList.toggle('portal-error',error);}
  }
  async function action(work, button, success='Saved to your account.') {
    if(button) button.disabled=true;
    status('Saving…');
    try { const result=await work(); status(result===false?'':success); }
    catch(error) { status(error.message,true); }
    finally { if(button) button.disabled=false; }
  }
  function btn(parent, label, handler, primary=false) {
    const b=node('button',label,'portal-btn '+(primary?'portal-btn-primary':'portal-btn-secondary'));
    b.type='button'; b.addEventListener('click',()=>{
      try { const result=handler(b); if(result && typeof result.then==='function') action(()=>result,b); }
      catch(error) { status(error.message,true); }
    });parent.append(b);return b;
  }
  function link(parent,label,href,cls='portal-info-card-link') {
    const a=node('a',label,cls);a.href=canonical(href);parent.append(a);return a;
  }
  function block(parent,title) {
    const n=node('section',null,'portal-form-section');if(title)n.append(node('h2',title,'portal-form-section-title'));parent.append(n);return n;
  }
  function field(parent,label,name,type='text',options) {
    const wrap=node('div',null,'portal-form-group');const caption=node('label',label,'portal-form-label');caption.htmlFor=name;
    const input=node(options?'select':'input',null,options?'portal-select':'portal-input');input.id=name;input.name=name;
    if(options) for(const [value,text] of options) {const o=node('option',text);o.value=value;input.append(o);}
    else input.type=type;
    wrap.append(caption,input);parent.append(wrap);return input;
  }
  function form(parent,label,handler,success='Saved to your account.') {
    const f=node('form',null,'portal-live-form');parent.append(f);
    const submit=node('button',label,'portal-btn portal-btn-primary');submit.type='submit';
    f.addEventListener('submit',event=>{event.preventDefault();try {const result=handler(f);if(result && typeof result.then==='function')action(()=>result,submit,success);}catch(error){status(error.message,true);}});
    return {f,submit};
  }
  const education=[['school','School'],['higher-secondary','Higher secondary'],['undergraduate','Undergraduate'],['postgraduate','Postgraduate'],['other','Other']];
  const values=f=>Object.fromEntries(new FormData(f));
  function empty(parent,text) {parent.append(node('p',text,'portal-info-card-text'));}
  async function refreshAccount() {account=await request('GET','students/me');checklist=await request('GET','students/me/onboarding');}
  async function details(changes) {
    const fresh=await request('GET','students/me');
    account=await request('PUT','students/me',{name:fresh.name,educationLevel:fresh.educationLevel,cityRegion:fresh.cityRegion,careerGoal:fresh.careerGoal,...changes});
  }
  function drawChecklist(parent) {
    const section=block(parent,'Profile Completion Checklist');
    empty(section,`${checklist.completed} of ${checklist.total} sections complete.`);
    const grid=node('div',null,'portal-live-grid');section.append(grid);
    for(const item of checklist.sections) {
      const card=link(grid,'',item.href,'portal-assess-item');
      card.append(node('span',item.complete?'✓':'○'),node('strong',item.title),node('span',item.complete?'Saved':'Continue','portal-pill-tag '+(item.complete?'teal':'purple')));
    }
    if(checklist.ready) link(section,'Go to dashboard →','/dashboard/index.html','portal-btn portal-btn-primary');
  }
  async function auth() {
    onboarding.installDemoEntry();
    const f=el('auth-form');
    f.addEventListener('submit',event=>{
      event.preventDefault(); const submit=f.querySelector('button[type=submit]');
      action(async()=>{
        const input=values(f);
        if(page==='register') {
          if(input.password!==input.confirmPassword) throw new Error('Passwords do not match.');
          await request('POST','auth/register',{name:input.name.trim(),email:input.email.trim(),password:input.password,cityRegion:input.cityRegion.trim(),educationLevel:input.education,adultConfirmed:el('adultConfirmed').checked,privacyAccepted:el('privacyAccepted').checked});
        }
        await request('POST','auth/login',{email:input.email.trim(),password:input.password});api.clearCsrf();
        const state=await request('GET','students/me/onboarding');
        location.assign(state.ready?'/onboarding/prepare.html':'/onboarding/index.html');
      },submit);
    });
  }
  function profile(parent) {
    const badge=block(parent);
    badge.classList.add('portal-student-badge');
    badge.append(node('span',account.name.charAt(0).toUpperCase(),'portal-live-avatar'),node('h2',account.name),node('p',account.email,'portal-info-card-text'));
    const {f,submit}=form(block(parent,'Personal details'),onboarding.active()?'Save & Continue →':'Save profile',async form=>{
      const data=values(form);await details({name:data.name.trim(),educationLevel:data.educationLevel,cityRegion:data.cityRegion.trim()});await refreshAccount();await onboarding.saved('profile',true);
    });
    const grid=node('div',null,'portal-form-grid');f.append(grid);
    field(grid,'Full name','name').value=account.name;el('name').required=true;el('name').maxLength=100;
    field(grid,'Education level','educationLevel','text',education).value=account.educationLevel;
    field(grid,'City / region','cityRegion').value=account.cityRegion;el('cityRegion').maxLength=100;
    f.append(submit);if(onboarding.active())return;drawChecklist(parent);
    const {f:pw,submit:save}=form(block(parent,'Change password'),'Change password',async form=>{
      const data=values(form);await request('PUT','auth/password',data);api.clearCsrf();form.reset();
    });
    for(const [id,label] of [['currentPassword','Current password'],['newPassword','New password']]) {const i=field(pw,label,id,'password');i.required=true;i.minLength=8;i.maxLength=72;i.autocomplete=id==='currentPassword'?'current-password':'new-password';}
    pw.append(save);
    btn(block(parent,'Account settings'),'Delete my account and saved data',async()=>{
      if(!confirm('Permanently delete your SAMVED account and all saved data?')) return false;
      await request('DELETE','students/me');api.clearCsrf();location.assign('/login.html');
    });
  }
  function academics(parent) {
    const section=block(parent,'Current Education');
    const {f,submit}=form(section,'Save Academic Record',async form=>{
      const data=values(form);
      const subjects=Array.from(f.querySelectorAll('.portal-subject-row'),row=>({name:row.querySelector('[name=subject]').value.trim(),marks:Number(row.querySelector('[name=marks]').value)}));
      const record={educationLevel:data.educationLevel,institution:data.institution.trim(),course:data.course.trim(),periodType:data.periodType,period:Number(data.period),scoreType:data.scoreType,score:Number(data.score),subjects};
      await request('PUT','students/me/academics',[...account.academics,record]);await refreshAccount();form.reset();rows.replaceChildren();addSubject();draw();await onboarding.saved('academics');
    });
    const grid=node('div',null,'portal-form-grid');f.append(grid);
    field(grid,'Education level','educationLevel','text',education).value=account.educationLevel;
    for(const [id,label] of [['institution','School / college'],['course','Course / grade']]) {const i=field(grid,label,id);i.required=true;i.maxLength=160;}
    field(grid,'Academic period','periodType','text',[['CLASS','Class'],['SEMESTER','Semester']]);
    const period=field(grid,'Class / semester number','period','number');period.required=true;period.min=1;period.max=20;
    field(grid,'Score scale','scoreType','text',[['PERCENTAGE','Percentage (0–100)'],['CGPA_10','CGPA (0–10)']]);
    const score=field(grid,'Overall score','score','number');score.required=true;score.min=0;score.max=100;score.step='.01';
    el('scoreType').addEventListener('change',()=>{score.max=el('scoreType').value==='CGPA_10'?10:100;});
    const subjects=block(f,'Subjects'), rows=node('div');subjects.append(rows);
    function addSubject() {
      const row=node('div',null,'portal-subject-row');rows.append(row);
      const name=field(row,'Subject','subject');name.required=true;name.maxLength=100;
      const marks=field(row,'Marks (%)','marks','number');marks.required=true;marks.min=0;marks.max=100;marks.step='.01';
      btn(row,'Remove',()=>row.remove());
    }
    btn(subjects,'+ Add Subject',addSubject);addSubject();f.append(submit);
    const list=block(parent,'Academic Records');
    function draw() {list.querySelectorAll('article,p').forEach(n=>n.remove());if(!account.academics.length)empty(list,'No academic records saved yet.');
      account.academics.forEach((r,index)=>{const card=node('article',null,'portal-assess-item portal-live-record');list.append(card);card.append(node('h3',r.institution),node('p',`${r.course} · ${r.periodType} ${r.period} · ${r.score}${r.scoreType==='CGPA_10'?' / 10':'%'}`));for(const s of r.subjects)card.append(node('p',`${s.name}: ${s.marks}%`));btn(card,'Delete record',async()=>{await request('PUT','students/me/academics',account.academics.filter((_,i)=>i!==index));await refreshAccount();draw();await onboarding.saved('academics');});});
    }draw();if(!onboarding.active())link(parent,'Review career direction →','/career-goal/index.html','portal-btn portal-btn-primary');
  }
  function selections(parent,section) {
    const choices=JSON.parse(el('portal-options')?.textContent||'[]');
    const selected=new Set(account[section]);
    const grid=node('div',null,section==='interests'?'portal-chip-group':'portal-live-grid');parent.append(grid);
    function choice(item) {
      const b=node('button',null,section==='interests'?'portal-chip':'portal-act-card portal-choice');b.type='button';
      if(section==='interests')b.textContent=item.name;
      else b.append(node('h3',item.name,'portal-act-title'),node('p',item.description,'portal-act-desc'));
      const update=()=>{b.classList.toggle('selected',selected.has(item.name));b.setAttribute('aria-pressed',String(selected.has(item.name)));};
      b.addEventListener('click',()=>{selected.has(item.name)?selected.delete(item.name):selected.add(item.name);update();});update();grid.append(b);
    }
    for(const item of choices)choice(item);
    for(const name of selected)if(!choices.some(i=>i.name===name))choice({name,description:'Saved in your profile'});
    const {f,submit}=form(block(parent,'Add your own'),'Add',form=>{const input=form.querySelector('input');const name=input.value.trim();if(name){if(![...grid.children].some(n=>n.textContent===name))choice({name,description:''});selected.add(name);for(const n of grid.children)if(n.textContent===name){n.classList.add('selected');n.setAttribute('aria-pressed','true');}input.value='';}});
    const custom=field(f,'Custom '+section.replace(/s$/,''),'custom');custom.maxLength=80;custom.required=true;f.append(submit);
    const actions=block(parent);
    btn(actions,onboarding.active()?'Save & Continue →':'Save '+section,async()=>{if(onboarding.active()&&!selected.size)throw new Error('Choose at least one '+section.replace(/s$/,'')+' before continuing.');account[section]=await request('PUT','students/me/'+section,[...selected]);await onboarding.saved(section,true);},true);
    const next={interests:'skills',strengths:'values',values:'form%20assessment'}[section];if(next&&!onboarding.active())link(actions,'Continue →','/'+next+'/index.html','portal-btn portal-btn-secondary');
  }
  function skills(parent) {
    const {f,submit}=form(block(parent,'Your Skills'),'Add Skill',async form=>{const d=values(form);await request('PUT','students/me/skills',[...account.skills,{name:d.skill.trim(),proficiency:d.proficiency}]);await refreshAccount();form.reset();draw();await onboarding.saved('skills');});
    field(f,'Skill name','skill').required=true;el('skill').maxLength=80;
    field(f,'Current level','proficiency','text',[['BEGINNER','Beginner'],['INTERMEDIATE','Intermediate'],['ADVANCED','Advanced']]);f.append(submit);
    const list=block(parent,'Saved skills');
    function draw(){list.querySelectorAll('article,p').forEach(n=>n.remove());if(!account.skills.length)empty(list,'No skills saved yet.');account.skills.forEach((s,index)=>{const row=node('article',null,'portal-assess-item');row.append(node('strong',s.name),node('span',s.proficiency,'portal-pill-tag purple'));btn(row,'Delete',async()=>{await request('PUT','students/me/skills',account.skills.filter((_,i)=>i!==index));await refreshAccount();draw();await onboarding.saved('skills');});list.append(row);});}draw();
    if(!onboarding.active())link(parent,'Continue to Strengths →','/strengths/index.html','portal-btn portal-btn-primary');
  }
  function careerGoal(parent) {
    const {f,submit}=form(parent,onboarding.active()?'Save & Continue →':'Save Career Goal',async form=>{const d=values(form);await details({careerGoal:d.direction==='EXPLORING'?{type:'EXPLORING',text:null}:{type:'CUSTOM',text:d.goal.trim()}});await request('PUT','students/me/review/career');await onboarding.saved('career',true);});
    field(f,'Your direction','direction','text',[['EXPLORING','I am still exploring'],['CUSTOM','I have a goal']]).value=account.careerGoal.type==='EXPLORING'?'EXPLORING':'CUSTOM';
    const goal=field(f,'Career or field to explore','goal');goal.maxLength=160;goal.value=account.careerGoal.text||'';
    function toggle(){goal.required=el('direction').value==='CUSTOM';goal.disabled=!goal.required;}el('direction').addEventListener('change',toggle);toggle();f.append(submit);
    if(!onboarding.active())link(parent,'Continue to Assessment →','/form%20assessment/index.html','portal-btn portal-btn-secondary');
  }
  async function assessment(parent) {
    const current=await request('GET','assessments/current');
    const {f,submit}=form(parent,onboarding.active()?'Finish & prepare my dashboard →':'Save Assessment',async form=>{
      const data=values(form);await request('PUT','assessments/current/responses',{questionVersion:current.questionVersion,answers:current.questions.map(q=>({questionId:q.id,optionId:data[q.id]}))});
      const result=await request('GET','assessments/current/result');resultBox.textContent=result.explanation||'Assessment saved. Explore your career guidance.';await refreshAccount();
      if(onboarding.active())await onboarding.saved('assessment',true);else link(resultBox,'Go to dashboard →','/dashboard/index.html','portal-btn portal-btn-primary');
    });
    const answers=Object.fromEntries((current.answers||[]).map(a=>[a.questionId,a.optionId]));
    current.questions.forEach((q,index)=>{const set=node('fieldset',null,'portal-question');set.append(node('legend',`${index+1}. ${q.text}`));for(const option of q.options){const label=node('label',null,'portal-answer');const radio=node('input');radio.type='radio';radio.name=q.id;radio.value=option.id;radio.required=true;radio.checked=answers[q.id]===option.id;label.append(radio,node('span',option.label));set.append(label);}f.append(set);});f.append(submit);
    const resultBox=node('div',null,'portal-form-section');resultBox.setAttribute('role','status');parent.append(resultBox);
  }
  async function reminders(parent) {
    const list=await request('GET','notifications');if(!list.length){empty(parent,'No due-date reminders yet. Add a due date to a task.');return;}
    for(const n of list){const row=node('div',null,'portal-assess-item');row.append(node('p',n.message));if(!n.readAt)btn(row,'Mark read',async b=>{await request('PATCH','notifications/'+n.id+'/read');b.remove();});parent.append(row);}
  }
  async function ensurePlan(parent) {
    const loading=node('p','Preparing your personalised daily plan…','portal-plan-loading');loading.setAttribute('role','status');parent.append(loading);
    try{return await request('POST','action-plan/ensure');}
    catch(error){const notice=block(parent,'Your daily plan needs a retry');empty(notice,error.message);btn(notice,'Prepare my plan',async()=>{parent.replaceChildren();if(page==='dashboard')await dashboard(parent);else if(['charts','progress tracker'].includes(page))await progress(parent);else await tasks(parent,page!=='daily tasks');},true);return null;}
    finally{loading.remove();}
  }
  function planSummary(parent,plan) {
    const section=block(parent);section.classList.add('portal-plan-summary');
    section.append(node('span',plan.source==='AI'?'AI-PERSONALISED PLAN':'GUIDED STARTER PLAN · AI UNAVAILABLE','portal-live-eyebrow'),node('h2','Your week toward '+plan.goal,'portal-form-section-title'),node('p',plan.summary,'portal-info-card-text'),node('p','One manageable activity each day · Scheduled through '+plan.throughDate+' · Dates use India time','portal-info-card-text'));
  }
  function progressChart(parent,data,tasks,today) {
    const grid=node('div',null,'portal-progress-grid'),ring=node('div',null,'portal-progress-ring');
    const value=Math.min(100,Math.max(0,data.percent||0));ring.style.setProperty('--progress',value+'%');ring.setAttribute('role','img');ring.setAttribute('aria-label',value+' percent of tasks and milestones complete');ring.append(node('strong',value+'%'),node('span','Complete'));
    const detail=node('div');detail.append(node('h3','Small steps, visible progress'),node('p',`${data.completedTasks||0} of ${data.totalTasks||0} tasks complete · ${data.completedMilestones||0} of ${data.totalMilestones||0} milestones complete`,'portal-info-card-text'));
    const chart=node('div',null,'portal-week-chart');chart.setAttribute('role','img');chart.setAttribute('aria-label','Completed activities by scheduled date for this week');
    for(let i=0;i<7;i++){const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+i);const key=date.toISOString().slice(0,10),all=tasks.filter(t=>t.dueDate===key),done=all.filter(t=>t.status==='COMPLETED').length;const col=node('div',null,'portal-week-column'),bar=node('div',null,'portal-week-bar'),fill=node('span');fill.style.height=(all.length?done/all.length*100:0)+'%';bar.append(fill);col.title=key+': '+done+' / '+all.length+' activities complete';col.append(node('span',done+'/'+all.length),bar,node('small',date.toLocaleDateString(undefined,{weekday:'short',timeZone:'UTC'})));chart.append(col);}
    detail.append(chart);grid.append(ring,detail);parent.append(grid);link(parent,'Open full progress & charts →','/charts/index.html','portal-info-card-link');
  }
  async function tasks(parent,dated=false) {
    const plan=await ensurePlan(parent);if(plan)planSummary(parent,plan);
    const {f,submit}=form(block(parent,dated?'Plan a task':'Add a task'),'Save Task',async form=>{const d=values(form);const payload={title:d.title.trim(),description:d.description.trim()||null,dueDate:d.dueDate||null};await request(editId?'PUT':'POST',editId?'tasks/'+editId:'tasks',payload);editId=null;form.reset();await draw();});
    let editId=null;
    const title=field(f,'Task title','title');title.required=true;title.maxLength=160;
    const description=field(f,'Description (optional)','description');description.maxLength=1000;
    field(f,'Due date (optional)','dueDate','date');f.append(submit);btn(f,'Cancel',()=>{editId=null;f.reset();});
    const list=block(parent,dated?'Scheduled tasks':'My tasks');
    parent.insertBefore(list,f.parentElement);
    async function draw(){const items=await request('GET','tasks');list.querySelectorAll('article,p').forEach(n=>n.remove());const visible=(dated?items.filter(t=>t.dueDate):items).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));if(!visible.length)empty(list,'No tasks saved here yet.');for(const t of visible){const row=node('article',null,'portal-assess-item portal-live-record');row.append(node('h3',t.title),node('p',t.description||''),node('p',`${t.status}${t.dueDate?' · Due '+t.dueDate:''}${t.automaticallyAssigned?' · Assigned from your onboarding':''}`));const actions=node('div',null,'portal-live-actions');row.append(actions);btn(actions,t.status==='COMPLETED'?'Reopen':'Complete',async()=>{await request('PATCH','tasks/'+t.id+'/status',{status:t.status==='COMPLETED'?'PENDING':'COMPLETED'});await draw();});btn(actions,'Edit',()=>{editId=t.id;title.value=t.title;description.value=t.description||'';el('dueDate').value=t.dueDate||'';f.scrollIntoView({behavior:'smooth'});});btn(actions,'Delete',async()=>{await request('DELETE','tasks/'+t.id);await draw();});list.append(row);}}await draw();
    if(dated)await reminders(block(parent,'Reminders'));
  }
  async function dashboard(parent) {
    const hero=block(parent);hero.classList.add('portal-live-hero');hero.append(node('span','STUDENT DASHBOARD','portal-live-eyebrow'),node('h1','Welcome back, '+account.name+'! ♡'),node('p','Your journey toward '+(account.careerGoal.text||'discovering your next step')+'.'));
    const plan=await ensurePlan(parent);if(plan)planSummary(parent,plan);
    const [p,list,notes]=await Promise.all([request('GET','progress/me'),request('GET','tasks'),request('GET','notifications')]);
    const stats=node('div',null,'portal-stats-row');parent.append(stats);
    for(const [label,value] of [['Journey progress',p.percent+'%'],['Tasks completed',p.completedTasks+' / '+p.totalTasks],['Open deadlines',list.filter(t=>t.dueDate&&t.status!=='COMPLETED').length],['Unread reminders',notes.filter(n=>!n.readAt).length]]){const c=node('div',null,'portal-stat-card');c.append(node('div',label,'portal-stat-label'),node('strong',value,'portal-stat-value'));stats.append(c);}
    const today=plan?.today||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const daily=block(parent,'Your next actions'),dailyList=node('div',null,'portal-match-list');daily.append(dailyList);
    const current=list.filter(t=>t.status!=='COMPLETED'&&t.dueDate&&t.dueDate<=today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,3);
    if(!current.length)empty(dailyList,'You’re up to date for today. Your next activity is scheduled in the planner.');
    for(const task of current){const card=node('article',null,'portal-act-card');card.append(node('span',task.dueDate<today?'CARRY FORWARD · '+task.dueDate:'TODAY · '+task.dueDate,'portal-live-eyebrow'),node('h3',task.title,'portal-act-title'),node('p',task.description||'','portal-act-desc'));btn(card,'Mark complete',async()=>{await request('PATCH','tasks/'+task.id+'/status',{status:'COMPLETED'});parent.replaceChildren();await dashboard(parent);},true);dailyList.append(card);}
    link(daily,'All daily tasks →','/daily%20tasks/index.html','portal-info-card-link');
    progressChart(block(parent,'Your progress'),p,list,today);
    const schedule=block(parent,'Your upcoming week'),rows=node('div',null,'portal-match-list');schedule.append(rows);
    const upcoming=list.filter(t=>t.dueDate&&t.dueDate>=today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,7);
    for(const task of upcoming){const row=node('article',null,'portal-schedule-row');row.append(node('time',task.dueDate),node('strong',task.title),node('span',task.status.replaceAll('_',' '),'portal-pill-tag purple'));rows.append(row);}
    if(!upcoming.length)empty(rows,'No upcoming tasks. Your plan will refresh automatically after the current week.');
    const links=node('div',null,'portal-live-actions');schedule.append(links);
    for(const [title,path] of [['Open planner','planner'],['View deadlines','deadline system'],['Progress & charts','charts']])link(links,title,'/'+encodeURIComponent(path)+'/index.html','portal-btn portal-btn-secondary');
    await onboarding.dashboard(parent);
  }
  async function roadmaps(parent) {
    const hub=block(parent);await SamvedRoadmapHub.mount(hub);
    const {f,submit}=form(block(parent,'Create a starter roadmap'),'Create roadmap',async form=>{const d=values(form);await request('POST','roadmaps',{templateCode:d.templateCode,goal:d.goal.trim()});await draw();});
    field(f,'Starter path','templateCode','text',['EXPLORING','SOFTWARE','DATA','RESEARCH','MEDICINE','TEACHING','DESIGN','ENTREPRENEURSHIP','CIVIL_ENGINEERING'].map(x=>[x,x.replaceAll('_',' ')]));field(f,'Your goal','goal').required=true;el('goal').maxLength=160;f.append(submit);
    const saved=block(parent,'My starter milestones');
    async function draw(){saved.querySelectorAll('article,p').forEach(n=>n.remove());const list=await request('GET','roadmaps/me');if(!list.length)empty(saved,'No starter roadmaps yet.');for(const r of list){const row=node('article',null,'portal-live-record');row.append(node('h3',r.goal));for(const m of r.milestones){const item=node('div',null,'portal-assess-item');item.append(node('span',m.title));btn(item,m.status==='COMPLETED'?'Reopen':'Complete',async()=>{await request('PATCH','milestones/'+m.id+'/status',{status:m.status==='COMPLETED'?'PENDING':'COMPLETED'});await draw();});row.append(item);}saved.append(row);}}await draw();
    const {f:discover,submit:find}=form(block(parent,'Explore a custom role'),'Find role roadmap',async form=>{const d=values(form);const result=await request('GET','roadmaps/for-role?jobTitle='+encodeURIComponent(d.jobTitle));resultBox.replaceChildren(node('h3',result.jobTitle),node('p',result.summary));for(const m of result.milestones||[])resultBox.append(node('h4',m.title),node('p',m.description));if(result.url)safeLink(resultBox,'Open source roadmap',result.url);},'Role preview loaded.');
    field(discover,'Role / career','jobTitle').required=true;discover.append(find);const resultBox=node('div');parent.append(resultBox);
  }
  function safeLink(parent,label,url) {if(typeof url==='string'&&/^https:\/\//i.test(url)){const a=link(parent,label,url);a.target='_blank';a.rel='noopener noreferrer';}}
  async function opportunities(parent) {
    const filter=field(parent,'Opportunity type','opportunityType','text',[['','All'],...['JOB','INTERNSHIP','HACKATHON','COMPETITION','QUIZ','WORKSHOP','EVENT','COURSE','SCHOLARSHIP'].map(t=>[t,t.charAt(0)+t.slice(1).toLowerCase()])]);
    const results=node('div',null,'portal-live-grid');parent.append(results);
    async function draw(){results.replaceChildren();const data=await request('GET','opportunities?size=50'+(filter.value?'&type='+filter.value:''));if(!data.content?.length)empty(results,'No verified listings available for this filter.');for(const item of data.content||[]){const card=node('article',null,'portal-act-card');card.append(node('h3',item.title,'portal-act-title'),node('p',item.organizer||'Organizer not listed'),node('p',item.deadline?'Deadline: '+item.deadline:'Deadline not listed'));if(item.matchedSignals?.length)card.append(node('p','Related to: '+item.matchedSignals.join(', ')));safeLink(card,'Open original listing →',item.applicationUrl||item.sourceUrl);results.append(card);}}
    filter.addEventListener('change',()=>action(draw,null,'Listings updated.'));await draw();
  }
  async function progress(parent) {
    await ensurePlan(parent);
    const data=await request('GET','progress/me');
    const assigned=await request('GET','tasks');progressChart(block(parent,'Completion overview'),data,assigned,new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date()));
    function meter(label,percent){const section=block(parent,label);const track=node('div',null,'portal-live-track');const fill=node('div');fill.style.width=Math.min(100,Math.max(0,percent))+'%';track.append(fill);section.append(track,node('p',Math.round(percent)+'%'));}
    meter('Journey completion',data.percent);empty(parent,`${data.completedTasks} of ${data.totalTasks} tasks completed · ${data.completedMilestones} of ${data.totalMilestones} milestones completed.`);
    for(const skill of account.skills)meter(skill.name+' · '+skill.proficiency,{BEGINNER:33,INTERMEDIATE:66,ADVANCED:100}[skill.proficiency]);
    for(const r of account.academics)meter(r.course+' · '+r.score+(r.scoreType==='CGPA_10'?' / 10':'%'),r.scoreType==='CGPA_10'?r.score*10:r.score);
  }
  async function recommendations(parent) {
    const data=await request('GET','recommendations/me');empty(parent,data.guidance||'Career guidance based on your profile.');
    empty(parent,'Match estimates describe alignment with your onboarding answers, not your chance of getting hired.');
    for(const r of data.recommendations||[]){const c=block(parent,r.careerTitle);c.append(node('p','Career match: '+(r.aiMatchPercent??r.score)+'% · '+(r.aiMatchPercent!=null?'AI estimate':'profile-based estimate'),'portal-match-percent'));empty(c,r.aiExplanation||(r.reasons||[]).join(' · '));empty(c,'Skills to explore: '+(r.skillGaps||[]).join(', '));}
    link(parent,'Explore roadmaps →','/career%20roadmap/index.html','portal-btn portal-btn-primary');
  }
  async function navigation() {
    document.querySelectorAll('.portal-sidebar-btn.login').forEach(n=>n.remove());
    document.querySelectorAll('.portal-sidebar-btn.logout').forEach(b=>b.addEventListener('click',()=>action(()=>onboarding.logout(account),b)));
    const current=decodeURIComponent(location.pathname);
    document.querySelectorAll('.portal-nav-link').forEach(a=>{const active=decodeURIComponent(new URL(a.href).pathname)===current;a.classList.toggle('active',active);a.closest('li')?.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');});
    const user=document.querySelector('.portal-user-profile');if(user){user.replaceChildren(node('span',account.name.charAt(0).toUpperCase(),'portal-live-avatar'),node('span','▼','portal-user-chevron'));user.setAttribute('role','link');user.tabIndex=0;user.setAttribute('aria-label','Open profile for '+account.name);user.addEventListener('click',()=>location.assign('/profile/index.html'));user.addEventListener('keydown',e=>{if(e.key==='Enter')location.assign('/profile/index.html');});}
    if(el('account-summary'))el('account-summary').textContent=account.name+' · '+account.email;
    const top=document.querySelector('.portal-topbar');if(top){const menu=node('button','☰','portal-mobile-menu portal-btn portal-btn-secondary');menu.type='button';menu.setAttribute('aria-label','Toggle navigation');menu.setAttribute('aria-expanded','false');menu.onclick=()=>menu.setAttribute('aria-expanded',String(document.body.classList.toggle('portal-nav-open')));top.prepend(menu);}
    const bell=document.querySelector('.portal-notif-btn');if(bell){bell.querySelector('.portal-notif-dot')?.remove();bell.addEventListener('click',()=>action(async()=>{let panel=el('portal-notifications');if(panel){panel.remove();return;}panel=node('section',null,'portal-info-card portal-notification-panel');panel.id='portal-notifications';panel.append(node('h2','Reminders','portal-info-card-title'));top.append(panel);await reminders(panel);},null,'Reminders loaded.'));}
    const search=document.querySelector('.portal-search-input');if(search)search.addEventListener('keydown',event=>{if(event.key!=='Enter')return;event.preventDefault();const query=search.value.trim().toLowerCase();if(!query)return;const match=[...document.querySelectorAll('.portal-nav-link')].find(a=>a.textContent.toLowerCase().includes(query));if(match)location.assign(match.href);else{search.setCustomValidity('No matching page. Try skills, tasks, profile, or roadmap.');search.reportValidity();}});if(search)search.addEventListener('input',()=>search.setCustomValidity(''));
  }
  async function start() {
    if(page==='login'||page==='register'){await auth();return;}
    if(!page)return;
    account=await request('GET','auth/me');checklist=await request('GET','students/me/onboarding');
    if(!checklist.ready&&!setup.has(page)){location.replace(canonical(checklist.sections.find(s=>!s.complete).href));return;}
    const requiredStep=onboarding.guard(page,checklist);if(requiredStep){location.replace(requiredStep);return;}
    onboarding.configure(account,checklist,page);
    await navigation();const parent=el('portal-content');
    onboarding.mount();onboarding.demoBanner();document.body.classList.add('portal-session-ready');
    switch(page){
      case 'onboarding':onboarding.intro(parent);break;
      case 'preparation':await onboarding.preparation(parent);return;
      case 'profile':profile(parent);break;
      case 'profile completion':onboarding.intro(parent);break;
      case 'academic-details':academics(parent);break;
      case 'interests':case 'strengths':case 'values':selections(parent,page);break;
      case 'skills':skills(parent);break;
      case 'career-goal':careerGoal(parent);break;
      case 'assessment':case 'form assessment':await assessment(parent);break;
      case 'dashboard':await dashboard(parent);break;
      case 'career roadmap':await roadmaps(parent);break;
      case 'daily tasks':await tasks(parent);break;
      case 'planner':case 'deadline system':await tasks(parent,true);break;
      case 'oppertunity page':case 'activities':await opportunities(parent);break;
      case 'progress tracker':case 'charts':await progress(parent);break;
      case 'recommondation page':await recommendations(parent);break;
      case 'journal':empty(parent,'Journal storage is not available in the current backend. Use saved tasks to record actions and track your progress.');link(parent,'Open my tasks →','/daily%20tasks/index.html');break;
    }
    status('');
  }
  start().catch(error=>{if(error.status===401)location.replace('/login.html');else status(error.message,true);});
})();
