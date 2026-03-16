# CraveClubs — Scaling Guide

## Overview

This guide covers horizontal and vertical scaling strategies for CraveClubs as the platform grows from a handful of clubs to 10+ and beyond.

The app is designed to be **fully stateless** — no user data on local disk, all shared state in MySQL + Redis. You can add more Railway instances with zero code changes.

## Stateless Architecture Audit

### What Makes It Stateless

| Concern | Solution | Notes |
|---------|----------|-------|
| **User file uploads** | S3 (via `Storage::disk('s3')`) | Branding assets use content-hash filenames for CDN |
| **Cache** | Redis (`CACHE_STORE=redis`) | Shared across all instances; all keys scoped by `club_id` or `slug` |
| **Queue** | Redis (`QUEUE_CONNECTION=redis`) | Workers on any instance process the same queue |
| **Sessions** | Token-based (Sanctum) | No server-side sessions — tokens in `personal_access_tokens` table |
| **Broadcasting** | Laravel Reverb (dedicated process) | Single Reverb instance handles all WebSocket connections |
| **Logs** | Local files (non-critical) | Each instance writes its own logs; use `LOG_CHANNEL=stderr` for centralized logging in production |

### Local Disk Usage (Safe)

These local writes are non-critical and do not affect statelessness:

- **Application logs** (`storage/logs/`) — each instance writes independently; no cross-instance dependency
- **Business report log** (`storage/logs/business_report.log`) — weekly scheduled command; runs on scheduler instance only
- **Audit log** (`storage/logs/audit.log`) — append-only; use centralized logging (stderr/Papertrail) in multi-instance setups
- **Seeder log** (`storage/logs/seeder.log`) — one-time dev operation only

**No user-facing data** is stored on local disk. `Storage::disk('local')` is only used by Laravel framework internals.

### Cache Key Scoping

All 25 cache calls are properly scoped to prevent cross-tenant collisions:

| Pattern | Scope | Count |
|---------|-------|-------|
| `branding_{slug}` | Club slug | 5 |
| `analytics_{type}_{clubId}` | Club ID | 8 |
| `dashboard_metrics_{clubId}` | Club ID | 3 |
| `club_features_{clubId}` | Club ID | 2 |
| `swimmer_xp:{clubId}:{swimmerId}` | Club + Swimmer | 2 |
| `login_attempts_{ip}` | IP address (rate limiting) | 3 |
| `analytics_full_{clubId}` | Club ID | 2 |

## Health Endpoint — Config Section

`GET /api/v1/health` now includes a `config` section for verifying stateless drivers:

```json
{
    "status": "healthy",
    "checks": { "..." },
    "config": {
        "cache_driver": "redis",
        "queue_driver": "redis",
        "session_driver": "database",
        "broadcast_driver": "reverb"
    },
    "timestamp": "2026-03-17T..."
}
```

**Pre-scale checklist** — verify these values before adding instances:
- `cache_driver` = `redis` (NOT `file` or `array`)
- `queue_driver` = `redis` (NOT `database` or `sync`)
- `broadcast_driver` = `reverb` (for real-time features)
- `session_driver` = `database` or `cookie` (NOT `file`)

## MySQL Read Replicas

### When to Add a Read Replica

Add a read replica when any of these conditions persist:

| Signal | Threshold | How to Check |
|--------|-----------|-------------|
| DB CPU consistently high | > 70% for 15+ minutes | Railway metrics dashboard |
| Dashboard queries slow | > 300ms p95 | `X-Response-Time` header, SLOW_REQUEST logs |
| Analytics queries blocking writes | Write latency spikes during report generation | Slow query log correlation |
| Coach/swimmer report timeouts | > 1s p95 on `/swimmer/weekly-report` | Load test baselines |

### How It Works

Laravel's read/write split routes queries automatically:
- **SELECT** queries → read replica (via `DB_READ_HOST`)
- **INSERT/UPDATE/DELETE** → primary (via `DB_HOST`)
- **sticky: true** → after a write, subsequent reads in the same request go to primary (prevents stale reads)

### Configuration

```env
# Primary (writes)
DB_HOST=primary-mysql.railway.app

# Replica (reads) — leave empty to use primary for both
DB_READ_HOST=replica-mysql.railway.app
```

When `DB_READ_HOST` is empty or not set, both read and write use `DB_HOST`. No code changes needed — it's purely a config toggle.

### How to Provision on Railway

