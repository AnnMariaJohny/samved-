/* Shared, same-origin API transport for authenticated pages and public discovery. */
(() => {
  // Remove credentials left by the old browser-only login prototype.
  localStorage.removeItem('registeredPassword');
  localStorage.removeItem('loggedIn');
  const unsafe = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  let csrfToken = null;

  async function readJson(response) {
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('The SAMVED API is unavailable. Start the Java server and try again.');
    }
    const body = await response.json();
    if (!response.ok) {
      const fields = body.fieldErrors ? Object.values(body.fieldErrors).join(' ') : '';
      const fallback = response.status === 401
        ? 'Your session has ended. Sign in again to continue.'
        : response.status === 403
          ? 'Access denied. Sign in with the account that owns this data.'
          : `SAMVED API returned HTTP ${response.status}.`;
      const error = new Error([body.message || fallback, fields].filter(Boolean).join(' '));
      error.status = response.status;
      if (body.code === 'ONBOARDING_REQUIRED') {
        error.code = body.code;
        if (typeof body.nextPath === 'string' && /^\/(profile|assessment)\//.test(body.nextPath)) location.replace(body.nextPath);
      }
      throw error;
    }
    return body;
  }

  async function csrf() {
    if (csrfToken) return csrfToken;
    const response = await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' });
    const body = await readJson(response);
    if (!body || typeof body.token !== 'string') throw new Error('The CSRF token is unavailable.');
    csrfToken = body.token;
    return csrfToken;
  }

  async function request(method, path, body) {
    const verb = String(method).toUpperCase();
    if (window.location.protocol === 'file:') {
      throw new Error('Open SAMVED at http://localhost:8080/dashboard/index.html after starting the Java server.');
    }
    if (!path.startsWith('/api/v1/')) throw new Error('Invalid SAMVED API path.');
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (unsafe.has(verb)) headers['X-CSRF-TOKEN'] = await csrf();
    const response = await fetch(path, {
      method: verb,
      credentials: 'same-origin',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (response.status === 403 && unsafe.has(verb)) csrfToken = null;
    return readJson(response);
  }

  window.SamvedApi = { request, clearCsrf: () => { csrfToken = null; } };
})();
