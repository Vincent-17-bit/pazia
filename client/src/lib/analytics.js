const BASE = import.meta.env.VITE_API_BASE || '/api';

function getGuestId() {
  return localStorage.getItem('pazia:guestId') || 'anonymous';
}

// fire-and-forget: never throws, never blocks the UI
export function track(event, props = {}) {
  try {
    fetch(BASE + '/events', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', 'X-Guest-Id': getGuestId() },
      body: JSON.stringify({ event, ...props }),
    }).catch(() => {});
  } catch {}
}
