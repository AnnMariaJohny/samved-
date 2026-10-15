/* Every private page confirms the server session before showing account details. */
(() => {
  const api = window.SamvedApi;
  window.logout = async () => {
    try {
      await api.request('POST', '/api/v1/auth/logout');
      api.clearCsrf();
      location.assign('/auth/login.html');
    } catch (error) { alert(`Could not sign out: ${error.message}`); }
  };
  const domReady = document.readyState === 'loading'
    ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}))
    : Promise.resolve();
  window.SamvedSession = Promise.all([api.request('GET', '/api/v1/auth/me'), domReady]).then(async ([profile]) => {
    const checklist = await api.request('GET', '/api/v1/students/me/onboarding');
    if (!checklist.ready && !/^\/(profile|assessment)\//.test(location.pathname)) {
      location.replace(checklist.sections.find(step => !step.complete).href);
      return null;
    }
    const featureLinks = Array.from(document.querySelectorAll('a[href]')).filter(link => {
      const target = new URL(link.href, location.href).pathname;
      return target.endsWith('.html') && !/^\/(profile|assessment|auth)\//.test(target);
    });
    function showAccess(state) {
      for (const link of featureLinks) {
        if (state.ready) {
          link.removeAttribute('aria-disabled');
          link.removeAttribute('title');
        } else {
          link.setAttribute('aria-disabled', 'true');
          link.title = 'Complete your profile and assessment first';
        }
      }
    }
    showAccess(checklist);
    for (const link of featureLinks) link.addEventListener('click', async event => {
      event.preventDefault();
      try {
        const latest = await api.request('GET', '/api/v1/students/me/onboarding');
        location.assign(latest.ready ? link.href : latest.sections.find(step => !step.complete).href);
      } catch (error) { alert(error.message); }
    });
    window.addEventListener('samved-profile-saved', () => {
      api.request('GET', '/api/v1/students/me/onboarding').then(showAccess).catch(() => {});
    });
    for (const id of ['sidebarStudentName', 'headerStudentName', 'sidebar-name', 'header-profile-name']) {
      const node = document.getElementById(id); if (node) node.textContent = profile.name;
    }
    const avatar = document.getElementById('studentAvatar') || document.querySelector('.user-badge .avatar');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (avatar) avatar.textContent = profile.name.charAt(0).toUpperCase();
    if (sidebarAvatar) sidebarAvatar.textContent = profile.name.charAt(0).toUpperCase();
    const goal = document.getElementById('header-goal-text');
    if (goal) goal.textContent = profile.careerGoal.type === 'EXPLORING' ? 'Exploring careers' : profile.careerGoal.text;
    const badge = document.querySelector('.user-badge .avatar + div > div');
    if (badge) badge.textContent = profile.name;
    const nav = document.querySelector('.nav-menu');
    if (nav && !nav.querySelector('[data-logout]')) {
      const li = document.createElement('li'); const button = document.createElement('button');
      button.textContent = 'Sign out'; button.type = 'button'; button.dataset.logout = '';
      button.style.cssText = 'padding:12px;background:transparent;color:inherit;border:0;cursor:pointer;font:inherit';
      button.addEventListener('click', window.logout); li.appendChild(button); nav.appendChild(li);
    }
    return profile;
  }).catch(error => {
    if (error.status === 401) location.replace('/auth/login.html');
    else {
      const note = document.createElement('p'); note.setAttribute('role', 'alert');
      note.textContent = `Could not load your account: ${error.message} Refresh to try again.`;
      document.body.prepend(note);
    }
    return null;
  });
})();
