# Production Readiness Audit Report

## Date: 2026-03-20
## System: CraveClubs — Multi-Tenant Club Management SaaS
## Auditor: Claude (read-only audit, no changes made)

---

## 1. Deployment Pipeline

### CI (`ci.yml`)
| Item | Status | Notes |
|------|--------|-------|
| PHP 8.2 + MySQL 8.0 + Redis 7 services | ✅ PASS | Health-checked containers |
| Composer install | ✅ PASS | `--prefer-dist --no-progress --no-interaction` |
| `.env.ci` copied | ✅ PASS | Safe CI config, no secrets |
| Key generation | ✅ PASS | `php artisan key:generate` |
| Migrations + seed | ✅ PASS | `--force` + DemoSeeder |
| Backend tests with coverage | ✅ PASS | `--coverage --min=50` (229 tests) |
| Laravel Pint lint | ✅ PASS | `vendor/bin/pint --test` |
| Frontend tests | ✅ PASS | `npx vitest run` (22 tests) |
| Frontend build | ✅ PASS | `npm run build` |

### Deploy (`deploy.yml`)
| Item | Status | Notes |
|------|--------|-------|
| Triggers on push to `main` | ✅ PASS | Correct branch filter |
| Depends on `backend-test` + `frontend-test` | ✅ PASS | Both must pass |
| Railway CLI install | ✅ PASS | `npm install -g @railway/cli` |
| Deploy command | ✅ PASS | `railway up --detach --service web` |
| Post-deploy migrations | ⚠️ WARN | `railway run --service web -- php artisan migrate:safe` with `continue-on-error: true`; timeout observed in prior runs — Railway GraphQL API can be slow |
| Health check | ⚠️ WARN | Conditional on `PRODUCTION_URL` secret; `continue-on-error: true` — will silently pass even if deploy is unhealthy |
| Cache rebuild | ✅ PASS | Procfile web process runs `route:cache` + `view:cache` on start |
| Config cache | ❌ MISSING | Procfile web process does NOT run `php artisan config:cache` — config is read from `.env` on every request |

### Dockerfile
| Item | Status | Notes |
|------|--------|-------|
| PHP 8.2 FPM Alpine | ✅ PASS | Lightweight base |
| Extensions: pdo_mysql, redis, gd, pcntl | ✅ PASS | All required extensions |
| Composer `--no-dev` | ✅ PASS | No dev dependencies in prod |
| Nginx + PHP-FPM | ✅ PASS | Single-container pattern |
| Storage permissions | ✅ PASS | `chmod -R 777 storage bootstrap/cache` |
| Auto-migrate on start | ⚠️ WARN | `start.sh` runs `php artisan migrate --force` — safe (idempotent) but duplicates deploy.yml's migrate:safe step |
| PHP error logging to stderr | ✅ PASS | Visible in Railway logs |

### Procfile
| Item | Status | Notes |
|------|--------|-------|
| web process | ✅ PASS | Nginx + FPM + route/view cache |
| worker process | ✅ PASS | `queue:work redis --sleep=3 --tries=3 --max-time=3600` |
| scheduler process | ✅ PASS | `php artisan schedule:work` |
| reverb process | ⚠️ WARN | Single instance only — cannot horizontally scale without Redis pub/sub adapter |

**Verdict: PASS (with warnings)**

---

## 2. Observability

### Sentry
| Item | Status | Notes |
|------|--------|-------|
| DSN via env var | ✅ PASS | `SENTRY_LARAVEL_DSN` |
| Release tag | ✅ PASS | `RAILWAY_GIT_COMMIT_SHA` auto-injected |
| `send_default_pii: false` | ✅ PASS | No PII leakage |
| Ignored exceptions | ✅ PASS | Auth, Validation, NotFound, Throttle, TokenMismatch filtered |
| Club context tags | ✅ PASS | `club_id` + `request_id` via `AppServiceProvider::boot()` |
| Unhandled exception capture | ✅ PASS | `bootstrap/app.php` Throwable handler calls `app('sentry')->captureException()` |
| User context | ✅ PASS | Set in ClubContext middleware (id, email, club_id) |

