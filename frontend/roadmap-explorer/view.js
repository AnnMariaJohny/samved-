SamvedSession.then(profile=>{
  if(!profile)return;
  const slug=new URLSearchParams(location.search).get('slug');
  const container=document.getElementById('source-roadmap');
  if(!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug||'')){container.textContent='Choose a roadmap from Find roadmaps.';return;}
  SamvedRoadmapHub.mount(container,{initialSlug:slug});
});
