import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE } from '../api/axios';

window.Pusher = Pusher;

const getToken = () => localStorage.getItem('crave_club_token');

const env = import.meta.env;

// Reverb's app key must match the backend's REVERB_APP_KEY exactly. There is no
// sensible default: a wrong or missing key means Reverb closes the socket during the
// handshake and the UI just says "offline" with no explanation. Surface that instead.
export function reverbConfigError() {
  if (!env.VITE_REVERB_APP_KEY || env.VITE_REVERB_APP_KEY === 'your-reverb-key') {
    return 'VITE_REVERB_APP_KEY is missing or still the placeholder. It must match the backend REVERB_APP_KEY.';
  }
  if (!env.VITE_REVERB_HOST) {
    return 'VITE_REVERB_HOST is not set.';
  }
  return null;
}

export const createEcho = () => {
  const scheme = env.VITE_REVERB_SCHEME ?? 'http';
  const secure = scheme === 'https';

  // Default the port to the scheme's standard rather than to 80, so a TLS deployment
  // that omits VITE_REVERB_PORT does not try to speak wss over port 80.
  const port = env.VITE_REVERB_PORT ?? (secure ? 443 : 80);

  return new Echo({
    broadcaster: 'reverb',
    key: env.VITE_REVERB_APP_KEY,
    wsHost: env.VITE_REVERB_HOST,
    wsPort: port,
    wssPort: port,
    forceTLS: secure,
    enabledTransports: ['ws', 'wss'],
    // Derived from the same base axios uses. This was hardcoded to
    // http://localhost:8000, which broke private-channel auth everywhere except a
    // dev machine browsing via "localhost" — production and 127.0.0.1 both failed.
    authEndpoint: `${API_BASE}/broadcasting/auth`,
    auth: {
      headers: {
        // CLAUDE.md: token-based auth, no cookies
        Authorization: `Bearer ${getToken()}`,
      },
    },
  });
};
