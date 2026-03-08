import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const getToken = () => localStorage.getItem('crave_club_token');

export const createEcho = () =>
  new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: 'http://localhost:8000/api/v1/broadcasting/auth',
    auth: {
      headers: {
        // CLAUDE.md: token-based auth, no cookies
        Authorization: `Bearer ${getToken()}`,
      },
    },
  });