### Logging
| Item | Status | Notes |
|------|--------|-------|
| JSON channel | ✅ PASS | RotatingFileHandler + AddRequestContext tap (request_id, club_id, url) |
| Audit channel | ✅ PASS | Daily driver, 90-day retention |
| Default channel | ⚠️ WARN | `.env.example` defaults to `LOG_CHANNEL=stack` (single file); production should use `LOG_CHANNEL=json` — ensure Railway env var is set |
| Slow query logging | ✅ PASS | DB::listen >100ms → daily log + Redis counter |
| Response time tracking | ✅ PASS | TrackResponseTime middleware, X-Response-Time header, SLOW_REQUEST log >500ms |
| Request ID propagation | ✅ PASS | RequestId middleware on all routes, X-Request-ID header |

### Health & Metrics
| Item | Status | Notes |
|------|--------|-------|
| `/api/v1/health` | ✅ PASS | 5 checks: database, redis, queue, disk, replica |
| Maintenance mode aware | ✅ PASS | Returns `status: maintenance` with 200 during downtime |
| `/api/v1/metrics` | ✅ PASS | Protected by `X-Metrics-Key` header |
| Slow queries metric | ✅ PASS | `performance.slow_queries_last_hour` from Redis |
| Queue health check | ✅ PASS | Scheduled every 5min, alerts on >5 failures/hour |

**Verdict: PASS**

---

## 3. Security & Hardening

### Authentication
| Item | Status | Notes |
|------|--------|-------|
| Token-based (Sanctum) | ✅ PASS | No sessions/cookies |
| `statefulApi()` commented out | ✅ PASS | Confirmed in bootstrap/app.php line 44 |
| Token expiry | ✅ PASS | Web 24h, mobile 30d |
| Login rate limit | ✅ PASS | `throttle:10,1` on auth routes |
| Registration rate limit | ✅ PASS | 5 attempts per phone hash per hour |
| Push token limit | ✅ PASS | Max 5 active devices per user |

### Multi-Tenancy
| Item | Status | Notes |
|------|--------|-------|
| ClubContext middleware | ✅ PASS | `abort(403)` if user has no `club_id` |
| `BelongsToClub` trait | ✅ PASS | Global scope + creating hook |
| Cross-tenant FK validation | ✅ PASS | `Rule::exists()->where('club_id', ...)` pattern |
| `assertOwnership()` pattern | ✅ PASS | First line of every show/update/destroy |
| 8 tests for multi-tenancy | ✅ PASS | `MultiTenancyTest.php` |

### Headers & CORS
| Item | Status | Notes |
|------|--------|-------|
| SecurityHeaders middleware | ✅ PASS | X-Content-Type-Options, X-Frame-Options, CSP, HSTS |
| CORS `supports_credentials: false` | ✅ PASS | No cookies |
| Explicit allowed_methods | ✅ PASS | Not wildcards |
| Explicit allowed_headers | ✅ PASS | Whitelisted headers including X-Sport-Module |
| HSTS | ✅ PASS | Conditional on `$request->secure()` |
| CSP | ⚠️ WARN | `style-src 'unsafe-inline'` is permissive — acceptable for API-only backend but note for future |

### Exception Handling
| Item | Status | Notes |
|------|--------|-------|
| ValidationException → 422 | ✅ PASS | With errors array |
| AuthenticationException → 401 | ✅ PASS | |
| NotFoundHttpException → 404 | ✅ PASS | |
| AccessDeniedHttpException → 403 | ✅ PASS | |
| MethodNotAllowedHttpException → 405 | ✅ PASS | |
| ThrottleRequestsException → 429 | ✅ PASS | With Retry-After header |
| HttpException 503 → JSON | ✅ PASS | Maintenance mode returns JSON |
| Generic Throwable → 500 | ✅ PASS | Hides details in prod, includes request_id |
| APP_DEBUG in production | ❌ CRITICAL | `.env.example` has `APP_DEBUG=true` — MUST ensure Railway env has `APP_DEBUG=false`; if true, stack traces leak to clients |

### Sensitive Data
| Item | Status | Notes |
|------|--------|-------|
| User `$hidden` | ✅ PASS | password, remember_token, email_verified_at |
| Slow query bindings | ✅ PASS | `[redacted]` in production |
| Sentry PII | ✅ PASS | `send_default_pii: false` |

**Verdict: PASS (1 critical env check needed)**

---

## 4. Database & Migrations

