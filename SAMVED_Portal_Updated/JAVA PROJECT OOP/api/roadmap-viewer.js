/* Source nodes and topic explanations stay inside SAMVED; no upstream HTML is injected. */
(() => {
  const api=()=>window.SamvedApi;
  const text=(parent,tag,value,className)=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;parent.appendChild(node);return node;};
  function slugFromUrl(value) {
    if(typeof value!=='string'||!value.trim())return null;
    try { const url=new URL(value,'https://roadmap.sh'); if(url.origin!=='https://roadmap.sh')return null;
      const slug=url.searchParams.get('r')||url.pathname.slice(1); return /^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)?slug:null;
    } catch {return null;}
  }
  function localLink(url) { const slug=slugFromUrl(url); return slug?`/roadmap-explorer/view.html?slug=${encodeURIComponent(slug)}`:null; }
  function mount(container,resources) {
    container.classList.add('roadmap-native');container.replaceChildren();
    const choices=resources.map(resource=>({...resource,slug:resource.slug||slugFromUrl(resource.url)})).filter(resource=>/^[a-z0-9][a-z0-9-]{0,99}$/.test(resource.slug));
    if(!choices.length){text(container,'p','No source roadmap is available for this selection.');return;}
    const toolbar=text(container,'div','','rv-toolbar');
    const label=text(toolbar,'label','Roadmap ');const select=text(label,'select','');select.setAttribute('aria-label','Choose roadmap');
    choices.forEach(choice=>{const option=text(select,'option',choice.title||choice.slug);option.value=choice.slug;});
    const button=(label,handler)=>{const b=text(toolbar,'button',label);b.type='button';b.onclick=handler;return b;};
    const mapButton=button('Map',()=>showList(false));const listButton=button('Topics',()=>showList(true));
    button('−',()=>zoom(scale/1.25)).setAttribute('aria-label','Zoom out');button('+',()=>zoom(scale*1.25)).setAttribute('aria-label','Zoom in');button('Fit',()=>fit());
    const search=text(toolbar,'input','');search.type='search';search.placeholder='Find a topic…';search.setAttribute('aria-label','Find a roadmap topic');
    const status=text(container,'p','Loading the full roadmap…','rv-status');status.setAttribute('role','status');
    text(container,'p','Yellow: core topic · Pale yellow: subtopic · Click any topic to read it here.','rv-legend');
    const stage=text(container,'div','','rv-stage');stage.tabIndex=0;stage.setAttribute('aria-label','Scrollable roadmap diagram');
    const wrapper=text(stage,'div','','rv-wrapper'),canvas=text(wrapper,'div','','rv-canvas');
    const list=text(container,'div','','rv-topic-list');list.hidden=true;
    const panel=text(container,'section','','rv-panel');panel.hidden=true;panel.setAttribute('aria-label','Topic details');
    text(container,'p','Roadmap content by roadmap.sh · displayed in SAMVED through the configured Parse connection.','rv-attribution');
    let graph,slug=choices[0].slug,scale=1,width=1100,height=1000,nodes=[],request=0,topicRequest=0,listMode=false;
    function zoom(value){scale=Math.max(.2,Math.min(2,value));canvas.style.transform=`scale(${scale})`;wrapper.style.width=`${width*scale}px`;wrapper.style.height=`${height*scale}px`;}
    function fit(){zoom(Math.min(1,Math.max(.2,(stage.clientWidth-24)/width)));}
    function showList(value){listMode=value;stage.hidden=value;list.hidden=!value;mapButton.setAttribute('aria-pressed',String(!value));listButton.setAttribute('aria-pressed',String(value));if(!value)fit();}
    function appendInline(parent,value){
      const regex=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;let last=0,match;
      while((match=regex.exec(value))){parent.appendChild(document.createTextNode(value.slice(last,match.index)));resourceLink(parent,match[1],match[2]);last=regex.lastIndex;}
      parent.appendChild(document.createTextNode(value.slice(last).replace(/\*\*([^*]+)\*\*/g,'$1')));
    }
    function markdown(parent,value){
      for(const line of String(value||'').split(/\r?\n/)){
        if(!line.trim())continue;
        const heading=line.match(/^(#{1,6})\s+(.*)/);const bullet=line.match(/^\s*[-*]\s+(.*)/);
        const node=text(parent,heading?'h4':'p','');appendInline(node,heading?heading[2]:bullet?'• '+bullet[1]:line);
      }
    }
    function richText(parent,node,depth=0){
      if(!node||depth>40)return;
      if(node.type==='text'){
        const link=node.marks?.find(mark=>mark.type==='link');
        if(link)resourceLink(parent,node.text||'',link.attrs?.href);
        else parent.appendChild(document.createTextNode(node.text||''));return;
      }
      if(node.type==='hardBreak'){parent.appendChild(document.createElement('br'));return;}
      const tags={paragraph:'p',heading:'h4',bulletList:'ul',orderedList:'ol',listItem:'li',blockquote:'blockquote',codeBlock:'pre'};
      const target=tags[node.type]?text(parent,tags[node.type],''):parent;
      if(['image','youtube','video'].includes(node.type)){
        const src=node.attrs?.src;let url;try{url=new URL(src);}catch{return;}
        if(node.type==='image'&&url.protocol==='https:'){const image=document.createElement('img');image.src=url.href;image.alt=node.attrs?.alt||'';image.loading='lazy';image.style.maxWidth='100%';target.appendChild(image);}
        else if(['www.youtube.com','youtube.com','youtu.be'].includes(url.hostname)){
          const id=url.hostname==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v')||url.pathname.split('/').pop();
          if(/^[A-Za-z0-9_-]{11}$/.test(id||'')){const frame=document.createElement('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${id}`;frame.title='Source guide video';frame.loading='lazy';frame.allowFullscreen=true;frame.style.cssText='width:100%;aspect-ratio:16/9;border:0';target.appendChild(frame);}
        }else resourceLink(target,'Watch the source video',url.href);
      }
      if(Array.isArray(node.content))node.content.forEach(child=>richText(target,child,depth+1));
    }
    function resourceLink(parent,title,value){
      let url;try{url=new URL(value);if(!['https:','http:'].includes(url.protocol))return;}catch{return;}
      const link=text(parent,'a',title);const local=localLink(url.href);
      if(local){link.href=local;link.onclick=event=>{event.preventDefault();load(slugFromUrl(url.href));};}
      else if(url.hostname==='roadmap.sh' && /^\/guides\/[a-z0-9-]+$/.test(url.pathname)){
        link.href='#';link.onclick=event=>{event.preventDefault();showGuide(url.pathname.split('/').pop(),title);};
      }else{link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.appendChild(document.createTextNode(' ↗'));}
    }
    function panelTitle(title){panel.hidden=false;panel.replaceChildren();const header=text(panel,'header','');text(header,'h3',title);const close=text(header,'button','Close');close.type='button';close.onclick=()=>{panel.hidden=true;topicRequest++;};}
    async function showGuide(guide,title){const current=++topicRequest;panelTitle(title);text(panel,'p','Loading the guide…');try{const data=await api().request('GET',`/api/v1/roadmaps/content/guide?slug=${encodeURIComponent(guide)}`);if(current!==topicRequest)return;panelTitle(title);const content=data.content||data.description||data.body;if(typeof content==='string')markdown(panel,content);else if(content?.type)richText(panel,content);else text(panel,'p','The source has not supplied readable guide content.');}catch(error){if(current===topicRequest)text(panel,'p',error.message);}}
    async function showTopic(node){
      const current=++topicRequest;panelTitle(node.data?.label||'Topic');text(panel,'p','Loading topic details…');
      canvas.querySelectorAll('.is-active').forEach(n=>n.classList.remove('is-active'));canvas.querySelector(`[data-node-id="${CSS.escape(node.id)}"]`)?.classList.add('is-active');
      panel.scrollIntoView({behavior:'smooth',block:'nearest'});
      try{const data=await api().request('GET',`/api/v1/roadmaps/content/topic?slug=${encodeURIComponent(slug)}&nodeId=${encodeURIComponent(node.id)}`);if(current!==topicRequest)return;
        panelTitle(node.data?.label||'Topic');markdown(panel,data.description||'The source has not supplied an explanation for this topic yet.');
        const resources=Array.isArray(data.resources)?data.resources:[];
        if(resources.length){text(panel,'h4','Learning resources');text(panel,'p','Topic explanations stay here. Optional third-party lessons open their provider’s website.');const ul=text(panel,'ul','');for(const resource of resources){const li=text(ul,'li','');resourceLink(li,resource.title||'Learning resource',resource.url);}}
      }catch(error){if(current===topicRequest){panelTitle(node.data?.label||'Topic');text(panel,'p',error.message);}}
    }
    function number(value,fallback){return Number.isFinite(Number(value))?Math.max(-100000,Math.min(100000,Number(value))):fallback;}
    function draw(){
      canvas.replaceChildren();list.replaceChildren();
      nodes=graph.nodes.filter(n=>n.id&&n.position&&n.type!=='legend'&&n.type!=='linksgroup');
      const xMin=Math.min(...nodes.map(n=>number(n.position.x,0)))-28,yMin=Math.min(...nodes.map(n=>number(n.position.y,0)))-28;
      const boxes=new Map();
      for(const node of nodes){const w=Math.max(10,number(node.measured?.width??node.width,180)),h=Math.max(10,number(node.measured?.height??node.height,48));boxes.set(node.id,{x:number(node.position.x,0)-xMin,y:number(node.position.y,0)-yMin,w,h});}
      width=Math.max(...[...boxes.values()].map(b=>b.x+b.w))+28;height=Math.max(...[...boxes.values()].map(b=>b.y+b.h))+28;
      canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('rv-edges');svg.setAttribute('width',width);svg.setAttribute('height',height);canvas.appendChild(svg);
      const point=(box,handle)=>handle?.startsWith('w')?[box.x+box.w/2,box.y]:handle?.startsWith('x')?[box.x+box.w/2,box.y+box.h]:handle?.startsWith('y')?[box.x,box.y+box.h/2]:[box.x+box.w,box.y+box.h/2];
      for(const edge of graph.edges||[]){const from=boxes.get(edge.source),to=boxes.get(edge.target);if(!from||!to)continue;const [x1,y1]=point(from,edge.sourceHandle),[x2,y2]=point(to,edge.targetHandle);const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`);path.setAttribute('fill','none');path.setAttribute('stroke','#3478dc');path.setAttribute('stroke-width','3');if(edge.data?.edgeStyle==='dashed'||edge.style?.strokeDasharray!=='0')path.setAttribute('stroke-dasharray','3 7');svg.appendChild(path);}
      for(const node of nodes){const box=boxes.get(node.id);if(['vertical','horizontal'].includes(node.type)){const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1',box.x+box.w/2);line.setAttribute('x2',node.type==='horizontal'?box.x+box.w:box.x+box.w/2);line.setAttribute('y1',node.type==='horizontal'?box.y+box.h/2:box.y);line.setAttribute('y2',box.y+box.h/2+(node.type==='vertical'?box.h/2:0));line.setAttribute('stroke','#3478dc');line.setAttribute('stroke-width','3');line.setAttribute('stroke-dasharray','3 7');svg.appendChild(line);continue;}
        const clickable=['topic','subtopic','button'].includes(node.type);const element=text(canvas,clickable?'button':'div',node.data?.label||'','rv-node');element.dataset.type=node.type;element.dataset.nodeId=node.id;if(clickable)element.type='button';Object.assign(element.style,{left:`${box.x}px`,top:`${box.y}px`,width:`${box.w}px`,height:`${box.h}px`});
        if(['topic','subtopic'].includes(node.type)){element.onclick=()=>showTopic(node);const item=text(list,'button',node.data?.label||'Topic');item.type='button';item.dataset.type=node.type;item.onclick=()=>showTopic(node);}
        else if(node.type==='button'){const next=slugFromUrl(node.data?.href);element.onclick=()=>{if(next)load(next);else{panelTitle(node.data?.label||'Roadmap');text(panel,'p','This source link is not a roadmap path.');}};}
      }
      const sourceTitle=typeof graph.title==='string'?graph.title:graph.title?.page||graph.title?.card||graph.title?.en||select.selectedOptions[0]?.textContent||slug;
      fit();status.textContent=`${sourceTitle} · ${nodes.filter(n=>['topic','subtopic'].includes(n.type)).length} topics · Click a topic to read inside SAMVED.`;
    }
    async function load(next){slug=next;container.dispatchEvent(new CustomEvent('samved-roadmap-change',{detail:{slug:next}}));const current=++request;topicRequest++;panel.hidden=true;status.textContent='Loading the full roadmap…';canvas.replaceChildren();list.replaceChildren();search.value='';
      if(![...select.options].some(o=>o.value===next)){const option=text(select,'option',next);option.value=next;}select.value=next;
      try{graph=await api().request('GET',`/api/v1/roadmaps/content?slug=${encodeURIComponent(next)}`);if(current!==request)return;draw();}
      catch(error){if(current===request){status.textContent=error.message;const retry=text(listMode?list:canvas,'button','Retry loading');retry.type='button';retry.onclick=()=>load(next);}}
    }
    search.oninput=()=>{showList(true);const term=search.value.trim().toLowerCase();for(const item of list.children)item.hidden=!item.textContent.toLowerCase().includes(term);};
    select.onchange=()=>load(select.value);showList(false);load(slug);
    return {load,getSlug:()=>slug};
  }
  window.SamvedRoadmapViewer={mount,localLink,slugFromUrl};
})();
