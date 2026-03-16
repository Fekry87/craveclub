// ─────────────────────────────────────────────────────────
// Stress Test: Find Breaking Points
// ─────────────────────────────────────────────────────────
// Ramps VUs from 10 to 200+ to find where the system
// breaks. Hits the most common endpoints in realistic
// proportions:
//   60% — GET /notifications (polled by all users)
//   20% — GET /club/dashboard (manager primary view)
//   10% — GET /coach/sessions (coach primary view)
//   10% — GET /health (monitoring)
//
// Stop condition: when p95 latency exceeds 2000ms, the
// system is at its limit. Record the VU count at that point.
// ─────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, CLUB_TOKEN, COACH_TOKEN } from './config.js';
import { authHeaders, login } from './helpers.js';

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '1m', target: 40 },
        { duration: '1m', target: 60 },
        { duration: '1m', target: 80 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 150 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],   // Fail if p95 > 2s
        http_req_failed: ['rate<0.05'],      // Allow up to 5% errors under stress
    },
};

export function setup() {
    const managerToken = CLUB_TOKEN || login('manager@futureacademy.com', 'Password123!');
    const coachToken = COACH_TOKEN || login('coach@futureacademy.com', 'Password123!');

    return { managerToken, coachToken };
}

export default function (data) {
    const rand = Math.random();

    if (rand < 0.60) {
        // 60% — Notification polling
        if (data.managerToken) {
            const res = http.get(`${BASE_URL}/notifications`, {
                headers: authHeaders(data.managerToken),
                tags: { name: 'stress_notifications' },
            });
            check(res, { 'notifications ok': (r) => r.status === 200 });
        }
    } else if (rand < 0.80) {
        // 20% — Dashboard
        if (data.managerToken) {
            const res = http.get(`${BASE_URL}/club/dashboard`, {
                headers: authHeaders(data.managerToken),
                tags: { name: 'stress_dashboard' },
            });
            check(res, { 'dashboard ok': (r) => r.status === 200 });
        }
    } else if (rand < 0.90) {
        // 10% — Coach sessions
        if (data.coachToken) {
            const res = http.get(`${BASE_URL}/coach/sessions`, {
                headers: authHeaders(data.coachToken),
                tags: { name: 'stress_coach_sessions' },
            });
            check(res, { 'coach sessions ok': (r) => r.status === 200 });
        }
    } else {
        // 10% — Health check (no auth)
        const res = http.get(`${BASE_URL}/health`, {
            headers: { Accept: 'application/json' },
            tags: { name: 'stress_health' },
        });
        check(res, { 'health ok': (r) => r.status === 200 });
    }

    sleep(0.5);
}
