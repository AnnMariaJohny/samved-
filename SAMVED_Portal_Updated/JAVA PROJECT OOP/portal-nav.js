/**
 * SAMVED Portal Shared Navigation & State System
 * Coordinates active links, notifications, profile sync, logout, and mobile navigation
 */
(function() {
  // Global logout handler
  window.portalLogout = function() {
    if (confirm("🚪 Log Out of SAMVED Portal?\n\nAre you sure you want to end your current session?")) {
      try {
        localStorage.removeItem('samved_session_active');
      } catch (e) {}
      window.location.href = '../login.html';
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Determine active menu item based on current URL path
    const path = decodeURIComponent(window.location.pathname.toLowerCase());
    const navLinks = document.querySelectorAll('.portal-nav-link');

    navLinks.forEach(link => {
      const rawHref = link.getAttribute('href') || '';
      const href = decodeURIComponent(rawHref.toLowerCase());

      const isMatch = (
        (path.includes('/dashboard/') && href.includes('/dashboard/')) ||
        (path.includes('/profile/') && !path.includes('academic') && href.includes('/profile/')) ||
        (path.includes('/academic-details/') && href.includes('academic-details')) ||
        (path.includes('/skills/') && href.includes('/skills/')) ||
        (path.includes('/interests/') && href.includes('/interests/')) ||
        (path.includes('/strengths/') && href.includes('/strengths/')) ||
        (path.includes('/values/') && href.includes('/values/')) ||
        (path.includes('/activities/') && href.includes('/activities/')) ||
        (path.includes('/progress') && href.includes('progress')) ||
        (path.includes('/journal/') && href.includes('/journal/')) ||
        (path.includes('/form') && path.includes('assessment') && href.includes('form') && href.includes('assessment')) ||
        (path.includes('/assessment/') && !path.includes('form') && href.includes('/assessment/') && !href.includes('form')) ||
        (path.includes('/career') && href.includes('career') && !path.includes('goal')) ||
        (path.includes('/charts/') && href.includes('/charts/')) ||
        (path.includes('/daily tasks/') && href.includes('daily tasks')) ||
        (path.includes('/planner/') && href.includes('/planner/')) ||
        (path.includes('/deadline') && href.includes('deadline')) ||
        (path.includes('/oppertunity') && href.includes('oppertunity')) ||
        (path.includes('/recommondation') && href.includes('recommondation'))
      );

      if (isMatch) {
        navLinks.forEach(l => {
          l.classList.remove('active');
          if (l.closest('.portal-nav-item')) {
            l.closest('.portal-nav-item').classList.remove('active');
          }
        });
        link.classList.add('active');
        if (link.closest('.portal-nav-item')) {
          link.closest('.portal-nav-item').classList.add('active');
        }
      }
    });

    // Notification bell interactive preview
    const notifBtn = document.querySelector('.portal-notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        const dot = notifBtn.querySelector('.portal-notif-dot');
        if (dot) dot.style.display = 'none';
        alert('🔔 Notifications:\n• CAT 1 Mathematics results published (30/30)\n• Flutter Workshop registration is open!\n• Daily journal reminder: Reflect on today.');
      });
    }

    // Profile menu toggle / dropdown
    const profileBtn = document.querySelector('.portal-user-profile');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        if (confirm('👤 Student: Anugrah\nStatus: Active Student\n\nWould you like to visit your Profile or Log out?\n(Click OK for Profile, Cancel to dismiss)')) {
          window.location.href = '../profile/index.html';
        }
      });
    }

    // Search bar enter listener
    const searchInput = document.querySelector('.portal-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim().toLowerCase();
          if (q.includes('exam') || q.includes('grade') || q.includes('score')) {
            window.location.href = '../assessment/index.html';
          } else if (q.includes('event') || q.includes('hackathon') || q.includes('workshop')) {
            window.location.href = '../activities/index.html';
          } else if (q.includes('write') || q.includes('thought') || q.includes('mood')) {
            window.location.href = '../journal/index.html';
          } else if (q.includes('skill')) {
            window.location.href = '../skills/index.html';
          } else if (q.includes('interest')) {
            window.location.href = '../interests/index.html';
          } else if (q.includes('task')) {
            window.location.href = '../daily%20tasks/index.html';
          } else if (q.includes('deadline')) {
            window.location.href = '../deadline%20system/index.html';
          } else if (q.includes('plan')) {
            window.location.href = '../planner/index.html';
          } else if (q.includes('chart')) {
            window.location.href = '../charts/index.html';
          } else if (q.includes('opp') || q.includes('intern')) {
            window.location.href = '../oppertunity%20page/index.html';
          } else if (q.includes('ai') || q.includes('rec')) {
            window.location.href = '../recommondation%20page/index.html';
          } else {
            alert(`🔍 Searching for: "${searchInput.value}"\nFound matches across Activities, Skills, and Assessments!`);
          }
        }
      });
    }
  });
})();
