const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
registerMessage.setAttribute('role', 'status');
registerForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const value = id => document.getElementById(id).value;
  if (value('password') !== value('confirmPassword')) { registerMessage.textContent = 'Passwords do not match.'; return; }
  const button = registerForm.querySelector('button'); button.disabled = true;
  registerMessage.textContent = 'Creating your account…';
  try {
    await SamvedApi.request('POST', '/api/v1/auth/register', {
      name: value('name').trim(), email: value('email').trim(), password: value('password'),
      cityRegion: value('location').trim(), educationLevel: value('education'),
      adultConfirmed: document.getElementById('adultConfirmed').checked,
      privacyAccepted: document.getElementById('privacyAccepted').checked
    });
    registerMessage.textContent = 'Account created. Signing in…';
    await SamvedApi.request('POST', '/api/v1/auth/login', {email: value('email').trim(), password: value('password')});
    SamvedApi.clearCsrf(); location.assign('/profile/profile.html');
  } catch (error) { registerMessage.textContent = error.message + ' If your account was created, use the Login link below.'; }
  finally { button.disabled = false; }
});
