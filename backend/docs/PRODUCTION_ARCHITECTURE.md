# CraveClubs — Production Architecture

## System Overview

CraveClubs is a two-tier SaaS platform for club management. The Corporate tier (CraveClubs) manages multiple Club tiers. The application is fully stateless and horizontally scalable.

```
┌─────────────────────────────────────────────────────────┐
│                     Cloudflare CDN                       │
│              DDoS protection + asset caching             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Web 1   │  │  Web 2   │  │  Web N   │  (1-7)       │
│  │ PHP-FPM  │  │ PHP-FPM  │  │ PHP-FPM  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│       └──────────────┼──────────────┘                    │
│                      │                                   │
│       ┌──────────────┼──────────────┐                    │
│       │              │              │                    │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐              │
│  │  Worker  │  │Scheduler │  │  Reverb  │              │
│  │  (1-3)   │  │   (1)    │  │   (1)    │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│       └──────────────┼──────────────┘                    │
│                      │                                   │
│       ┌──────────────┼──────────────┐                    │
│       │                             │                    │
│  ┌────┴─────┐                 ┌────┴─────┐              │
│  │  MySQL   │                 │  Redis   │              │
│  │ Primary  │─── replication ─│  Cache   │              │
│  │ + Replica│                 │  Queue   │              │
│  └──────────┘                 └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Railway Services

| Service | Process | Instances | Scaling |
|---------|---------|-----------|---------|
| **web** | `php artisan serve --host=0.0.0.0 --port=${PORT}` | 1 to 7 | Horizontal (add instances) |
| **worker** | `php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600` | 1 to 3 | Horizontal (add instances) |
| **scheduler** | `php artisan schedule:work` | Exactly 1 | Never scale (duplicates jobs) |
| **reverb** | `php artisan reverb:start --host=0.0.0.0 --port=${REVERB_PORT}` | 1 | Vertical only (more RAM/CPU) |
| **mysql** | MySQL 8.0 | 1 primary + 0-1 replica | Add read replica |
| **redis** | Redis 7 Alpine | 1 | Vertical (more memory) |

## External Services

| Service | Purpose | SLA |
|---------|---------|-----|
| **Backblaze B2** | Object storage (logos, covers, favicons) | 99.9% |
| **Cloudflare** | CDN, DDoS protection, SSL termination | 100% (enterprise) |
| **Sentry** | Error tracking (backend + mobile) | 99.9% |
| **UptimeRobot** | Uptime monitoring (5-minute checks) | 99.9% |
| **Expo Push Service** | Mobile push notifications | 99.9% |

## Data Flow

### API Request Flow

```
Client → Cloudflare → Railway LB → Web Instance → MySQL/Redis → Response
```

1. Client sends HTTPS request with Bearer token
2. Cloudflare terminates SSL, applies WAF rules, serves cached assets
3. Railway load balancer routes to an available web instance
4. PHP-FPM processes request:
   - `RequestId` middleware generates UUID
   - `TrackResponseTime` middleware starts timer
   - `SecurityHeaders` middleware adds CSP/HSTS headers
   - `auth:sanctum` validates Bearer token against `personal_access_tokens` table
   - `ClubContext` middleware sets `app('current_club_id')` from user
   - Controller executes, queries hit Redis cache first, then MySQL
5. Response returns with `X-Request-ID` and `X-Response-Time` headers

### Real-Time Events Flow

```
Web Instance → Redis pub/sub → Reverb → WebSocket → Client
```

1. Controller calls `broadcast()->toOthers()` (outside DB transaction)
2. Event published to Redis pub/sub channel
3. Reverb process receives event from Redis
4. Reverb pushes to connected WebSocket clients on matching private channel

### Push Notification Flow

```
Trigger → NotificationService → Redis Queue → Worker → Expo Push API → Device
```

1. Event triggers notification (absence, registration, subscription expiry)
2. `NotificationService::notify()` creates DB record + dispatches `SendPushNotification` job
3. Job queued to Redis
4. Worker picks up job, batches tokens, sends to Expo Push API
5. Expo delivers to iOS/Android devices

### Asset Upload Flow

```
Manager → Web Instance → Backblaze B2 → Cloudflare CDN → Client
```

1. Manager uploads logo/cover/favicon
2. `ClubBrandingController::handleUpload()` generates content-hash filename
3. File stored to B2 with `Cache-Control: public, max-age=31536000, immutable`
4. URL returned uses CDN prefix (`CDN_URL` env var)
5. Subsequent requests served from Cloudflare edge cache

## Authentication Architecture

```
Mobile/Web Client
    │
    ├─ Corporate scope → crave_corporate_token (localStorage)
    │     └─ POST /api/v1/auth/login → Sanctum createToken('corporate')
    │
    └─ Club scope → crave_club_token (localStorage)
          └─ POST /api/v1/auth/login → Sanctum createToken('club')
