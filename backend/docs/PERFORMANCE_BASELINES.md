# CraveClubs — Performance Baselines

**Test Date:** 2026-03-17
**Environment:** macOS (Apple Silicon), SQLite, PHP 8.2 built-in server, single process
**Data:** Demo seeder (1 club, 2 coaches, 10 swimmers, 2 groups)
**k6 Version:** 1.6.1
**Note:** These baselines reflect a single-server SQLite dev environment. Production (MySQL + Redis + multi-worker) will differ.

## Endpoint Latency Baselines

| Endpoint | Method | p50 | p90 | p95 | p99 | Max | Threshold |
|----------|--------|-----|-----|-----|-----|-----|-----------|
| `/health` | GET | 7.8ms | 9.6ms | 10.5ms | 20ms | 202ms | <200ms p95 |
| `/club/dashboard` | GET | 13.3ms | 22.3ms | 32.6ms | 65ms | 71ms | <300ms p95 |
| `/notifications` | GET | 12.9ms | 16.3ms | 17.7ms | 40ms | 49ms | <100ms p95 |
| `/coach/sessions` | GET | 16.6ms | 19.6ms | 19.7ms | — | 20ms | <500ms p95 |
| `/coach/sessions/{id}` | GET | 16.6ms | 18.2ms | 18.4ms | — | 19ms | <1000ms p95 |
| `/swimmer/weekly-report` | GET | 18.0ms | 63.5ms | 143.9ms | — | 257ms | <500ms p95 |

## Concurrent User Baselines

| Endpoint | Max VUs Tested | p95 at Max | Status |
|----------|----------------|------------|--------|
| `/health` (no auth) | 20 | 10.5ms | ✅ Well within limits |
| `/club/dashboard` (1 token) | 1 | 32.6ms | ✅ Rate-limited at 60 req/min per user |
| `/notifications` (1 token) | 1 | 17.7ms | ✅ Rate-limited at 60 req/min per user |
| `/coach/sessions` (1 token) | 1 | 19.7ms | ✅ Rate-limited at 60 req/min per user |

## Stress Test Results

**Configuration:** Mixed traffic (60% notifications, 20% dashboard, 10% coach sessions, 10% health)
**Peak VUs:** 200
**Duration:** 8 minutes (ramping 10 → 200)

| Metric | Value |
|--------|-------|
| Total requests | 37,157 |
| Throughput | 77.4 req/s |
| p50 latency | 329ms |
| p95 latency | 1,230ms |
| Max latency | 2,090ms |
| Health endpoint pass rate | 99.9% |
| Auth endpoint pass rate | ~12% (rate-limited by design) |

**Key Finding:** Rate limiter (`throttle:by_user` at 60 req/min) correctly protects authenticated endpoints. Health endpoint scales to 200 VUs without degradation. Auth endpoints reject excess traffic with 429 responses as expected.

## Rate Limiting Impact

The `by_user` rate limiter is the primary bottleneck under load — by design:
- **60 requests/minute** per authenticated user
- **20 requests/minute** per unauthenticated IP
- **10 requests/minute** on the login endpoint

For realistic multi-user load testing, generate separate tokens per VU or temporarily increase limits.

## Observations

1. **Health endpoint** is the fastest (~8ms median) — no auth overhead, minimal DB queries
2. **Dashboard** is fast (~13ms) because metrics are cached for 5 minutes
3. **Notifications** are fast (~13ms) — simple paginated query with index
4. **Weekly report** has the most variance (18-257ms) — complex aggregation across sessions, attendance, evaluations, and training plans; benefits from P1-01 N+1 fixes
5. **SQLite** serializes writes — production MySQL will handle concurrent writes much better
6. **Single PHP process** — production with PHP-FPM (multiple workers) will scale linearly

## How to Update

After optimization work, re-run baselines:

```bash
# Reset and seed DB
cd backend && php artisan migrate:fresh --seed && php artisan serve &

# Generate tokens
php artisan tinker --execute="echo App\Models\User::where('email','manager@futureacademy.com')->first()->createToken('load')->plainTextToken;"

# Run each scenario
k6 run -e CLUB_TOKEN=<token> tests/load/scenarios/dashboard.js
k6 run -e CLUB_TOKEN=<token> tests/load/scenarios/notifications.js
k6 run -e COACH_TOKEN=<token> tests/load/scenarios/session-complete.js
k6 run -e SWIMMER_TOKEN=<token> tests/load/scenarios/weekly-report.js
k6 run tests/load/scenarios/health.js
k6 run -e CLUB_TOKEN=<token> -e COACH_TOKEN=<token> tests/load/stress.js
```

Update the tables above with new numbers and commit.