### Schema
| Item | Status | Notes |
|------|--------|-------|
| Migration count | ✅ INFO | 67 sequential migrations + 1 Telescope |
| Naming convention | ✅ PASS | Sequential `2024_01_01_000NNN_` format |
| SoftDeletes | ✅ PASS | 8 critical models (Club, User, Coach, Swimmer, Group, Session, Registration, Plan) |
| Performance indexes | ✅ PASS | 3 migration passes (000045, 000066, 000067) |
| Read/write split | ✅ PASS | `DB_READ_HOST` env var, sticky: true |

### SQLite vs MySQL
| Item | Status | Notes |
|------|--------|-------|
| Dev: SQLite | ✅ INFO | Default in `.env.example` |
| Prod: MySQL 8.0 | ✅ INFO | Railway provides MySQL |
| Date function detection | ✅ PASS | `DB::getDriverName()` used to pick strftime vs DATE_FORMAT |
| CI: MySQL 8.0 | ✅ PASS | `.env.ci` uses MySQL for parity |

### Safe Migration
| Item | Status | Notes |
|------|--------|-------|
| `migrate:safe` command | ✅ PASS | Checks pending, runs --force, rebuilds caches |
| Dockerfile auto-migrate | ✅ PASS | Idempotent `migrate --force` in start.sh |
| Deploy pipeline migrate | ✅ PASS | `railway run -- php artisan migrate:safe` |

**Verdict: PASS**

---

## 5. Queue & Jobs

### Configuration
| Item | Status | Notes |
|------|--------|-------|
| Dev: `database` driver | ✅ PASS | SQLite-compatible |
| Prod: `redis` driver | ✅ PASS | Via `QUEUE_CONNECTION=redis` env var |
| Worker: Procfile | ✅ PASS | `queue:work redis --sleep=3 --tries=3 --max-time=3600` |
| Failed jobs table | ✅ PASS | Migration 000018 |

### Jobs
| Job | Tries | Backoff | Timeout | Notes |
|-----|-------|---------|---------|-------|
| SendPushNotification | 3 | 30/60/120s | 30s | ✅ Expo Push API, re-throws for retry |
| SendGuardianSMSJob | 3 | 60/120/240s | 15s | ⚠️ Logs only — no actual SMS provider integrated (placeholder) |

### Scheduled Commands
| Command | Schedule | Notes |
|---------|----------|-------|
| `notifications:subscription-reminders` | Daily 09:00 | ✅ Idempotent |
| `notifications:session-reminders` | Daily 08:00 | ✅ Idempotent |
| `queue:health-check` | Every 5min | ✅ Alerts on >5 failures/hour |
| `report:business` | Weekly Mon 08:00 | ✅ Business metrics |

### Queue Monitoring
| Item | Status | Notes |
|------|--------|-------|
| Health check command | ✅ PASS | `CheckQueueHealth` every 5min |
| Failed jobs in health endpoint | ✅ PASS | `failed_last_hour` in `/api/v1/health` |
| Pending jobs degraded check | ✅ PASS | Status `degraded` if >100 pending |

**Verdict: PASS (SMS job is placeholder only)**

---

## 6. Test Coverage

### Backend (229 tests)
| Suite | Tests | Notes |
|-------|-------|-------|
| MultiTenancyTest | 8 | Cross-tenant isolation |
| AuthorizationTest | 8 | Role enforcement |
| ValidationTest | 8 | Input validation |
| DataExposureTest | 8 | API response filtering |
| BusinessLogicTest | 8 | Workflow integrity |
| RateLimitTest | 8 | Rate limiting |
| InfrastructureTest | 8 | Security headers, CORS, maintenance |
| PerformanceTest | 8 | Query count limits, N+1 detection |
| Other Feature/Unit | ~173 | Remaining tests |

| Item | Status | Notes |
|------|--------|-------|
| Coverage minimum | ✅ PASS | CI enforces `--min=50` (deploy.yml has `--min=50`) |
| PHPUnit config | ✅ PASS | Source includes Controllers, Services, Models |
| Test DB | ✅ PASS | SQLite in-memory (`:memory:`) |
| Queue in tests | ✅ PASS | `QUEUE_CONNECTION=sync` |
| Telescope disabled in tests | ✅ PASS | `TELESCOPE_ENABLED=false` |

### Frontend (22 tests, 5 files)
| Item | Status | Notes |
|------|--------|-------|
| Vitest + jsdom | ✅ PASS | |
| Testing Library | ✅ PASS | `@testing-library/react` + `jest-dom` |
| Build verification | ✅ PASS | CI runs `npm run build` |

