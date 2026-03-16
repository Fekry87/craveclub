// ─────────────────────────────────────────────────────────
// CraveClubs — k6 Load Test Helpers
// ─────────────────────────────────────────────────────────

import http from 'k6/http';
import { BASE_URL } from './config.js';

/**
 * Generate Authorization + Content-Type headers for authenticated requests.
 */
export function authHeaders(token) {
    return {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
}

/**
 * Generate headers for public endpoints that require X-Club-Slug.
 */
export function clubHeaders(token, slug) {
    return {
        ...authHeaders(token),
        'X-Club-Slug': slug,
    };
}

/**
 * Login and return a bearer token.
 * Use this in setup() to obtain tokens before VUs start.
 */
export function login(email, password) {
    const res = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({ email, password }),
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    );

    if (res.status !== 200) {
        console.error(`Login failed for ${email}: ${res.status} ${res.body}`);
        return null;
    }

    const body = JSON.parse(res.body);
    return body.token;
}

/**
 * Standard check helper — returns true if status matches expected.
 */
export function checkStatus(res, expectedStatus) {
    return res.status === expectedStatus;
}
