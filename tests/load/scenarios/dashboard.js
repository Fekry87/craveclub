// ─────────────────────────────────────────────────────────
// Scenario: Club Manager Dashboard
// Endpoint: GET /club/dashboard
// ─────────────────────────────────────────────────────────
// The dashboard is loaded on every manager login and includes
// swimmer counts, coach counts, upcoming sessions, attendance
// rate, and top swimmers. It's cached for 5 minutes.
// ─────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, CLUB_TOKEN } from '../config.js';
import { authHeaders, login } from '../helpers.js';

export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Ramp up to 10 VUs
        { duration: '2m', target: 10 },     // Steady at 10
        { duration: '1m', target: 50 },     // Ramp up to 50
        { duration: '1m', target: 50 },     // Steady at 50
        { duration: '30s', target: 0 },     // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<300'],    // 95th percentile < 300ms
        http_req_failed: ['rate<0.01'],      // < 1% failure rate
    },
};

export function setup() {
    // Use provided token or login to get one
    const token = CLUB_TOKEN || login('manager@futureacademy.com', 'Password123!');
    if (!token) {
        throw new Error('Could not obtain CLUB_TOKEN. Pass via -e CLUB_TOKEN=... or ensure demo data is seeded.');
    }
    return { token };
}

export default function (data) {
    const res = http.get(`${BASE_URL}/club/dashboard`, {
        headers: authHeaders(data.token),
    });

    check(res, {
        'dashboard returns 200': (r) => r.status === 200,
        'dashboard has swimmers_count': (r) => JSON.parse(r.body).swimmers_count !== undefined,
        'dashboard has upcoming_sessions': (r) => JSON.parse(r.body).upcoming_sessions !== undefined,
    });

    sleep(1); // Simulate user think time
}
