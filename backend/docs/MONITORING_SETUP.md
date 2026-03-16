# CraveClubs — Monitoring Setup

## Overview

Production monitoring uses a combination of health check endpoints, metrics collection, business reports, and external uptime monitoring.

## Uptime Monitoring (UptimeRobot Free Tier)

### Monitor 1: Health Check

| Setting | Value |
|---------|-------|
| URL | `GET https://YOUR_APP/api/v1/health` |
| Type | HTTP(s) |
| Check interval | 5 minutes |
| Alert threshold | 2 consecutive failures |
| Expected status | 200 |
| Alert channels | Email + Slack (if configured) |

The health endpoint checks:
- **Database** — `SELECT 1` with latency
- **Redis** — set/get/del test key
- **Queue** — pending + failed job counts
- **Disk** — free space > 500MB

Returns `200` if database is reachable, `503` if database is down.

### Monitor 2: Metrics Endpoint

| Setting | Value |
|---------|-------|
| URL | `GET https://YOUR_APP/api/v1/metrics` |
| Type | HTTP(s) |
| Check interval | 15 minutes |
| Custom header | `X-Metrics-Key: <your METRICS_SECRET_KEY>` |
| Expected status | 200 |

Returns system and business metrics (club count, user count, queue health).

### Monitor 3: API Response Time (Optional)

| Setting | Value |
|---------|-------|
| URL | `GET https://YOUR_APP/api/v1/health` |
| Type | HTTP(s) - Keyword |
| Check interval | 5 minutes |
| Keyword | `"healthy"` |
| Alert if | Response time > 2000ms for 3 consecutive checks |

## SLA Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | 99.5% | Max 44 minutes downtime per month |
| **API p95 latency** | < 300ms | X-Response-Time header on all responses |
| **Health endpoint** | < 200ms p95 | Verified by load tests |
| **Backup freshness** | < 24 hours | Daily automated backups |
| **Queue processing** | < 5 failures/hour | `queue:health-check` every 5 minutes |

## Incident Response

| Severity | Condition | Response Time | Action |
|----------|-----------|---------------|--------|
| **SEV-1** | Database down, health returns 503 | 15 minutes | Page on-call, check Railway status, verify MySQL |
| **SEV-2** | Error rate > 5%, queue failures > 5/hour | 1 hour | Check Sentry errors, review failed jobs, check Redis |
| **SEV-3** | Slow responses (p95 > 500ms), degraded health | 4 hours | Review slow query logs, check DB connections, scale if needed |

## Response Time Tracking

Every API response includes the `X-Response-Time` header (e.g., `X-Response-Time: 45.23ms`).

Requests taking longer than **500ms** are automatically logged:

```json
{
    "level": "WARNING",
    "message": "SLOW_REQUEST",
    "context": {
        "method": "GET",
        "path": "api/v1/club/dashboard",
        "duration": 523.45,
        "user_id": 1,
        "club_id": 1,
        "request_id": "abc-123-def"
    }
}
```

Additionally, database queries > 100ms are logged by the slow query logger in `AppServiceProvider`.

## Metrics Endpoint

```
GET /api/v1/metrics
Header: X-Metrics-Key: <your-secret-key>
```

Returns:

```json
{
    "timestamp": "2026-03-17T12:00:00Z",
    "app": {
        "version": "v1",
        "environment": "production"
    },
    "database": {
        "total_clubs": 15,
        "total_users": 230,
        "total_sessions": 1500,
        "total_notifications": 8400,
        "pending_jobs": 3,
        "failed_jobs_24h": 0
    },
    "queues": {
        "pending": 3,
        "failed_24h": 0
    }
}
```

Set the `METRICS_SECRET_KEY` environment variable to a long random string.

## Business Reports

Weekly business reports are generated automatically every Monday at 08:00:

```bash
# Manual run
php artisan report:business
```

Report output is logged to `storage/logs/business_report.log` and includes:
- New registrations this week
- Approved registrations this week
- Total active swimmers
- Sessions completed this week
- Average attendance rate
- Notifications sent
- Failed jobs count

## Log Files

| File | Contents | Rotation |
|------|----------|----------|
| `storage/logs/laravel-YYYY-MM-DD.log` | General application logs | Daily, 14-day retention |
| `storage/logs/business_report.log` | Weekly business metrics | Manual cleanup |
| `storage/logs/audit.log` | Audit trail (admin actions) | Daily, 90-day retention |

In production with `LOG_CHANNEL=json`, structured JSON logs are written with request_id, club_id, and environment context.

## Alerting Channels

| Channel | Use Case | Setup |
|---------|----------|-------|
| **Email** | All UptimeRobot alerts | Configure in UptimeRobot dashboard |
| **Slack** | Deploy notifications, SEV-1 alerts | Webhook URL in UptimeRobot |
| **Sentry** | Application errors, queue failures | `SENTRY_LARAVEL_DSN` env var |
| **Logs** | Slow queries, slow requests, audit trail | Built-in, no setup needed |

## CDN Monitoring

### Health Check

Monitor any static branding asset or a known test file on the CDN:

| Setting | Value |
|---------|-------|
| URL | `GET https://cdn.craveclubs.com/file/BUCKET/healthz.txt` |
| Check interval | 15 minutes |
| Alert when | Status != 200 for 2 consecutive checks |

### Fallback

If `CDN_URL` is not set, `Storage::disk('s3')->url()` returns the direct Backblaze B2 URL. Assets will still load, just without Cloudflare edge caching.

### Cache Strategy

- **Branding assets** use content-hash filenames (`logo-a1b2c3d4.png`) with `Cache-Control: public, max-age=31536000, immutable`
- When a club updates their logo, the new file gets a different hash → CDN serves it fresh immediately
- No manual cache purge needed

## Environment Variables for Monitoring

| Variable | Description |
|----------|-------------|
| `METRICS_SECRET_KEY` | Secret key for `/api/v1/metrics` endpoint |
| `CDN_URL` | CDN base URL for branding assets (e.g., `https://cdn.craveclubs.com/file/bucket`) |
| `SENTRY_LARAVEL_DSN` | Sentry error tracking DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance tracing sample rate (0.0 - 1.0) |
| `LOG_CHANNEL` | `json` for production, `stack` for development |
| `LOG_LEVEL` | `warning` for production, `debug` for development |
