/* Saved profile sections share the same API and authenticated identity. */
(() => {
  const api = window.SamvedApi;
  const el = id => document.getElementById(id);
  const page = location.pathname.split('/').pop().replace('.html', '');
  let profile;
  let busy = false;
  let ready = false;
  let skills = [], academics = [], interests = [], strengths = [], values = [];
  const messageId = {profile:'profileMessage',academic:'academicMessage',skills:'skillMessage',interests:'interestMessage',strengths:'strengthMessage',values:'valueMessage',careergoal:'careerMessage'}[page];
  function message(text) { if (el(messageId)) el(messageId).textContent = text; }
  async function action(work) {
    if (!ready || busy) return;
    busy = true; message('Saving…');
    try { await work(); message('Saved to your account.'); window.dispatchEvent(new Event('samved-profile-saved')); }
    catch (error) { message(error.message); }
    finally { busy = false; }
  }
  function text(parent, tag, value) {
    const node = document.createElement(tag); node.textContent = value; parent.appendChild(node); return node;
  }
  function removeButton(parent, handler) {
    const button = text(parent, 'button', 'Delete'); button.type = 'button'; button.addEventListener('click', handler);
  }
  async function updateDetails(changes) {
    const fresh = await api.request('GET','/api/v1/students/me');
    profile = await api.request('PUT','/api/v1/students/me', {
      name:fresh.name, educationLevel:fresh.educationLevel, cityRegion:fresh.cityRegion, careerGoal:fresh.careerGoal, ...changes
    });
  }
  function drawSkills() {
    const list = el('skillsTableBody'); if (!list) return; list.replaceChildren();
    skills.forEach((skill,index) => {
      const row = document.createElement('tr'); list.appendChild(row);
      text(row,'td',skill.name); text(row,'td',skill.proficiency);
      removeButton(text(row,'td',''), () => action(async () => {
        skills = await api.request('PUT','/api/v1/students/me/skills',skills.filter((_,i)=>i!==index)); drawSkills();
      }));
    });
    if (!skills.length) text(text(list,'tr',''),'td','No skills saved yet.');
  }
  window.addSkill = () => action(async () => {
    skills = await api.request('PUT','/api/v1/students/me/skills',[
      ...skills,{name:el('skill').value.trim(), proficiency:el('skillLevel').value.toUpperCase()}
    ]);
    el('skill').value=''; el('skillLevel').value=''; drawSkills();
  });
  function drawSelections(section, items, listId) {
    const list=el(listId); if(!list) return; list.replaceChildren();
    if(!items.length) text(list,'p','No items saved yet.');
    items.forEach((item,index) => {
      const row=text(list,'div',''); row.className='academic-record'; text(row,'span',item+' ');
      removeButton(row,()=>action(async()=> {
        const saved=await api.request('PUT',`/api/v1/students/me/${section}`,items.filter((_,i)=>i!==index));
        setSelections(section,saved); drawAllSelections();
      }));
    });
  }
  function setSelections(section,items) { if(section==='interests') interests=items; if(section==='strengths') strengths=items; if(section==='values') values=items; }
  function drawAllSelections() {
    drawSelections('interests',interests,'selectedInterestsList');
    drawSelections('strengths',strengths,'strengthsList'); drawSelections('values',values,'valuesList');
    document.querySelectorAll('.interest-option').forEach(button=>button.classList.toggle('selected',interests.includes(button.textContent.trim())));
    document.querySelectorAll('input[name="strength"]').forEach(box=>box.checked=strengths.includes(box.value));
    document.querySelectorAll('input[name="value"]').forEach(box=>box.checked=values.includes(box.value));
  }
  window.toggleInterest = button => { if(ready) button.classList.toggle('selected'); };
  window.saveInterests = () => action(async()=> {
    interests=await api.request('PUT','/api/v1/students/me/interests',Array.from(document.querySelectorAll('.interest-option.selected'),button=>button.textContent.trim())); drawAllSelections();
  });
  window.clearInterests = () => action(async()=> { interests=await api.request('PUT','/api/v1/students/me/interests',[]); drawAllSelections(); });
  for(const [name,section] of [['Strengths','strengths'],['Values','values']]) {
    window['save'+name]=()=>action(async()=> {
      const inputName=section==='strengths'?'strength':'value';
      const saved=await api.request('PUT',`/api/v1/students/me/${section}`,Array.from(document.querySelectorAll(`input[name="${inputName}"]:checked`),box=>box.value));
      setSelections(section,saved); drawAllSelections();
    });
  }
  window.showCustomCareer = () => { el('customCareerBox').style.display='block'; };
  window.hideCustomCareer = () => { el('customCareerBox').style.display='none'; };
  function drawGoal() {
    const list=el('careerList'); if(!list) return; list.replaceChildren();
    text(list,'p',profile.careerGoal.type==='EXPLORING'?'Exploring — I am not sure yet':profile.careerGoal.text);
    const radios=Array.from(document.querySelectorAll('input[name="careerGoal"]'));
    const match=radios.find(r=>r.value===profile.careerGoal.text);
    radios.forEach(r=>r.checked=profile.careerGoal.type==='EXPLORING'?r.value==='I am not sure yet':match?r===match:r.value==='Other');
    const custom=profile.careerGoal.type!=='EXPLORING'&&!match;
    el('customCareerBox').style.display=custom?'block':'none'; el('customCareer').value=custom?profile.careerGoal.text:'';
    removeButton(list,()=>action(async()=> { await updateDetails({careerGoal:{type:'EXPLORING',text:null}}); drawGoal(); }));
  }
  window.saveCareerGoal = () => action(async()=> {
    const selected=document.querySelector('input[name="careerGoal"]:checked');
    if(!selected) throw new Error('Choose a career goal.');
    const goal=selected.value==='I am not sure yet'?{type:'EXPLORING',text:null}:selected.value==='Other'?{type:'CUSTOM',text:el('customCareer').value.trim()}:{type:'SELECTED',text:selected.value};
    await updateDetails({careerGoal:goal}); profile=await api.request('PUT','/api/v1/students/me/review/career'); drawGoal();
  });
  window.addSubject = () => {
    const row=document.createElement('div'); row.className='subject-row';
    const name=document.createElement('input'); name.className='subject-name'; name.placeholder='Subject'; name.maxLength=100; name.setAttribute('aria-label','Subject name');
    const marks=document.createElement('input'); marks.className='subject-marks'; marks.type='number'; marks.min=0; marks.max=100; marks.step='0.01'; marks.placeholder='Marks (%)'; marks.setAttribute('aria-label','Subject marks out of 100');
    row.append(name,marks); const button=text(row,'button','Remove'); button.type='button'; button.onclick=()=>row.remove(); el('subjectsContainer').appendChild(row);
  };
  function drawAcademics() {
    const list=el('academicRecords'); if(!list) return; list.replaceChildren();
    if(!academics.length) text(list,'p','No academic records saved yet.');
    academics.forEach((record,index)=> {
      const card=text(list,'div',''); card.className='academic-record';
      text(card,'h3',`${record.course} — ${record.periodType} ${record.period}`);
      text(card,'p',`${record.institution} · ${record.educationLevel} · ${record.score} ${record.scoreType==='CGPA_10'?'/ 10':'%'}`);
      record.subjects.forEach(subject=>text(card,'p',`${subject.name}: ${subject.marks}%`));
      removeButton(card,()=>action(async()=> { academics=await api.request('PUT','/api/v1/students/me/academics',academics.filter((_,i)=>i!==index)); drawAcademics(); }));
    });
  }
  window.saveAcademicRecord = () => action(async()=> {
    const required=['educationLevel','institution','course','academicPeriodType','academicPeriod','overallScore'];
    if(required.some(id=>!el(id).value.trim())) throw new Error('Fill in every academic field.');
    const subjects=Array.from(document.querySelectorAll('.subject-row'),row=> {
      const marks=row.querySelector('.subject-marks').value;
      if(marks==='') throw new Error('Enter marks for every subject.');
      return {name:row.querySelector('.subject-name').value.trim(),marks:Number(marks)};
    });
    const educationMap={'School':'school','Higher Secondary':'higher-secondary','Undergraduate':'undergraduate','Postgraduate':'postgraduate','Other':'other'};
    const record={educationLevel:educationMap[el('educationLevel').value],institution:el('institution').value.trim(),course:el('course').value.trim(),periodType:el('academicPeriodType').value.toUpperCase(),period:Number(el('academicPeriod').value),scoreType:el('scoreType').value,score:Number(el('overallScore').value),subjects};
    academics=await api.request('PUT','/api/v1/students/me/academics',[...academics,record]); drawAcademics();
    el('subjectsContainer').replaceChildren(); window.addSubject();
  });
  function drawProfile() {
    for(const [id,value] of Object.entries({name:profile.name,email:profile.email,location:profile.cityRegion,education:profile.educationLevel})) el(id).value=value;
    el('welcomeMessage').textContent=`Welcome, ${profile.name}!`;
    el('progressText').textContent='Checking your profile and assessment…';
  }
  SamvedSession.then(async saved=> {
    if(!saved) { message('Your profile could not load. Refresh to try again.'); return; }
    profile=saved; ({skills,academics,interests,strengths,values}=saved); ready=true;
    if(el(messageId)) { el(messageId).setAttribute('role','status'); el(messageId).setAttribute('aria-live','polite'); }
    if(page==='profile') {
      drawProfile();
      el('editButton').onclick=()=> { ['name','location','education'].forEach(id=>el(id).disabled=false); el('editButton').style.display='none'; el('saveButton').style.display='block'; };
      el('saveButton').onclick=()=>action(async()=> {
        await updateDetails({name:el('name').value.trim(),cityRegion:el('location').value.trim(),educationLevel:el('education').value});
        ['name','location','education'].forEach(id=>el(id).disabled=true); el('editButton').style.display='block'; el('saveButton').style.display='none'; drawProfile();
      });
      el('passwordForm').onsubmit=event=> { event.preventDefault(); action(async()=> {
        if(el('newPassword').value!==el('repeatPassword').value) throw new Error('New passwords do not match.');
        await api.request('PUT','/api/v1/auth/password',{currentPassword:el('currentPassword').value,newPassword:el('newPassword').value});
        api.clearCsrf(); el('passwordForm').reset();
      }); };
      el('deleteAccount').onclick=()=> {
        if(confirm('Permanently delete your account, profile, tasks, assessments and roadmaps?')) action(async()=> { await api.request('DELETE','/api/v1/students/me'); location.assign('/auth/register.html'); });
      };
    }
    if(page==='skills') drawSkills();
    if(['interests','strengths','values'].includes(page)) drawAllSelections();
    if(page==='careergoal') drawGoal();
    if(page==='academic') { drawAcademics(); window.addSubject(); }
  });
})();