### Load Testing
| Item | Status | Notes |
|------|--------|-------|
| k6 test suite | ✅ PASS | Dashboard, notifications, weekly-report scenarios |
| Stress test | ✅ PASS | Ramps to 200 VUs |
| Performance report | ✅ PASS | Verdict GREEN in docs/PERFORMANCE_REPORT.md |

**Verdict: PASS**

---

## 7. Environment Configuration

### Critical Production Env Vars (must be set on Railway)
| Variable | In .env.example | Notes |
|----------|-----------------|-------|
| `APP_ENV=production` | ❌ Default `local` | **MUST set to `production`** |
| `APP_DEBUG=false` | ❌ Default `true` | **CRITICAL: MUST set to `false`** |
| `APP_KEY` | Empty | **MUST generate**: `php artisan key:generate --show` |
| `APP_URL` | `http://localhost` | **MUST set to Railway URL** |
| `DB_CONNECTION=mysql` | Default `sqlite` | **MUST set to `mysql`** |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Commented out | **MUST set for Railway MySQL** |
| `QUEUE_CONNECTION=redis` | Default `database` | **MUST set to `redis`** |
| `CACHE_STORE=redis` | Default `database` | **Should set to `redis`** |
| `LOG_CHANNEL=json` | Default `stack` | **Should set to `json`** |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Defaults | **MUST match Railway Redis** |
| `SENTRY_LARAVEL_DSN` | Empty | **Should set for error tracking** |
| `METRICS_SECRET_KEY` | Empty | **Should set for metrics endpoint** |
| `FRONTEND_URL` | `http://localhost:5173` | **MUST set to production frontend URL** |
| `FRONTEND_URL_ALT` | `http://127.0.0.1:5173` | Can remove or set to same as FRONTEND_URL |
| `BROADCAST_CONNECTION` | `log` | Set to `reverb` for WebSocket support |
| `REVERB_APP_ID/KEY/SECRET` | Defaults | **Change from defaults for security** |

### GitHub Secrets (for deploy.yml)
| Secret | Status | Notes |
|--------|--------|-------|
| `RAILWAY_TOKEN` | ✅ SET | Project-scoped token |
| `PRODUCTION_URL` | ⚠️ MAY NOT BE SET | Required for health check verification; should be `https://web-production-c3c32.up.railway.app` |

**Verdict: MULTIPLE ENV VARS NEED ATTENTION**

---

## 8. Go-Live Checklist

| # | Item | Status | Action Required |
|---|------|--------|-----------------|
| 1 | `APP_ENV=production` on Railway | ❓ VERIFY | Set env var |
| 2 | `APP_DEBUG=false` on Railway | ❓ VERIFY | **CRITICAL** — set env var |
| 3 | `APP_KEY` generated and set | ❓ VERIFY | Generate with `php artisan key:generate --show` |
| 4 | MySQL connection configured | ❓ VERIFY | Railway MySQL service vars |
| 5 | Redis connection configured | ❓ VERIFY | Railway Redis service vars |
| 6 | `QUEUE_CONNECTION=redis` set | ❓ VERIFY | Set env var |
| 7 | `CACHE_STORE=redis` set | ❓ VERIFY | Set env var |
| 8 | `LOG_CHANNEL=json` set | ❓ VERIFY | Set env var |
| 9 | `SENTRY_LARAVEL_DSN` set | ❓ VERIFY | Create Sentry project, get DSN |
| 10 | `METRICS_SECRET_KEY` set | ❓ VERIFY | Generate random string |
| 11 | `FRONTEND_URL` set to prod URL | ❓ VERIFY | Railway frontend URL |
| 12 | `REVERB_APP_ID/KEY/SECRET` changed | ❓ VERIFY | Generate unique values |
| 13 | `PRODUCTION_URL` GitHub secret | ⚠️ MAY NOT BE SET | Add to GitHub repo secrets |
| 14 | Sentry DSN tested | ❓ VERIFY | Trigger test error |
| 15 | Health endpoint responding | ❓ VERIFY | `curl /api/v1/health` |
| 16 | Worker process running | ❓ VERIFY | Check Railway logs for worker |
| 17 | Scheduler process running | ❓ VERIFY | Check Railway logs for scheduler |
| 18 | UptimeRobot configured | ❓ VERIFY | Monitor `/api/v1/health` |
| 19 | S3 configured (if uploads needed) | ❓ VERIFY | `AWS_BUCKET` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` |
| 20 | SMS provider integrated | ❌ NOT DONE | `SendGuardianSMSJob` is placeholder (logs only) |
| 21 | `config:cache` in Procfile | ❌ MISSING | Add `php artisan config:cache` to web process |

---

## 9. Smoke Test Sequence

After deploy, verify these endpoints in order:

```bash
# 1. Health check
curl -s https://YOUR_DOMAIN/api/v1/health | jq .

