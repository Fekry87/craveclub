import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000/api/v1`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Token scope helpers ────────────────────────────────────────────────
// Corporate scope: /login, /corporate/*
// Club scope:      /portal/*, /club/*, /coach/*, /swimmer/*
// This allows BOTH portals to stay logged in simultaneously.

const TOKEN_KEYS = {
  corporate: 'crave_corporate_token',
  club: 'crave_club_token',
};

export function getAuthScope() {
  const path = window.location.pathname;
  if (path === '/login' || path.startsWith('/corporate')) return 'corporate';
  return 'club';
}

export function getStoredToken(scope) {
  return localStorage.getItem(TOKEN_KEYS[scope] || TOKEN_KEYS.club);
}

export function storeToken(scope, token) {
  localStorage.setItem(TOKEN_KEYS[scope] || TOKEN_KEYS.club, token);
}

export function removeToken(scope) {
  localStorage.removeItem(TOKEN_KEYS[scope] || TOKEN_KEYS.club);
}

export function getStoredClubSlug() {
  return localStorage.getItem('crave_club_slug');
}

export function storeClubSlug(slug) {
  localStorage.setItem('crave_club_slug', slug);
}

// ── Request interceptor: attach bearer token ───────────────────────────
api.interceptors.request.use((config) => {
  const scope = getAuthScope();
  const token = getStoredToken(scope);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ───────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const scope = getAuthScope();
      removeToken(scope);
      const path = window.location.pathname;
      // Don't redirect if already on a login page
      if (!path.startsWith('/login') && !path.startsWith('/portal/')) {
        if (scope === 'corporate') {
          window.location.href = '/login';
        } else {
          const slug = getStoredClubSlug();
          window.location.href = slug ? `/portal/${slug}` : '/login';
        }
      }
    }

    if (status === 403) {
      console.error('[API] Forbidden:', error.response?.data?.message || 'Access denied');
    }

    if (status === 429) {
      console.warn('[API] Rate limited — please slow down');
    }

    if (status >= 500) {
      console.error('[API] Server error:', error.response?.data?.message || 'Internal server error');
    }

    return Promise.reject(error);
  }
);

export default api;
