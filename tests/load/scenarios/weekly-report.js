// ─────────────────────────────────────────────────────────
// Scenario: Swimmer Weekly Report
// Endpoint: GET /swimmer/weekly-report
// ─────────────────────────────────────────────────────────
// Complex aggregation query: scheduled sessions, attendance,
// evaluations, training plan phase, risk signals. This is the
// heaviest read endpoint per-request. Not cached.
//
// Accessed by swimmers viewing their own report, coaches
// viewing individual swimmers, and managers reviewing all.
// ─────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, SWIMMER_TOKEN } from '../config.js';
import { authHeaders, login } from '../helpers.js';

export const options = {
    stages: [
        { duration: '30s', target: 10 },    // Ramp up
        { duration: '2m', target: 20 },      // Steady at 20 swimmers
        { duration: '30s', target: 0 },      // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],    // 95th percentile < 500ms
        http_req_failed: ['rate<0.01'],      // < 1% failure rate
    },
};

export function setup() {
    // Try swimmer token first, fall back to manager viewing a swimmer
    const swimmerToken = SWIMMER_TOKEN || login('swimmer@futureacademy.com', 'Password123!');
    const managerToken = login('manager@futureacademy.com', 'Password123!');

    return {
        swimmerToken,
        managerToken,
    };
}

export default function (data) {
    // Alternate between swimmer self-view and manager view
    if (data.swimmerToken && __VU % 2 === 0) {
        const res = http.get(`${BASE_URL}/swimmer/weekly-report`, {
            headers: authHeaders(data.swimmerToken),
            tags: { name: 'swimmer_self_report' },
        });

        check(res, {
            'swimmer weekly report returns 200': (r) => r.status === 200,
            'report has week field': (r) => {
                if (r.status !== 200) return false;
                const body = JSON.parse(r.body);
                return body.week !== undefined;
            },
        });
    } else if (data.managerToken) {
        // Manager views a swimmer's report (swimmer ID 1 as baseline)
        const res = http.get(`${BASE_URL}/club/swimmers/1/weekly-report`, {
            headers: authHeaders(data.managerToken),
            tags: { name: 'manager_swimmer_report' },
        });

        check(res, {
            'manager weekly report returns 200 or 404': (r) => r.status === 200 || r.status === 404,
        });
    }

    sleep(2); // Users don't refresh reports frequently
}
