# CraveClubs — Deployment Guide

## Overview

CraveClubs runs 3 processes simultaneously in production:

| Process | Command | Purpose |
|---------|---------|---------|
| **web** | `php artisan serve --host=0.0.0.0 --port=$PORT` | Serves the Laravel API |
| **worker** | `php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600` | Processes push notifications, SMS, and scheduled jobs |
| **scheduler** | `php artisan schedule:work` | Runs backup, reminders, and health check commands every minute |

## Railway.app Deployment

Railway uses a `Procfile` at the project root to define processes. The file is already configured.

### Required Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `APP_KEY` | `base64:...` | Run `php artisan key:generate --show` |
| `APP_ENV` | `production` | Must be `production` |
| `APP_DEBUG` | `false` | Never enable in production |
| `APP_URL` | `https://api.craveclubs.com` | Full URL of the API |
| `DB_CONNECTION` | `mysql` | Database driver |
| `DB_HOST` | `containers-us-west-123.railway.app` | Railway MySQL host |
| `DB_PORT` | `3306` | Database port |
| `DB_DATABASE` | `craveclubs` | Database name |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | `***` | Database password |
| `REDIS_HOST` | `containers-us-west-456.railway.app` | Railway Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | `***` | Redis password |
| `QUEUE_CONNECTION` | `redis` | Must be `redis` for production |
| `REDIS_QUEUE` | `default` | Queue name in Redis |
| `CACHE_STORE` | `redis` | Use Redis for caching |
| `LOG_CHANNEL` | `json` | Structured JSON logging |
| `LOG_LEVEL` | `warning` | Minimum log level |
| `SENTRY_LARAVEL_DSN` | `https://...@sentry.io/...` | Sentry error tracking DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | 10% performance tracing |

### Railway Services Setup

1. **Backend Service** — connect to this repo, set root directory to `/backend`
2. **MySQL 8.0** — add as Railway plugin, copy connection vars
3. **Redis 7** — add as Railway plugin, copy connection vars

### Post-Deployment Commands

The `migrate:safe` command handles migrations + cache rebuilding automatically:

```bash
php artisan migrate:safe
```

This command:
1. Checks for pending migrations
2. Runs `migrate --force` if any exist
3. Rebuilds `config:cache`, `route:cache`, `view:cache`
4. Logs completion to the daily log channel

For manual cache management:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

To clear caches during troubleshooting:

```bash
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear
```

## Scheduled Commands

| Command | Schedule | Purpose |
|---------|----------|---------|
| `notifications:subscription-reminders` | Daily 09:00 | Alerts managers about expiring subscriptions (14/7/1 day) |
| `notifications:session-reminders` | Daily 08:00 | Notifies swimmers about tomorrow's sessions |
| `queue:health-check` | Every 5 minutes | Monitors queue health, alerts on >5 failures/hour |

## Queue Monitoring

### Health Check Endpoint

```
GET /api/v1/health
```

Returns queue status including:
- `pending_jobs` — number of jobs waiting to be processed
- `failed_last_hour` — number of jobs that failed in the last hour
- `status` — `ok` if pending < 100, `degraded` if pending > 100

### Queue Health Command

```bash
php artisan queue:health-check
```

Outputs summary of pending and failed jobs. If >5 failures in the last hour:
- Logs `QUEUE_HEALTH_DEGRADED` to daily log (critical level)
- Captures warning in Sentry if configured

### Failed Job Management

```bash
# View failed jobs
php artisan queue:failed

# Retry a specific failed job
php artisan queue:retry <uuid>

# Retry all failed jobs
php artisan queue:retry all

# Clear all failed jobs
php artisan queue:flush
```

## Job Retry Configuration

| Job | Tries | Backoff (seconds) | Timeout |
|-----|-------|-------------------|---------|
| SendPushNotification | 3 | 30, 60, 120 | 30s |
| SendGuardianSMSJob | 3 | 60, 120, 240 | 15s |

## Health Check Details

The `/api/v1/health` endpoint performs 4 checks:

1. **Database** — `SELECT 1` with latency measurement
2. **Redis** — set/get/del test key with latency measurement
3. **Queue** — pending job count + failed jobs in last hour
4. **Disk** — free space check (warning if < 500MB)

Response codes:
- `200` — healthy or degraded (DB is ok)
- `503` — unhealthy (DB is down)

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| **CI** (`.github/workflows/ci.yml`) | PR to `main`, push to `main`/`develop` | Backend tests (MySQL + Redis) + Frontend tests |
| **Deploy** (`.github/workflows/deploy.yml`) | Push to `main` only | Backend tests → Frontend tests → Railway deploy → Health check |

### Required GitHub Secrets

| Secret | Where to Get | Description |
|--------|-------------|-------------|
| `RAILWAY_TOKEN` | Railway dashboard → Account Settings → Tokens | API token for Railway CLI deployment |
| `PRODUCTION_URL` | e.g. `https://your-app.railway.app` | Base URL for post-deploy health check verification |

### Deploy Checklist

Before merging to `main`:

- [ ] All tests pass locally (`php artisan test` + `npx vitest run`)
- [ ] No `[BREAKING MIGRATION]` in this deploy (or schedule maintenance window)
- [ ] `API_CHANGELOG.md` updated if API endpoints changed
- [ ] Environment variables added to Railway if new ones are needed

### Breaking Migrations

For migrations that require downtime (column renames, type changes, dropped tables):

1. Tag commit message with `[BREAKING MIGRATION]`
2. Schedule a maintenance window
3. Manually run `php artisan down` on Railway before deploy
4. Deploy and run `php artisan migrate:safe`
5. Run `php artisan up` to restore service

### CI Environment

The CI pipeline uses `backend/.env.ci` with:
- MySQL 8.0 service container (matches production)
- Redis 7 service container (matches production)
- `QUEUE_CONNECTION=sync` (no async processing in tests)
- DemoSeeder for realistic test data

## Docker Deployment (Alternative)

See `docker-compose.yml` in the project root and `backend/Dockerfile` for container-based deployment.

```bash
docker compose up -d
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan config:cache
```
