// ─────────────────────────────────────────────────────────
// CraveClubs — k6 Load Test Configuration
// ─────────────────────────────────────────────────────────
// Environment variables (pass via -e flag or export):
//   BASE_URL     — API base URL (default: http://localhost:8000/api/v1)
//   CLUB_TOKEN   — Bearer token for CLUB_MANAGER role
//   COACH_TOKEN  — Bearer token for COACH role
//   SWIMMER_TOKEN — Bearer token for SWIMMER role
//   CLUB_SLUG    — Club slug for public endpoints (default: future-academy)
// ─────────────────────────────────────────────────────────

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
export const CLUB_TOKEN = __ENV.CLUB_TOKEN;
export const COACH_TOKEN = __ENV.COACH_TOKEN;
export const SWIMMER_TOKEN = __ENV.SWIMMER_TOKEN;
export const CLUB_SLUG = __ENV.CLUB_SLUG || 'future-academy';
