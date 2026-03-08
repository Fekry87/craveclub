import api, { getStoredClubSlug } from './axios';

// ── Club header helper (for public registration endpoints) ──────
function clubHeaders() {
  const slug = getStoredClubSlug();
  return slug ? { 'X-Club-Slug': slug } : {};
}

// ── Plans ────────────────────────────────────────────────────────
export async function getPlans() {
  const res = await api.get('/subscription-plans', {
    headers: clubHeaders(),
  });
  return res.data ?? [];
}

// ── Coaches ──────────────────────────────────────────────────────
export async function getCoaches(sportId = null) {
  const params = {};
  if (sportId) params.sport_id = sportId;
  const res = await api.get('/coaches', {
    params,
    headers: clubHeaders(),
  });
  return res.data ?? [];
}

// ── Coach Schedule ───────────────────────────────────────────────
export async function getCoachSchedule(coachId) {
  const res = await api.get(`/coaches/${coachId}/schedule`, {
    headers: clubHeaders(),
  });
  return res.data ?? [];
}

// ── Submit Registration ──────────────────────────────────────────
export async function submitRegistration(payload) {
  const res = await api.post('/registrations', payload, {
    headers: clubHeaders(),
  });
  return res.data;
}
