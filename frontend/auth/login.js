const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
loginMessage.setAttribute('role', 'status');
loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const button = loginForm.querySelector('button'); button.disabled = true;
  loginMessage.textContent = 'Signing in…';
  try {
    await SamvedApi.request('POST', '/api/v1/auth/login', {
      email: document.getElementById('email').value.trim(), password: document.getElementById('password').value
    });
    SamvedApi.clearCsrf();
    const state = await SamvedApi.request('GET', '/api/v1/students/me/onboarding');
    location.assign(state.ready ? '/dashboard/index.html' : state.sections.find(step => !step.complete).href);
  } catch (error) { loginMessage.textContent = error.message; }
  finally { button.disabled = false; }
});
