/* Personal guidance and manual exploration share one persisted set of account choices. */
(() => {
  const request=(method,path,body)=>SamvedApi.request(method,path,body);
  const text=(parent,tag,value,className)=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;parent.appendChild(node);return node;};
  async function mount(container,options={}) {
    container.classList.add('roadmap-hub');container.replaceChildren();
    const status=text(container,'p','Loading your roadmap choices…','rh-status');status.setAttribute('role','status');
    let state,catalogue=[],viewer,currentSlug=null,busy=false,all=false;
    const checklist=text(container,'div',''),recommended=text(container,'section',''),saved=text(container,'section','');
    const library=text(container,'section','','rh-library');text(library,'h3','Explore any roadmap','rh-heading');
    text(library,'p','Your interests guide the suggestions above. You can also choose any path from the full catalogue, even if it is different from your recommendations.','rh-description');
    const searchRow=text(library,'div','','rh-search'),search=text(searchRow,'input','');search.type='search';search.placeholder='Search all roadmaps: Python, AI, UX design, DevOps…';search.setAttribute('aria-label','Search all roadmaps');
    const showAll=text(searchRow,'button','Show all roadmaps');showAll.type='button';
    const resultCount=text(library,'p','','rh-description'),results=text(library,'div','','rh-cards rh-results');
    const current=text(container,'section','','rh-current');text(current,'h3','Roadmap viewer','rh-heading');
    const currentActions=text(current,'div','','rh-current-actions'),saveCurrent=text(currentActions,'button','Add this roadmap to my roadmaps','rh-primary');saveCurrent.type='button';saveCurrent.hidden=true;
    const currentNote=text(currentActions,'span','Choose a recommendation or browse a roadmap to preview it.','rh-description');
    const viewerNode=text(current,'div','');
    function button(parent,label,handler,primary=false){const b=text(parent,'button',label,primary?'rh-primary':'');b.type='button';b.onclick=handler;return b;}
    async function action(work){if(busy)return;busy=true;status.textContent='Saving your roadmap choice…';try{await work();status.textContent='Your roadmap choices are saved to your account.';}catch(error){status.textContent=error.message;}finally{busy=false;}}
    function find(slug){return catalogue.find(item=>item.slug===slug)||state?.saved.find(item=>item.slug===slug)||state?.recommended.find(item=>item.slug===slug);}
    function save(slug){return action(async()=>{state=await request('POST','/api/v1/roadmaps/preferences',{slug});renderSections();preview(slug);current.scrollIntoView({behavior:'smooth',block:'start'});});}
    function activate(slug){return action(async()=>{state=await request('PUT','/api/v1/roadmaps/preferences/active',{slug});renderSections();preview(slug);current.scrollIntoView({behavior:'smooth',block:'start'});});}
    function remove(slug){return action(async()=>{state=await request('DELETE',`/api/v1/roadmaps/preferences/${encodeURIComponent(slug)}`);renderSections();updateCurrent();});}
    function updateCurrent(){if(!currentSlug)return;saveCurrent.hidden=false;const chosen=state.saved.some(item=>item.slug===currentSlug);saveCurrent.textContent=state.activeSlug===currentSlug?'Active roadmap':chosen?'Make this my active roadmap':'Add this roadmap to my roadmaps';saveCurrent.disabled=state.activeSlug===currentSlug;
      const item=find(currentSlug);currentNote.textContent=state.activeSlug===currentSlug?`${item?.title||currentSlug} · Active roadmap, saved to your account`:`Previewing ${item?.title||currentSlug} · ${chosen?'Saved; make it active to reopen it next time.':'Add it to keep it for later.'}`;}
    function preview(slug){const item=find(slug);if(!item){status.textContent='This roadmap is not available in the catalogue.';return;}currentSlug=slug;
      if(!viewer){const priority=[...state.saved,...state.recommended,...catalogue];const unique=new Map(priority.map(item=>[item.slug,item]));unique.delete(slug);viewer=SamvedRoadmapViewer.mount(viewerNode,[item,...unique.values()]);}
      else if(viewer.getSlug()!==slug)viewer.load(slug);
      updateCurrent();}
    viewerNode.addEventListener('samved-roadmap-change',event=>{currentSlug=event.detail.slug;updateCurrent();});
    saveCurrent.onclick=()=>{if(currentSlug)state.saved.some(item=>item.slug===currentSlug)?activate(currentSlug):save(currentSlug);};
    function cards(parent,items,kind){const grid=text(parent,'div','','rh-cards');if(!items.length){text(grid,'p',kind==='saved'?'No saved roadmaps yet. Use “Add to my roadmaps” on any path.':'No suggestions to display yet.','rh-description');return;}
      for(const item of items){const card=text(grid,'article','','rh-card');text(card,'h4',item.title);text(card,'p',(item.description||'Explore this learning path.').slice(0,180));
        if(item.reasons?.length)text(card,'div',item.reasons.join(' · '),'rh-reasons');
        const actions=text(card,'div','','rh-actions');
        if(kind==='saved'){button(actions,state.activeSlug===item.slug?'Open active roadmap':'Open',()=>activate(item.slug),true);button(actions,'Remove',()=>remove(item.slug));}
        else{button(actions,'Preview',()=>{preview(item.slug);current.scrollIntoView({behavior:'smooth',block:'start'});});const b=button(actions,state.saved.some(s=>s.slug===item.slug)?'Already saved':'Add to my roadmaps',()=>save(item.slug),true);b.disabled=state.saved.some(s=>s.slug===item.slug);}
      }
    }
    function renderChecklist(){checklist.replaceChildren();const box=text(checklist,'details','','rh-onboarding');box.open=!state.checklist.ready;
      text(box,'summary',state.checklist.ready?'Career profile complete — update your answers':`Complete your career profile · ${state.checklist.completed} of ${state.checklist.total} sections`);
      text(box,'p','Complete every required section and all assessment questions so recommendations reflect you. Keep at least one saved entry in each section; choosing to keep exploring as your career direction is valid.','rh-description');
      const list=text(box,'ol','','rh-checklist');for(const step of state.checklist.sections){const li=text(list,'li','');const link=text(li,'a',`${step.complete?'✓':'○'} ${step.title}`);link.href=step.href;text(li,'small',step.detail);}
      const next=state.checklist.sections.find(step=>!step.complete);if(next){const link=text(box,'a',`Continue: ${next.title}`,'rh-continue');link.href=next.href;}
      text(box,'p','After completing your profile and assessment, browse and save any available roadmap below.','rh-description');
    }
    function renderSections(){renderChecklist();recommended.replaceChildren();text(recommended,'h3','Recommended for you','rh-heading');text(recommended,'p',state.message,'rh-description');
      if(state.checklist.ready&&state.recommended.length)cards(recommended,state.recommended,'recommended');
      saved.replaceChildren();text(saved,'h3','My saved roadmaps','rh-heading');cards(saved,state.saved,'saved');renderLibrary();updateCurrent();}
    function renderLibrary(){results.replaceChildren();const term=search.value.trim().toLowerCase();const matches=catalogue.filter(item=>`${item.title} ${item.description} ${item.slug}`.toLowerCase().includes(term));const visible=all||term?matches:matches.slice(0,6);
      resultCount.textContent=catalogue.length?`${matches.length} matching roadmaps${visible.length<matches.length?` · showing ${visible.length}; search or show all to see more`:''}`:'The catalogue could not load. Your saved choices are kept; refresh to try again.';
      showAll.textContent=all?'Show fewer roadmaps':`Show all ${catalogue.length} roadmaps`;showAll.disabled=!catalogue.length;
      if(!matches.length&&term)text(results,'p','No matching roadmap in this catalogue. Try a broader topic, or explore a custom career from Find roadmaps.','rh-description');
      for(const item of visible){const card=text(results,'article','','rh-card');text(card,'h4',item.title);text(card,'p',(item.description||'').slice(0,140));const actions=text(card,'div','','rh-actions');button(actions,'Preview',()=>{preview(item.slug);current.scrollIntoView({behavior:'smooth',block:'start'});});const b=button(actions,state.saved.some(s=>s.slug===item.slug)?'Already saved':'Add to my roadmaps',()=>save(item.slug),true);b.disabled=state.saved.some(s=>s.slug===item.slug);}
    }
    search.oninput=renderLibrary;showAll.onclick=()=>{all=!all;renderLibrary();};
    try{const data=await Promise.allSettled([request('GET','/api/v1/roadmaps/guidance'),request('GET','/api/v1/roadmaps/catalogue')]);
      if(data[0].status==='rejected')throw data[0].reason;state=data[0].value;
      if(data[1].status==='fulfilled')catalogue=data[1].value.map(item=>({...item,slug:SamvedRoadmapViewer.slugFromUrl(item.url)})).filter(item=>item.slug).sort((a,b)=>a.title.localeCompare(b.title));
      renderSections();const first=options.initialSlug||state.activeSlug||state.recommended[0]?.slug;
      if(first)preview(first);else text(viewerNode,'p','Preview any roadmap above. Your choices are never restricted to one career category.','rh-description');
      status.textContent=data[1].status==='rejected'?'The full catalogue is temporarily unavailable. Refresh to try again.':'';
      return true;
    }catch(error){status.textContent=error.message;button(container,'Retry loading roadmaps',()=>mount(container,options));return false;}
  }
  window.SamvedRoadmapHub={mount};
})();