1. **Railway MySQL** supports read replicas on paid tiers
2. Create a new MySQL service as a replica of your primary
3. Copy the replica's connection string
4. Set `DB_READ_HOST` to the replica host
5. Deploy — no code changes required

### Verifying Replica Health

The `/api/v1/health` endpoint includes a `replica` section:

```json
{
    "checks": {
        "replica": {
            "status": "ok",
            "lag_seconds": 0
        }
    }
}
```

- `lag_seconds: 0` — replica is in sync (or no replica configured)
- `lag_seconds: < 30` — status is `ok`
- `lag_seconds: >= 30` — status is `degraded`, investigate

### Which Queries Use the Replica

All Eloquent `SELECT` and `DB::select()` queries automatically use the read connection. The heaviest read queries that benefit most:

| Service | Method | Query Pattern |
|---------|--------|---------------|
| `ClubAnalyticsService` | All 5 methods | Membership growth, retention, attendance trends, funnel, coach performance |
| `SwimmerWeeklyReportService` | `generate()` | Sessions, attendance, evaluations, plan assignments per swimmer |
| `ClubDashboardController` | `dashboard()` | Cached metrics (5min TTL) — replica reduces cold-cache load |
| `CoachPerformanceController` | `index()`, `show()` | Ranked performance, attendance aggregation |

### Monitoring Replica Lag

The `queue:health-check` command and health endpoint both monitor replica status. If lag exceeds 30 seconds:

1. Check Railway replica status
2. Verify network connectivity between primary and replica
3. Check if a large write operation is in progress (bulk import, migration)
4. If persistent, consider upgrading replica instance size

## Connection Pool Sizing

### MySQL max_connections

Railway MySQL default: **150 connections**

Formula for max web instances:
```
max_instances = floor(max_connections / (fpm_workers × 2))
```

The `× 2` accounts for read + write connections per worker.

| FPM Workers | Max Instances | Total Connections |
|-------------|---------------|-------------------|
| 5 | 15 | 150 |
| 10 | 7 | 140 |
| 15 | 5 | 150 |
| 20 | 3 | 120 |

**Recommendation**: Start with 10 FPM workers, scale to 7 instances max. If you need more, increase `max_connections` on MySQL.

### Redis Connection Limits

Railway Redis default: **100 connections**

Each process uses ~2-3 Redis connections (cache, queue, broadcasting). With 4 processes per instance (web, worker, scheduler, reverb):
```
connections_per_instance = 4 processes × 3 connections = 12
max_instances = floor(100 / 12) = 8
```

## WebSocket Architecture (Laravel Reverb)

### Current Design

Laravel Reverb runs as a **dedicated single process** — it cannot be horizontally scaled without a coordination layer (e.g., Redis pub/sub adapter).

```
Procfile:
  web:       php artisan serve ...
  worker:    php artisan queue:work redis ...
  scheduler: php artisan schedule:work
  reverb:    php artisan reverb:start --host=0.0.0.0 --port=${REVERB_PORT:-8080}
```

### How It Works

1. **Web instances** call `broadcast()->toOthers()` which publishes to Redis
2. **Reverb process** subscribes to Redis and pushes events to connected WebSocket clients
3. Clients connect via `wss://` to the Reverb instance (not the web instances)

### Channel Scoping

All private channels are scoped by club:
- `private-club.{club_id}` — CLUB_MANAGER only
- `private-club.{club_id}.coach` — COACH + CLUB_MANAGER

Broadcasting auth: `POST /api/v1/broadcasting/auth` under `auth:sanctum` middleware.

### Scaling WebSockets

| Scale Level | Approach | Connections |
|-------------|----------|-------------|
| **Phase 1** | Single Reverb process | Up to ~10,000 concurrent |
| **Phase 2** | Larger instance (more RAM/CPU) | Up to ~50,000 concurrent |
| **Phase 3** | Replace Reverb with Pusher/Ably | Unlimited (managed service) |

Reverb is sufficient for most club management workloads. A single club rarely has more than 50 concurrent WebSocket connections (coaches + managers viewing real-time updates).

### Configuration

```env
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
REVERB_HOST=0.0.0.0
REVERB_PORT=8080
REVERB_SCHEME=http
```

In production with HTTPS, put Reverb behind a reverse proxy (Railway provides this automatically) and set `REVERB_SCHEME=https`.

## Horizontal Scaling Strategy

### When to Scale

