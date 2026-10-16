/*
 * Shared sidebar sign-out adapter.
 * Team integration options:
 *   1. Define window.samvedLogoutHandler = () => existingLogoutFunction();
 *   2. Listen for "samved:logout" and call event.preventDefault() when handled.
 */
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.sidebar-logout');
  const status = document.querySelector('.sidebar-logout-status');
  if (!button || !status) return;

  button.addEventListener('click', () => {
    if (typeof window.samvedLogoutHandler === 'function') {
      window.samvedLogoutHandler();
      return;
    }

    const request = new CustomEvent('samved:logout', {
      bubbles: true,
      cancelable: true,
      detail: { source: 'sidebar' }
    });
    const notHandled = document.dispatchEvent(request);
    if (notHandled && !request.defaultPrevented) {
      status.textContent = 'Logout is ready to connect to the shared sign-out handler.';
    }
  });
});
