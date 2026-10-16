/* Guided setup, dashboard preparation, and an isolated exhibition demo. */
(() => {
  const api=window.SamvedApi;
  const request=(method,path,body)=>api.request(method,'/api/v1/'+path,body);
  const paths={profile:'/profile/index.html',academics:'/academic-details/index.html',career:'/career-goal/index.html',interests:'/interests/index.html',skills:'/skills/index.html',strengths:'/strengths/index.html',values:'/values/index.html',assessment:'/form%20assessment/index.html'};
  const pageKeys={'profile':'profile','academic-details':'academics','career-goal':'career','interests':'interests','skills':'skills','strengths':'strengths','values':'values','assessment':'assessment','form assessment':'assessment'};
  let state,account,currentKey,guided=false,continueButton;
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  const status=text=>{const n=document.getElementById('portal-status');if(n)n.textContent=text;};
  const demo=profile=>sessionStorage.getItem('samved-demo-account')===String(profile?.id);
  function configure(profile,checklist,page){account=profile;state=checklist;currentKey=pageKeys[page];guided=!state.ready;}
  function guard(page,checklist){const next=checklist.sections.findIndex(s=>!s.complete),current=checklist.sections.findIndex(s=>s.key===pageKeys[page]);return !checklist.ready&&current>next?paths[checklist.sections[next].key]:null;}
  async function refresh(){if(!guided)return;state=await request('GET','students/me/onboarding');update();}
  function update(){
    const current=state.sections.find(s=>s.key===currentKey);
    if(continueButton)continueButton.disabled=!current?.complete;
    const progress=document.getElementById('onboarding-progress-text');if(progress)progress.textContent=state.completed+' of '+state.total+' sections saved';
    const fill=document.getElementById('onboarding-progress-fill');if(fill)fill.style.width=(state.completed/state.total*100)+'%';
  }
  async function advance(){await refresh();const next=state.sections.find(s=>!s.complete);location.assign(next?paths[next.key]:'/onboarding/prepare.html');}
  async function saved(key,auto=false){if(!guided)return;await refresh();if(auto&&state.sections.find(s=>s.key===key)?.complete)await advance();}
  function anchor(parent,label,path,cls='portal-btn portal-btn-primary'){const a=node('a',label,cls);a.href=path;parent.append(a);return a;}
  function progressHeader(main){
    const header=node('section',null,'onboarding-progress');
    const index=state.sections.findIndex(s=>s.key===currentKey);
    header.append(node('span',index>=0?'STEP '+(index+1)+' OF '+state.total:'YOUR CAREER PROFILE','portal-live-eyebrow'));
    const text=node('p',null);text.id='onboarding-progress-text';header.append(text);
    const track=node('div',null,'portal-live-track'),fill=node('div');fill.id='onboarding-progress-fill';track.append(fill);header.append(track);
    main.prepend(header);update();
  }
  function mount(){
    if(!guided)return;
    document.body.classList.add('onboarding-mode');
    const badge=document.querySelector('.portal-cute-badge');if(badge)badge.textContent='Your next step ♡';
    const main=document.querySelector('main.portal-main-card');progressHeader(main);
    const aside=document.querySelector('.portal-sidebar');
    if(aside){
      const footer=aside.querySelector('.portal-sidebar-footer'),list=node('ol',null,'onboarding-step-list');
      const next=state.sections.findIndex(s=>!s.complete),index=state.sections.findIndex(s=>s.key===currentKey);
      state.sections.forEach((step,i)=>{const item=node('li');const a=node(i<=next?'a':'span',null,'onboarding-step');if(i<=next)a.href=paths[step.key];a.append(node('span',step.complete?'✓':String(i+1),'onboarding-step-number'),node('span',step.title));if(i===index)a.setAttribute('aria-current','step');if(i>next)a.setAttribute('aria-disabled','true');item.append(a);list.append(item);});
      aside.replaceChildren(node('h2','Your onboarding','portal-info-card-title'),list);if(footer)aside.append(footer);
      const shortcut=node('button','Skip onboarding — judge demo','onboarding-demo-link');shortcut.type='button';shortcut.onclick=()=>showDemo();aside.append(shortcut);
    }
    document.querySelector('.portal-search-wrap')?.remove();document.querySelector('.portal-notif-btn')?.remove();
    const rail=document.querySelector('.portal-right-rail');
    if(rail){const help=node('section',null,'portal-info-card');help.append(node('h3','One step at a time','portal-info-card-title'),node('p','Save every section to unlock your personalised dashboard. You can sign out and resume from your first unfinished step.','portal-info-card-text'));rail.prepend(help);}
    if(currentKey){
      const footer=node('div',null,'onboarding-actions');
      const index=state.sections.findIndex(s=>s.key===currentKey);
      if(index>0)anchor(footer,'← Back',paths[state.sections[index-1].key],'portal-btn portal-btn-secondary');
      if(['academics','skills'].includes(currentKey)){
        continueButton=node('button','Continue →','portal-btn portal-btn-primary');continueButton.type='button';continueButton.addEventListener('click',()=>advance().catch(e=>status(e.message)));footer.append(continueButton);
        footer.append(node('p','Save at least one '+(currentKey==='academics'?'academic record with a subject':'skill with its level')+' before continuing.','portal-info-card-text'));
      }else footer.append(node('p','Use Save & Continue to save your answers and move to the next step.','portal-info-card-text'));
      main.append(footer);update();
    }
  }
  function intro(parent){
    parent.append(node('h2','A few answers. A clearer direction.','onboarding-intro-title'),node('p','Tell us about your background and interests, then answer eight career questions. SAMVED will prepare career ideas, skill gaps, learning paths and relevant opportunities for your dashboard.','onboarding-intro-copy'));
    const list=node('ol',null,'onboarding-overview');
    state.sections.forEach((step,i)=>{const item=node('li');item.append(node('span',String(i+1),'onboarding-step-number'),node('strong',step.title),node('span',step.complete?'Saved':'Required','portal-pill-tag '+(step.complete?'teal':'purple')));list.append(item);});parent.append(list);
    const next=state.sections.find(s=>!s.complete);
    anchor(parent,next?(state.completed<=1?'Review personal details & start →':'Continue onboarding →'):'Prepare my dashboard →',next?(state.completed<=1?paths.profile:paths[next.key]):'/onboarding/prepare.html');
    const shortcut=node('button','Skip onboarding — judge demo','onboarding-demo-link');shortcut.type='button';shortcut.onclick=()=>showDemo();parent.append(shortcut);
    parent.append(node('p','The judge demo opens a separate sample student account. Your own profile is kept as you saved it.','portal-info-card-text'));
  }
  function section(parent,title){const n=node('section',null,'portal-form-section');n.append(node('h2',title,'portal-form-section-title'));parent.append(n);return n;}
  function sourceLabel(value){return value==='AI'?'AI-ranked career suggestions':value==='RULES_FALLBACK'?'Profile matching · AI provider temporarily unavailable':'Profile matching · AI ranking is not enabled';}
  async function preparation(parent){
    status('');
    document.body.classList.add('preparation-mode');
    document.querySelector('.portal-sidebar')?.remove();document.querySelector('.portal-search-wrap')?.remove();document.querySelector('.portal-notif-btn')?.remove();
    const symbol=node('div','✦','preparation-symbol');symbol.setAttribute('aria-hidden','true');
    parent.append(symbol,node('h2','Building your personalised dashboard','onboarding-intro-title'),node('p','Your answers are saved. We are matching your profile and assessment with careers, learning paths and current opportunities.','onboarding-intro-copy'));
    const progress=node('p','0 of 3 checks complete','preparation-progress');progress.setAttribute('role','status');
    const track=node('progress');track.max=3;track.value=0;track.setAttribute('aria-label','Dashboard preparation checks');parent.append(progress,track);
    const jobs=[['Career ideas & skill gaps','recommendations/me'],['Recommended learning paths','roadmaps/guidance'],['Relevant opportunities','opportunities?size=6']];
    const list=node('ul',null,'preparation-list');list.setAttribute('aria-label','Dashboard preparation');list.setAttribute('aria-busy','true');parent.append(list);
    await Promise.allSettled(jobs.map(async([label,path])=>{
      const row=node('li');row.className='preparation-pending';row.setAttribute('aria-busy','true');row.append(node('span',label),node('span',path==='recommendations/me'?'Analysing your profile…':'Finding your matches…'));list.append(row);
      try{const result=await request('GET',path);row.lastChild.textContent=path==='recommendations/me'?sourceLabel(result.source):path.startsWith('opportunities')?(result.content?.length?'Matched to your profile':'No verified listings right now'):'Ready';row.classList.add('prepared');}
      catch(error){if(error.status===401){location.replace('/login.html');return;}row.lastChild.textContent='Unavailable right now · retry from dashboard';row.classList.add('preparation-warning');}
      finally{row.classList.remove('preparation-pending');row.setAttribute('aria-busy','false');track.value+=1;progress.textContent=track.value+' of 3 checks complete';}
    }));
    list.setAttribute('aria-busy','false');symbol.classList.add('preparation-finished');
    sessionStorage.setItem('samved-prepared-account',String(account.id));
    parent.append(node('p','Opening your dashboard…','portal-info-card-text'));
    await new Promise(resolve=>setTimeout(resolve,800));location.replace('/dashboard/index.html');
  }
  async function dashboard(parent){
    const areas=[section(parent,'Recommended careers & skill gaps'),section(parent,'Learning paths for you'),section(parent,'Matched opportunities')];
    async function load(index,path,render){const area=areas[index],body=node('div',null,'portal-match-list');area.append(body);body.append(node('p','Loading your saved-profile matches…','portal-info-card-text'));
      async function fetch(){body.replaceChildren(node('p','Loading…'));try{const data=await request('GET',path);body.replaceChildren();render(body,data);}catch(error){body.replaceChildren(node('p',error.message,'portal-info-card-text'));const retry=node('button','Try again','portal-btn portal-btn-secondary');retry.type='button';retry.onclick=fetch;body.append(retry);}}await fetch();}
    await Promise.allSettled([
      load(0,'recommendations/me',(body,data)=>{
        body.append(node('p',sourceLabel(data.source),'onboarding-source-label'),node('p',data.guidance,'portal-info-card-text'));
        for(const item of (data.recommendations||[]).slice(0,3)){const card=node('article',null,'portal-act-card');card.append(node('h3',item.careerTitle,'portal-act-title'),node('p','Profile overlap: '+item.score+'/100','portal-act-desc'),node('p',(item.reasons||[]).join(' · '),'portal-act-desc'),node('p','Skills to develop: '+((item.skillGaps||[]).join(', ')||'No gaps in this starter catalogue'),'portal-act-desc'));body.append(card);}
        if(!data.recommendations?.length)body.append(node('p','No clear match yet. You can explore any roadmap.','portal-info-card-text'));anchor(body,'View all career guidance →','/recommondation%20page/index.html','portal-info-card-link');
      }),
      load(1,'roadmaps/guidance',(body,data)=>{body.append(node('p',data.message,'portal-info-card-text'));for(const item of (data.recommended||[]).slice(0,3)){const card=node('article',null,'portal-assess-item portal-path-card');card.append(node('strong',item.title),node('p',(item.reasons||[]).join(' · '),'portal-info-card-text'));body.append(card);}anchor(body,'Explore and choose a roadmap →','/career%20roadmap/index.html','portal-btn portal-btn-primary');}),
      load(2,'opportunities?size=6',(body,data)=>{if(!data.content?.length)body.append(node('p','No verified, active opportunities are available right now. New listings appear here when the configured feeds supply them.','portal-info-card-text'));for(const item of data.content||[]){const card=node('article',null,'portal-act-card');card.append(node('h3',item.title,'portal-act-title'),node('p',item.organizer||'Organizer not listed','portal-act-desc'),node('p',item.deadline?'Deadline: '+item.deadline:'Deadline not listed','portal-act-desc'));if(item.matchedSignals?.length)card.append(node('p','Related to: '+item.matchedSignals.join(', '),'portal-act-desc'));const url=item.applicationUrl||item.sourceUrl;if(typeof url==='string'&&/^https:\/\//i.test(url)){const a=anchor(card,'Open original listing →',url,'portal-info-card-link');a.target='_blank';a.rel='noopener noreferrer';}body.append(card);}anchor(body,'Browse all opportunities →','/oppertunity%20page/index.html','portal-info-card-link');})
    ]);
  }
  async function logout(profile){
    if(demo(profile)){await request('DELETE','students/me');sessionStorage.removeItem('samved-demo-account');}
    else await request('POST','auth/logout');api.clearCsrf();location.assign('/login.html');
  }
  function demoBanner(){if(!demo(account))return;const banner=node('div',null,'portal-demo-banner');banner.append(node('strong','Judge demo · sample student'),node('span','Results use sample answers. Opportunity listings still come from the real feed.'));const exit=node('button','Exit demo','portal-btn portal-btn-secondary');exit.type='button';exit.onclick=()=>logout(account).catch(e=>status(e.message));banner.append(exit);document.querySelector('.app-layout').prepend(banner);}
  function installDemoEntry(){const box=document.querySelector('.auth-content-panel');if(!box)return;const button=node('button','Skip to judge demo','onboarding-demo-link');button.type='button';button.onclick=()=>showDemo();box.append(button);}
  function showDemo(){
    let dialog=document.getElementById('judge-demo-dialog');if(dialog){dialog.showModal();return;}
    dialog=node('dialog',null,'judge-demo-dialog');dialog.id='judge-demo-dialog';const form=node('form',null,'portal-live-form');
    form.append(node('h2','Try the judge demo','portal-page-title'),node('p','Use a separate sample adult student with saved education, interests, skills and assessment answers. Your own account data is not changed. Exit demo deletes the sample account.','portal-info-card-text'));
    for(const [id,label] of [['demo-adult','I am 18 or older.'],['demo-privacy','I accept the local privacy notice for this demo.']]){const wrap=node('label',null,'portal-consent'),input=node('input');input.id=id;input.type='checkbox';input.required=true;wrap.append(input,node('span',label));form.append(wrap);}
    anchor(form,'Read the privacy notice','/privacy.html','portal-info-card-link').target='_blank';
    const message=node('p',null,'portal-info-card-text');message.setAttribute('role','status');form.append(message);
    const start=node('button','Start judge demo','portal-btn portal-btn-primary');start.type='submit';const cancel=node('button','Back to my onboarding','portal-btn portal-btn-secondary');cancel.type='button';cancel.onclick=()=>dialog.close();form.append(start,cancel);dialog.append(form);document.body.append(dialog);
    form.onsubmit=async event=>{event.preventDefault();start.disabled=true;cancel.disabled=true;try{await createDemo(text=>message.textContent=text);}catch(error){message.textContent=error.message;start.disabled=false;cancel.disabled=false;}};dialog.showModal();
  }
  async function createDemo(report){
    let created=false;
    try{
      report('Opening a separate demo account…');await request('POST','auth/logout');api.clearCsrf();
      const uuid=crypto.randomUUID(),email='judge-'+uuid+'@demo.samved.invalid',password='Demo!Aa1'+crypto.randomUUID();
      await request('POST','auth/register',{name:'Demo Student',email,password,educationLevel:'undergraduate',cityRegion:'Kochi',adultConfirmed:true,privacyAccepted:true});
      await request('POST','auth/login',{email,password});api.clearCsrf();created=true;
      const profile=await request('GET','auth/me');sessionStorage.setItem('samved-demo-account',String(profile.id));
      report('Saving the sample education and career profile…');
      await request('PUT','students/me',{name:'Demo Student',educationLevel:'undergraduate',cityRegion:'Kochi',careerGoal:{type:'SELECTED',text:'Software Engineer'}});
      await request('PUT','students/me/academics',[{educationLevel:'undergraduate',institution:'Demo College',course:'Computer Science',periodType:'SEMESTER',period:2,scoreType:'PERCENTAGE',score:82,subjects:[{name:'Programming',marks:85}]}]);
      for(const [key,value] of [['interests',['Technology','Research']],['skills',[{name:'Programming',proficiency:'BEGINNER'},{name:'Java',proficiency:'INTERMEDIATE'}]],['strengths',['Analytical Thinking','Curiosity']],['values',['Continuous Learning','Collaboration']]])await request('PUT','students/me/'+key,value);
      await request('PUT','students/me/review/career');report('Saving sample assessment answers…');
      const assessment=await request('GET','assessments/current'),preferred={work:'technical',activity:'building',problem:'breaking_down',environment:'software',motivation:'challenge',working_style:'team',skill:'technical',confidence:'exploring'};
      await request('PUT','assessments/current/responses',{questionVersion:assessment.questionVersion,answers:assessment.questions.map(q=>({questionId:q.id,optionId:q.options.find(o=>o.id===preferred[q.id])?.id||q.options[0].id}))});
      const completed=await request('GET','students/me/onboarding');if(!completed.ready)throw new Error('The sample profile could not be completed. Please try again.');
      await request('POST','roadmaps',{templateCode:'SOFTWARE',goal:'Explore software engineering (demo)'});
      await request('POST','tasks',{title:'Try a short Java exercise (demo)',description:'Sample task for the exhibition.',dueDate:null});
      location.assign('/onboarding/prepare.html');
    }catch(error){if(created){try{await request('DELETE','students/me');}catch{}sessionStorage.removeItem('samved-demo-account');}throw error;}
  }
  window.SamvedOnboarding={configure,guard,mount,intro,preparation,dashboard,saved,refresh,active:()=>guided,installDemoEntry,demoBanner,logout};
})();
