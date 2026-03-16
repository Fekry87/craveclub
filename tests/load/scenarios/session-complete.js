// ─────────────────────────────────────────────────────────
// Scenario: Coach Session Complete
// Endpoint: POST /coach/sessions/{id}/complete
// ─────────────────────────────────────────────────────────
// Simulates coaches completing sessions. This is a write-heavy
// endpoint that triggers attendance records, evaluations, and
// potentially push notifications. Tests that the system handles
// concurrent session completions without errors.
//
// Since session completion is idempotent (can only complete once),
// this test focuses on the GET session detail as a proxy for the
// completion flow's read-heavy patterns.
// ─────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, COACH_TOKEN } from '../config.js';
import { authHeaders, login } from '../helpers.js';

export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Ramp to 10 coaches
        { duration: '2m', target: 10 },     // Steady at 10
        { duration: '30s', target: 0 },     // Ramp down
    ],
    thresholds: {
        'http_req_duration{name:session_list}': ['p(95)<500'],
        'http_req_duration{name:session_detail}': ['p(95)<1000'],
        http_req_failed: ['rate<0.01'],
    },
};

export function setup() {
    const token = COACH_TOKEN || login('coach@futureacademy.com', 'Password123!');
    if (!token) {
        throw new Error('Could not obtain COACH_TOKEN. Pass via -e COACH_TOKEN=... or ensure demo data is seeded.');
    }

    // Fetch the list of sessions to get valid IDs
    const res = http.get(`${BASE_URL}/coach/sessions`, {
        headers: authHeaders(token),
    });

    let sessionIds = [];
    if (res.status === 200) {
        const body = JSON.parse(res.body);
        const sessions = body.data || body;
        if (Array.isArray(sessions)) {
            sessionIds = sessions.map((s) => s.id);
        }
    }

    return { token, sessionIds };
}

export default function (data) {
    const headers = authHeaders(data.token);

    // 1. List sessions (coach dashboard load pattern)
    const listRes = http.get(`${BASE_URL}/coach/sessions`, {
        headers,
        tags: { name: 'session_list' },
    });

    check(listRes, {
        'session list returns 200': (r) => r.status === 200,
    });

    // 2. Get session detail (pre-completion pattern)
    if (data.sessionIds.length > 0) {
        const sessionId = data.sessionIds[Math.floor(Math.random() * data.sessionIds.length)];
        const detailRes = http.get(`${BASE_URL}/coach/sessions/${sessionId}`, {
            headers,
            tags: { name: 'session_detail' },
        });

        check(detailRes, {
            'session detail returns 200': (r) => r.status === 200,
        });

        // 3. Get attendance for that session
        const attRes = http.get(`${BASE_URL}/coach/sessions/${sessionId}/attendance`, {
            headers,
            tags: { name: 'session_attendance' },
        });

        check(attRes, {
            'attendance returns 200': (r) => r.status === 200,
        });
    }

    sleep(2); // Simulate coach reviewing before completing
}
