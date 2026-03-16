// ─────────────────────────────────────────────────────────
// Scenario: Notification Polling
// Endpoint: GET /notifications
// ─────────────────────────────────────────────────────────
// This is the highest-frequency endpoint in the system.
// Every logged-in client (manager, coach, swimmer) polls
// notifications every 60 seconds. With 100 concurrent users,
// this generates ~100 req/min steady state.
//
// Must be extremely fast (<100ms p95) since it runs on every
// page and blocks the NotificationBell UI.
// ─────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, CLUB_TOKEN } from '../config.js';
import { authHeaders, login } from '../helpers.js';

export const options = {
    stages: [
        { duration: '30s', target: 50 },    // Ramp up
        { duration: '3m', target: 100 },     // Steady at 100 VUs
        { duration: '30s', target: 0 },      // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<100'],    // 95th percentile < 100ms
        http_req_failed: ['rate<0.005'],     // < 0.5% failure rate
    },
};

export function setup() {
    const token = CLUB_TOKEN || login('manager@futureacademy.com', 'Password123!');
    if (!token) {
        throw new Error('Could not obtain CLUB_TOKEN. Pass via -e CLUB_TOKEN=...');
    }
    return { token };
}

export default function (data) {
    const res = http.get(`${BASE_URL}/notifications`, {
        headers: authHeaders(data.token),
    });

    check(res, {
        'notifications returns 200': (r) => r.status === 200,
        'has unread_count field': (r) => {
            const body = JSON.parse(r.body);
            return body.unread_count !== undefined || body.data !== undefined;
        },
    });

    sleep(1); // Simulate 1-second polling interval (compressed for testing)
}
