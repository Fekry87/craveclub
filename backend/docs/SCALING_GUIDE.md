# CraveClubs — Scaling Guide

## Overview

This guide covers horizontal and vertical scaling strategies for CraveClubs as the platform grows from a handful of clubs to 10+ and beyond.

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

Each process uses ~2-3 Redis connections (cache, queue, session). With 3 processes per instance (web, worker, scheduler):
```
connections_per_instance = 3 processes × 3 connections = 9
max_instances = floor(100 / 9) = 11
```

## Horizontal Scaling Strategy

### Phase 1: Single Instance (1-5 Clubs)

Current setup. One Railway instance running all 3 processes.

```
[Web] → [MySQL] → [Redis]
[Worker] ↗         ↗
[Scheduler] ↗     ↗
```

### Phase 2: Separate Worker (5-10 Clubs)

Move queue worker to its own instance to prevent CPU contention:

```
Instance 1: [Web] + [Scheduler]
Instance 2: [Worker]
Both → [MySQL] + [Redis]
```

### Phase 3: Read Replica (10-20 Clubs)

Add MySQL read replica when analytics queries slow down writes:

```
Instance 1: [Web] + [Scheduler]
Instance 2: [Worker]
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
[MySQL Primary] + [MySQL Replica]
[Redis]
```

**Important**: Only ONE scheduler instance should run. Multiple schedulers will duplicate scheduled commands.

## Caching Strategy

### Current Cache Layers

| Cache | TTL | Key Pattern | Busted By |
|-------|-----|-------------|-----------|
| Club branding | 1 hour | `branding_{slug}` | Branding update |
| Analytics | 1 hour | `analytics_{club_id}_{method}` | Time-based expiry |
| Dashboard metrics | 5 minutes | Inline in controller | Time-based expiry |
| Coach performance | 1 hour | `coach_perf_{club_id}` | Time-based expiry |

### When to Add Redis Cache

The app already supports Redis cache (`CACHE_STORE=redis` in production). Benefits:
- Shared cache across multiple web instances
- Faster than database cache
- Supports atomic operations and TTL natively

## Database Optimization Checklist

Before scaling horizontally, ensure these optimizations are in place:

- [x] Performance indexes (v1, v2, v3) — covering attendance, sessions, evaluations
- [x] N+1 query fixes in ClubAnalyticsService
- [x] N+1 query fixes in SwimmerWeeklyReportService
- [x] Slow query logging (>100ms)
- [x] Response time tracking (>500ms)
- [x] Query caching on analytics endpoints
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
