# CraveClubs API — Changelog

All notable changes to the CraveClubs API are documented here.

Format: endpoints added/modified/deprecated, with the date and API version.

---

## v1 — Current

### 2026-03-17 — App Versioning

**Added:**
- `GET /api/v1/app/version-check` — Returns API version, minimum client versions, force-update flag, and store URLs. Public endpoint (no auth required).
- `X-App-Version` request header — Clients should send their semver version (e.g., `1.2.3`) on every request.
- `X-Platform` request header — Clients should send their platform (`ios`, `android`, `web`) on every request.
- `X-App-Version-Received` and `X-Platform-Received` response headers echoed back on all responses.
- `config/app_versions.php` — Server-side version configuration (minimum versions, latest version, store URLs).

### 2026-03-17 — Performance & Monitoring

**Added:**
- `GET /api/v1/health` — Enhanced with `failed_last_hour` in queue check, degraded status detection.
- `queue:health-check` artisan command — Monitors queue health every 5 minutes, alerts via Sentry on failures.
- Performance indexes (v3) for attendance, evaluations, training plan assignments, training sessions.
- N+1 query fixes in ClubAnalyticsService and SwimmerWeeklyReportService.

### 2026-03-17 — Load Testing Baselines

**Added:**
- k6 load test suite (`tests/load/`) — Health, dashboard, sessions, notifications, weekly-report, and stress scenarios.
- Performance baselines documented in `backend/docs/PERFORMANCE_BASELINES.md`.

### Previous — White-Label Branding

**Added:**
- `GET /api/v1/branding/{slug}` — Public club branding endpoint (cached 1hr).
- `GET /api/v1/club/branding` — Club manager read own branding.
- `PUT /api/v1/club/branding` — Club manager update own branding.
- `POST /api/v1/club/branding/upload` — Club manager upload branding assets.
- `PUT /api/v1/corporate/clubs/{id}/branding` — Corporate update club branding.
- `POST /api/v1/corporate/clubs/{id}/branding/upload` — Corporate upload club branding assets.

### Previous — Sport Modules

**Added:**
- `GET /api/v1/club/sport-modules` — List club sport modules with stats.
- `GET /api/v1/club/{sportSlug}/groups|sessions|swimmers|coaches|training-plans` — Sport-scoped management endpoints.
- `GET /api/v1/sports` and `GET /api/v1/public/sports` — Public sports listing.

### Previous — Training Engine

**Added:**
- Training plan CRUD with assignments, recurring schedules, session generation.
- `GET /api/v1/swimmer/weekly-report` — Swimmer self-view weekly report.
- `GET /api/v1/coach/swimmers/{id}/weekly-report` — Coach view of swimmer report.
- `GET /api/v1/club/swimmers/{id}/weekly-report` — Manager view with risk signals.

### Previous — Notifications

**Added:**
- `GET /api/v1/notifications` — Paginated notifications with unread count.
- `PUT /api/v1/notifications/{id}/read` — Mark single notification as read.
- `PUT /api/v1/notifications/read-all` — Mark all notifications as read.
- `POST /api/v1/notifications/push-token` — Register Expo/FCM/APNs push token.

### Previous — Analytics & Coach Performance

**Added:**
- `GET /api/v1/club/analytics` — Club analytics (membership growth, retention, attendance trends, funnel).
- `GET /api/v1/club/coaches/performance` — Ranked coach performance list.
- `GET /api/v1/club/coaches/performance/compare` — Compare up to 5 coaches.
- `GET /api/v1/club/coaches/{id}/performance` — Individual coach performance detail.

### Previous — Core API

**Added:**
- Authentication (`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`).
- Club management (dashboard, settings, coaches, swimmers, groups, sessions, branches, sports).
- Subscription plans (CRUD, toggle, reorder).
- Registration wizard (public endpoints with `X-Club-Slug` header).
- Coach portal (dashboard, sessions, attendance, evaluations).
- Swimmer portal (dashboard, sessions, stats, leaderboard).
- Leaderboard management (settings, tiers, overview).

---

## Deprecation Policy

- Deprecated endpoints will include `X-API-Deprecated: true` response header.
- Deprecated endpoints remain functional for at least 90 days after deprecation notice.
- Breaking changes will only be introduced in new API versions (v2, v3, etc.).
