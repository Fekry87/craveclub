// ─────────────────────────────────────────────────────────
// Scenario: Health Check
// Endpoint: GET /health
// ─────────────────────────────────────────────────────────
// Uptime monitors hit this every 30-60 seconds. Must be
// consistently fast. No auth required.
// ─────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../config.js';

export const options = {
    stages: [
        { duration: '15s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '15s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<200'],    // 95th percentile < 200ms
        http_req_failed: ['rate<0.001'],     // < 0.1% failure rate
    },
};

export default function () {
    const res = http.get(`${BASE_URL}/health`, {
        headers: { Accept: 'application/json' },
    });

    check(res, {
        'health returns 200': (r) => r.status === 200,
        'status is healthy': (r) => JSON.parse(r.body).status === 'healthy',
        'has database check': (r) => JSON.parse(r.body).checks.database !== undefined,
        'has queue check': (r) => JSON.parse(r.body).checks.queue !== undefined,
    });

    sleep(0.5);
}