# 2. Public club data
curl -s https://YOUR_DOMAIN/api/v1/clubs/future-academy | jq .

# 3. Public branding
curl -s https://YOUR_DOMAIN/api/v1/branding/future-academy | jq .

# 4. Login (manager)
curl -s -X POST https://YOUR_DOMAIN/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"manager@futureacademy.com","password":"Password123!"}' | jq .

# 5. Authenticated dashboard (use token from step 4)
curl -s https://YOUR_DOMAIN/api/v1/club/dashboard \
  -H 'Authorization: Bearer TOKEN_HERE' | jq .

# 6. Version check (mobile)
curl -s https://YOUR_DOMAIN/api/v1/app/version-check \
  -H 'X-App-Version: 1.0.0' \
  -H 'X-Platform: ios' | jq .

# 7. Metrics (if METRICS_SECRET_KEY set)
curl -s https://YOUR_DOMAIN/api/v1/metrics \
  -H 'X-Metrics-Key: YOUR_KEY' | jq .
```

---

## 10. Summary Table

| Section | Verdict | Critical Issues | Warnings |
|---------|---------|-----------------|----------|
| 1. Deployment Pipeline | ✅ PASS | 0 | 3 (migration timeout, health check silent fail, missing config:cache) |
| 2. Observability | ✅ PASS | 0 | 1 (default LOG_CHANNEL is `stack` not `json`) |
| 3. Security & Hardening | ⚠️ CONDITIONAL | 1 (APP_DEBUG must be false) | 1 (CSP unsafe-inline) |
| 4. Database & Migrations | ✅ PASS | 0 | 0 |
| 5. Queue & Jobs | ✅ PASS | 0 | 1 (SMS job is placeholder) |
| 6. Test Coverage | ✅ PASS | 0 | 0 |
| 7. Environment Config | ⚠️ ACTION NEEDED | 3 (APP_DEBUG, APP_KEY, DB config) | 5 (Redis, Sentry, logging, metrics, Reverb) |
| 8. Go-Live Checklist | ⚠️ 21 ITEMS | 1 not done (SMS), 1 missing (config:cache) | ~15 need verification |
| 9. Smoke Test | 📋 READY | N/A | N/A |

## Overall Verdict: CONDITIONALLY READY

The codebase is production-quality. Architecture, security patterns, multi-tenancy isolation, observability, and test coverage are all solid. The only blocker category is **environment configuration** — Railway env vars must be properly set before go-live.

### Must-Fix Before Go-Live (blocking)
1. **`APP_DEBUG=false`** on Railway — stack traces leak to clients if true
2. **`APP_KEY`** generated and set on Railway
3. **`DB_CONNECTION=mysql`** + MySQL credentials on Railway
4. **Add `php artisan config:cache`** to Procfile web process (performance)

### Should-Fix Before Go-Live (recommended)
5. Set `QUEUE_CONNECTION=redis`, `CACHE_STORE=redis`, `LOG_CHANNEL=json`
6. Set `SENTRY_LARAVEL_DSN` for error tracking
7. Set `METRICS_SECRET_KEY` for metrics endpoint protection
8. Set `FRONTEND_URL` to actual production frontend URL
9. Change `REVERB_APP_ID/KEY/SECRET` from defaults
10. Add `PRODUCTION_URL` to GitHub Secrets for deploy health check
11. Configure UptimeRobot to monitor `/api/v1/health`

### Not Blocking, But Noted
- `SendGuardianSMSJob` is a placeholder (logs only, no SMS provider)
- Reverb WebSocket is single-instance (cannot horizontally scale without Redis pub/sub)
- CSP allows `style-src 'unsafe-inline'` (acceptable for API backend)
- Duplicate migration: both Dockerfile start.sh and deploy.yml run migrations (harmless, idempotent)
