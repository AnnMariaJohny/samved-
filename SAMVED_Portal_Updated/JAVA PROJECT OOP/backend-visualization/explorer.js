/* Source-backed architecture explorer. No student APIs or provider requests are made. */
(() => {
  'use strict';
  const data=window.SAMVED_BACKEND_MAP;
  const byId=new Map(data.features.map(feature=>[feature.id,feature]));
  const el=id=>document.getElementById(id);
  const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  const tiles=new Map();let active='client',traceIndex=0,stepIndex=0,timer=null;
  const references=data.features.flatMap(f=>f.refs);
  el('feature-count').textContent=data.features.length;
  el('source-count').textContent=references.length;
  el('snapshot-note').textContent=data.note+' · '+data.version;
  try{const ref=new URL(document.referrer);if(ref.origin===location.origin&&!ref.pathname.startsWith('/backend-visualization/'))el('return-link').href=ref.href;}catch{}
  function section(title,open=true){const d=make('details',null,'technical-section');d.open=open;d.append(make('summary',title));el('feature-detail').append(d);return d;}
  function button(parent,label,handler,cls='quiet-button'){const b=make('button',label,cls);b.type='button';b.onclick=handler;parent.append(b);return b;}
  function stop(){if(timer!==null){clearInterval(timer);timer=null;}el('play-flow').textContent='Play walkthrough';el('play-flow').setAttribute('aria-pressed','false');}
  function select(id,scroll=false){
    const feature=byId.get(id);if(!feature)return;active=id;
    const neighbors=new Set(data.edges.filter(edge=>edge.includes(id)).flat());
    tiles.forEach((tile,key)=>{tile.setAttribute('aria-pressed',String(key===id));tile.classList.toggle('is-connected',key!==id&&neighbors.has(key));});
    history.replaceState(null,'','#feature='+id);
    const pane=el('feature-detail');pane.replaceChildren();pane.scrollTop=0;
    const jumps=make('div',null,'detail-jumps');
    button(jumps,'Data flow',()=>flow.scrollIntoView({block:'nearest',behavior:'smooth'}));
    button(jumps,'View code ↗',()=>{sources.open=true;sources.querySelector('.code-ref').open=true;requestAnimationFrame(()=>sources.scrollIntoView({block:'nearest',behavior:'smooth'}));});
    const back=button(jumps,'↑ Map',()=>el('architecture-map').scrollIntoView({block:'start',behavior:'smooth'}));back.classList.add('mobile-map-back');pane.append(jumps);
    pane.append(make('span',feature.tag,'detail-tag'),make('h2',feature.title),make('p',feature.brief,'detail-brief'));
    const why=make('div',null,'detail-why');why.append(make('strong','WHY IT EXISTS'),make('span',feature.why));pane.append(why);
    pane.append(make('h3','Follow the data'));
    const flow=make('ol',null,'detail-flow');feature.flow.forEach(text=>flow.append(make('li',text)));pane.append(flow);
    const logic=section('How it is implemented'),list=make('ul');feature.logic.forEach(text=>list.append(make('li',text)));logic.append(list);
    const routes=section('API contracts'),api=make('div',null,'api-list');feature.apis.forEach(route=>api.append(make('code',route,'api-route')));routes.append(api);
    if(feature.tables.length){const db=section('Where the data lives',false),tags=make('div',null,'table-tags');feature.tables.forEach(table=>tags.append(make('span',table,'table-tag')));db.append(tags);}
    const guard=section('Boundaries & fallback',false);guard.append(make('p',feature.guard,'guard-note'));
    const sources=section('Pinpoint the code · '+feature.refs.length+' locations');
    sources.append(make('p','Expand a file to inspect its actual source. Line numbers are verified against this code snapshot. Copy its path to find it in your editor.','source-caption'));
    feature.refs.forEach(ref=>{
      const details=make('details',null,'code-ref');details.append(make('summary',ref.path.split('/').pop()+' · L'+ref.start+'–'+ref.end));
      details.append(make('p',ref.symbol,'source-symbol'),make('span',ref.path,'source-path'));
      const lines=make('ol',null,'code-lines');lines.start=ref.start;lines.setAttribute('aria-label','Source code with line numbers');
      ref.code.split('\n').forEach(line=>{const li=make('li');li.append(make('code',line||' '));lines.append(li);});details.append(lines);
      const actions=make('div',null,'source-actions'),link=make('a','View on GitHub ↗','quiet-button');
      link.href=data.repository+'/blob/main/'+ref.path.split('/').map(encodeURIComponent).join('/')+'#L'+ref.start+'-L'+ref.end;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
      const copy=button(actions,'Copy path:line',async()=>{try{await navigator.clipboard.writeText(ref.path+':'+ref.start);copy.textContent='Copied';}catch{copy.textContent='Select the path above to copy';}});
      details.append(actions);sources.append(details);
    });
    const related=section('Connected features',false),links=make('div',null,'related-features');
    [...neighbors].filter(key=>key!==id).forEach(key=>button(links,byId.get(key).title,()=>{stop();select(key,true);}));related.append(links);
    requestAnimationFrame(drawEdges);
    if(scroll&&matchMedia('(max-width:850px)').matches)pane.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
  }
  data.lanes.forEach((title,index)=>{
    const lane=make('section',null,'map-lane');lane.append(make('h3',String(index+1).padStart(2,'0')+' / '+title.toUpperCase(),'lane-label'));
    const grid=make('div',null,'feature-grid');
    data.features.filter(f=>f.lane===index).forEach(feature=>{
      const tile=button(grid,'',()=>{stop();select(feature.id,true);},'feature-tile');tile.dataset.feature=feature.id;tile.setAttribute('aria-controls','feature-detail');tile.setAttribute('aria-pressed','false');tile.title=feature.brief;
      tile.append(make('span',String(data.features.indexOf(feature)+1).padStart(2,'0')+' ↗','tile-index'),make('span',feature.title,'tile-title'),make('span',feature.tag,'tile-tag'));tiles.set(feature.id,tile);
    });lane.append(grid);el('map-lanes').append(lane);
  });
  function drawEdges(){
    const svg=el('map-connections'),map=el('architecture-map').getBoundingClientRect();svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+map.width+' '+map.height);
    data.edges.filter(edge=>edge.includes(active)).forEach(([from,to])=>{
      const a=tiles.get(from).getBoundingClientRect(),b=tiles.get(to).getBoundingClientRect();
      const x1=a.left+a.width/2-map.left,y1=a.top+a.height/2-map.top,x2=b.left+b.width/2-map.left,y2=b.top+b.height/2-map.top;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.classList.add('flow-edge');path.setAttribute('d',`M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`);svg.append(path);
    });
  }
  data.traces.forEach((trace,index)=>{const option=make('option',trace.title);option.value=index;el('trace-select').append(option);});
  function showStep(selectFeature=true){
    const trace=data.traces[traceIndex],step=trace.steps[stepIndex];
    el('trace-counter').textContent=String(stepIndex+1).padStart(2,'0')+' / '+trace.steps.length;
    el('trace-caption').textContent=step[1];el('previous-step').disabled=stepIndex===0;el('next-step').disabled=stepIndex===trace.steps.length-1;
    el('trace-track').replaceChildren();trace.steps.forEach((item,index)=>{const dot=button(el('trace-track'),'',()=>{stop();stepIndex=index;showStep();},'trace-dot');dot.classList.toggle('active',index===stepIndex);dot.classList.toggle('visited',index<stepIndex);dot.setAttribute('aria-label','Step '+(index+1)+': '+item[1]);if(index===stepIndex)dot.setAttribute('aria-current','step');});
    if(selectFeature)select(step[0]);
  }
  el('trace-select').onchange=()=>{stop();traceIndex=Number(el('trace-select').value);stepIndex=0;showStep();};
  el('previous-step').onclick=()=>{stop();stepIndex=Math.max(0,stepIndex-1);showStep();};
  el('next-step').onclick=()=>{stop();stepIndex=Math.min(data.traces[traceIndex].steps.length-1,stepIndex+1);showStep();};
  el('play-flow').onclick=()=>{
    if(timer!==null){stop();return;}if(stepIndex===data.traces[traceIndex].steps.length-1)stepIndex=0;
    showStep();el('play-flow').textContent='Pause walkthrough';el('play-flow').setAttribute('aria-pressed','true');
    timer=setInterval(()=>{if(stepIndex>=data.traces[traceIndex].steps.length-1){stop();return;}stepIndex++;showStep();},3500);
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  const observer=new ResizeObserver(()=>requestAnimationFrame(drawEdges));observer.observe(el('architecture-map'));
  let initial=new URLSearchParams(location.hash.slice(1)).get('feature');if(!byId.has(initial))initial='client';
  showStep(false);select(initial);
})();
