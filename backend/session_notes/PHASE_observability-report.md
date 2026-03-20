# PHASE: Observability Report

**Date:** 2026-03-20
**Status:** COMPLETE

## Summary

All observability infrastructure was already in place. This phase filled 6 remaining gaps.

## What Already Existed (no changes needed)

| Component | Status |
|-----------|--------|
| sentry/sentry-laravel ^4.22 | Installed |
| config/sentry.php | Published with env-based DSN |
| Sentry capture in bootstrap/app.php | Throwable handler captures + sends |
| RequestId middleware | Generates UUID, sets X-Request-ID header |
| AddRequestContext logger tap | JSON formatter + request_id/club_id |
| /health endpoint | 5 checks: database, redis, queue, disk, replica |
| MetricsController | Protected by X-Metrics-Key header |
| Slow query logger (>100ms) | DB::listen in AppServiceProvider |
| .env.example | SENTRY_LARAVEL_DSN, METRICS_SECRET_KEY documented |

## Changes Made

### 1. Sentry config hardened (`config/sentry.php`)
- Added `release` from `RAILWAY_GIT_COMMIT_SHA` env var (Railway auto-injects)
- Added `ignore_exceptions` array: AuthenticationException, AuthorizationException, ValidationException, NotFoundHttpException, TokenMismatchException, ThrottleRequestsException

### 2. Sentry club context (`AppServiceProvider.php`)
- Added `\Sentry\configureScope()` block that tags every event with `club_id` and `request_id`
- Enables filtering Sentry issues by tenant in the Sentry dashboard

### 3. AddRequestContext enriched (`AddRequestContext.php`)
- Added 5 new fields: `url`, `method`, `ip`, `user_id`, `user_agent`
- Every JSON log line now has full request context for debugging

### 4. RequestId accepts incoming header (`RequestId.php`)
- Now respects `X-Request-ID` from client if present, otherwise generates UUID
- Enables end-to-end request tracing from mobile/frontend through backend

### 5. Slow query Redis counter (`AppServiceProvider.php`)
- Added `Cache::store('redis')->increment('slow_queries:YYYY-MM-DD-HH')` on every slow query
- Graceful degradation: Redis unavailable = skip counter, still log

### 6. Metrics exposes slow query count (`MetricsController.php`)
- Added `performance.slow_queries_last_hour` to /metrics response
- Uses `getSlowQueryCount()` private method with Redis try/catch

## Verification

- **Tests:** 229 passed (611 assertions) — same count as before
- **No new dependencies** — all changes use existing packages

## Railway Environment Variables (to set manually)

```
SENTRY_LARAVEL_DSN=          # from sentry.io project settings
SENTRY_TRACES_SAMPLE_RATE=0.1
LOG_CHANNEL=json
LOG_LEVEL=warning
METRICS_SECRET_KEY=          # generate: php artisan tinker --execute="echo Str::random(40);"
```

## Definition of Done

- [x] sentry/sentry-laravel installed and config/sentry.php created
- [x] Sentry DSN loaded from env (not hardcoded)
- [x] AddRequestContext.php injects request_id + club_id + url + method + ip + user_id + user_agent
- [x] RequestId middleware accepts incoming X-Request-ID header, returns it in response
- [x] /health checks database, redis, queue, disk, replica — returns 503 if DB down
- [x] /metrics returns club/user counts + job queue stats + slow query count, protected by token
- [x] Slow query counter added to Redis + exposed in /metrics
- [x] Railway env vars documented in .env.example
- [x] php artisan test passes with 229 tests