| Signal | Action | How to Detect |
|--------|--------|---------------|
| API p95 > 300ms sustained | Add web instance | `X-Response-Time` headers, load test results |
| Queue backlog > 100 jobs | Add worker instance | `GET /api/v1/health` → `checks.queue.pending_jobs` |
| DB CPU > 70% sustained | Add read replica | Railway metrics dashboard |
| Memory > 80% on web | Scale up instance size | Railway metrics |
| WebSocket disconnects | Scale up Reverb instance | Client reconnect logs |

### Phase 1: Single Instance (1-5 Clubs)

Current setup. One Railway instance running all 4 processes.

```
[Web] → [MySQL] → [Redis]
[Worker] ↗         ↗
[Scheduler] ↗     ↗
[Reverb] ↗        ↗
```

### Phase 2: Separate Worker + Reverb (5-10 Clubs)

Move queue worker and Reverb to their own instances to prevent CPU contention:

```
Instance 1: [Web] + [Scheduler]
Instance 2: [Worker]
Instance 3: [Reverb]
All → [MySQL] + [Redis]
```

### Phase 3: Read Replica (10-20 Clubs)

Add MySQL read replica when analytics queries slow down writes:

```
Instance 1: [Web] + [Scheduler]
Instance 2: [Worker]
Instance 3: [Reverb]
[MySQL Primary] ← writes
[MySQL Replica] ← reads
[Redis]
```

### Phase 4: Multiple Web Instances (20+ Clubs)

Scale web instances horizontally behind a load balancer:

```
Instance 1-N: [Web]
Instance W: [Worker] (can scale to 2-3)
Instance S: [Scheduler] (always 1)
Instance R: [Reverb] (always 1 — or switch to managed Pusher)
[MySQL Primary] + [MySQL Replica]
[Redis]
```

**Important constraints**:
- Only **ONE scheduler** instance should run. Multiple schedulers will duplicate scheduled commands.
- Only **ONE Reverb** instance should run (unless using Redis pub/sub adapter for multi-instance coordination).

## Caching Strategy

### Current Cache Layers

| Cache | TTL | Key Pattern | Busted By |
|-------|-----|-------------|-----------|
| Club branding | 1 hour | `branding_{slug}` | Branding update |
| Analytics (5 types) | 1 hour | `analytics_{type}_{club_id}` | Time-based expiry |
| Dashboard metrics | 5 minutes | `dashboard_metrics_{club_id}` | Time-based / registration |
| Club features | 1 hour | `club_features_{club_id}` | Corporate feature update |
| Swimmer XP | 5 minutes | `swimmer_xp:{club_id}:{swimmer_id}` | XP recalculation |
| Login rate limit | 15 minutes | `login_attempts_{ip}` | Successful login |

### Production Redis Configuration

```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=your-redis.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

Redis is **required** for multi-instance deployments:
- Shared cache prevents duplicate computation across web instances
- Shared queue prevents duplicate job processing
- Broadcasting uses Redis pub/sub for event distribution

## Database Optimization Checklist

Before scaling horizontally, ensure these optimizations are in place:

- [x] Performance indexes (v1, v2, v3) — covering attendance, sessions, evaluations
- [x] N+1 query fixes in ClubAnalyticsService
- [x] N+1 query fixes in SwimmerWeeklyReportService
- [x] Slow query logging (>100ms)
- [x] Response time tracking (>500ms)
- [x] Query caching on analytics endpoints
- [x] CDN for branding assets (content-hash filenames, immutable headers)
- [x] Frontend bundle splitting (vendor + axios chunks)
- [x] Stateless app — no user data on local disk
- [x] All cache keys scoped by club_id/slug
- [ ] Consider partitioning `attendance` table by date (when >1M rows)
- [ ] Consider archiving old sessions (>1 year) to cold storage

## Monitoring During Scale

| Metric | Tool | Alert At |
|--------|------|----------|
| DB CPU | Railway dashboard | > 70% for 15min |
| DB connections | Railway dashboard | > 80% of max_connections |
| Replica lag | `/api/v1/health` | > 30 seconds |
| Queue pending | `/api/v1/health` | > 100 jobs |
| API p95 latency | Load tests / X-Response-Time | > 300ms |
| Error rate | Sentry | > 1% of requests |
| Cache driver | `/api/v1/health` → config | Must be `redis` for multi-instance |
| Queue driver | `/api/v1/health` → config | Must be `redis` for multi-instance |
| WebSocket connections | Reverb logs | > 5,000 concurrent |