```

- Token-based only (Sanctum `createToken()`) — no session cookies
- `statefulApi()` is disabled — do NOT re-enable
- CORS `supports_credentials: false`
- Dual-scope tokens: corporate and club stored separately

## Multi-Tenancy

- Single database with `club_id` column on all tenant-scoped tables
- `ClubContext` middleware extracts `club_id` from authenticated user
- `BelongsToClub` trait applies global scope for automatic filtering
- All cache keys include `club_id` or `slug` — no cross-tenant leakage
- 8 critical models use SoftDeletes for data recovery

## Graceful Degradation

| Component | Failure Mode | Behavior |
|-----------|-------------|----------|
| **Redis cache** | Unavailable | App continues with direct DB queries (slower, no crash) |
| **Redis queue** | Unavailable | Jobs fail to `failed_jobs` table, processed when queue returns |
| **Read replica** | Down | All reads fall back to primary (sticky: true) |
| **Cloudflare CDN** | Down | Requests fall back to B2 origin |
| **Sentry** | Down | Errors logged locally, no external tracking |
| **Expo Push** | Down | Jobs retry 3 times with exponential backoff |

## Maintenance Mode

```bash
php artisan down --retry=300   # Enter maintenance
php artisan up                  # Exit maintenance
```

- All API endpoints return JSON 503: `{"message": "System is under maintenance...", "retry_after": 300}`
- Health endpoint (`/api/v1/health`) stays accessible, returns `"status": "maintenance"` with 200
- Load balancer keeps instance in rotation during maintenance

## Monitoring Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/v1/health` | None | System health (DB, Redis, queue, disk, replica, config) |
| `GET /api/v1/metrics` | `X-Metrics-Key` header | Business + system metrics |
| `GET /api/v1/app/version-check` | None | Mobile force-update check |

## SLA Targets

| Metric | Target |
|--------|--------|
| **Uptime** | 99.5% (≈ 3.65 hours downtime/year) |
| **API p95 latency** | Under 300ms |
| **Push notification delivery** | Under 30 seconds |
| **Backup RPO** | 24 hours |
| **Failover RTO** | Under 10 minutes |
| **Replica lag** | Under 30 seconds |

## Environment Variables (Production)

### Core

| Variable | Example | Required |
|----------|---------|----------|
| `APP_ENV` | `production` | Yes |
| `APP_KEY` | `base64:...` | Yes |
| `APP_URL` | `https://api.craveclubs.com` | Yes |
| `APP_DEBUG` | `false` | Yes |

### Database

| Variable | Example | Required |
|----------|---------|----------|
| `DB_CONNECTION` | `mysql` | Yes |
| `DB_HOST` | `primary-mysql.railway.app` | Yes |
| `DB_READ_HOST` | `replica-mysql.railway.app` | No |
| `DB_PORT` | `3306` | Yes |
| `DB_DATABASE` | `craveclubs` | Yes |
| `DB_USERNAME` | `root` | Yes |
| `DB_PASSWORD` | `***` | Yes |

### Redis

| Variable | Example | Required |
|----------|---------|----------|
| `REDIS_HOST` | `redis.railway.app` | Yes |
| `REDIS_PORT` | `6379` | Yes |
| `REDIS_PASSWORD` | `***` | Yes |
| `CACHE_STORE` | `redis` | Yes |
| `QUEUE_CONNECTION` | `redis` | Yes |

### Storage & CDN

| Variable | Example | Required |
|----------|---------|----------|
| `FILESYSTEM_DISK` | `s3` | Yes |
| `AWS_ACCESS_KEY_ID` | `***` | Yes |
| `AWS_SECRET_ACCESS_KEY` | `***` | Yes |
| `AWS_DEFAULT_REGION` | `us-east-1` | Yes |
| `AWS_BUCKET` | `craveclubs-assets` | Yes |
| `CDN_URL` | `https://cdn.craveclubs.com/file/craveclubs-assets` | No |

### WebSockets

| Variable | Example | Required |
|----------|---------|----------|
| `BROADCAST_CONNECTION` | `reverb` | Yes |
| `REVERB_APP_ID` | `craveclubs` | Yes |
| `REVERB_APP_KEY` | `***` | Yes |
| `REVERB_APP_SECRET` | `***` | Yes |
| `REVERB_HOST` | `0.0.0.0` | Yes |
| `REVERB_PORT` | `8080` | Yes |
| `REVERB_SCHEME` | `https` | Yes |

### Monitoring

| Variable | Example | Required |
|----------|---------|----------|
| `SENTRY_LARAVEL_DSN` | `https://***@sentry.io/***` | Yes |
| `METRICS_SECRET_KEY` | `***` | Yes |
| `LOG_CHANNEL` | `json` | Yes |

## Security

- All responses include: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`
- Rate limiting: 60/min authenticated, 20/min guests, 10/min login
- Brute-force lockout: 5 failed logins → 15-minute IP lockout
- Audit logging on critical operations (registration, deletion, settings changes)
- CORS restricted to specific origins (not wildcards)

## Deployment

```bash
# Automated via GitHub Actions (.github/workflows/deploy.yml)
# 1. Push to main
# 2. CI runs tests (MySQL + Redis services)
# 3. Deploy to Railway
# 4. Run php artisan migrate:safe
# 5. Health check verification
```

See `docs/DEPLOYMENT.md` for detailed deployment instructions.
See `docs/FAILOVER_RUNBOOK.md` for incident response procedures.
See `docs/SCALING_GUIDE.md` for horizontal scaling strategy.
See `docs/MONITORING_SETUP.md` for monitoring configuration.
