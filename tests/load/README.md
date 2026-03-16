# CraveClubs — k6 Load Tests

Performance and stress tests for the CraveClubs API using [k6](https://k6.io).

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker run --rm -i grafana/k6 run - <script.js

# Verify
k6 version
```

### Seed the Database

```bash
cd backend
php artisan migrate:fresh --seed
php artisan serve --host=0.0.0.0 --port=8000
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BASE_URL` | No | `http://localhost:8000/api/v1` | API base URL |
| `CLUB_TOKEN` | No | Auto-login | Bearer token for CLUB_MANAGER |
| `COACH_TOKEN` | No | Auto-login | Bearer token for COACH |
| `SWIMMER_TOKEN` | No | Auto-login | Bearer token for SWIMMER |
| `CLUB_SLUG` | No | `future-academy` | Club slug for public endpoints |

If tokens are not provided, the tests will auto-login using the demo credentials from the seeder.

## Running Tests

### Individual Scenarios

```bash
# Health check (no auth needed)
k6 run tests/load/scenarios/health.js

# Dashboard (auto-login)
k6 run tests/load/scenarios/dashboard.js

# Session operations (auto-login)
k6 run tests/load/scenarios/session-complete.js

# Notification polling (auto-login)
k6 run tests/load/scenarios/notifications.js

# Weekly report (auto-login)
k6 run tests/load/scenarios/weekly-report.js
```

### With Pre-obtained Tokens (Faster)

```bash
# Get tokens first
CLUB_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"manager@futureacademy.com","password":"Password123!"}' \
  | jq -r '.token')

COACH_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"coach@futureacademy.com","password":"Password123!"}' \
  | jq -r '.token')

# Run with tokens
k6 run -e CLUB_TOKEN=$CLUB_TOKEN tests/load/scenarios/dashboard.js
k6 run -e COACH_TOKEN=$COACH_TOKEN tests/load/scenarios/session-complete.js
```

### Stress Test

```bash
k6 run tests/load/stress.js
```

### Custom Base URL

```bash
k6 run -e BASE_URL=https://api.staging.craveclubs.com/api/v1 tests/load/scenarios/health.js
```

### Output to JSON (for CI)

```bash
k6 run --out json=results/dashboard.json tests/load/scenarios/dashboard.js
```

## Test Scenarios

| Scenario | File | Endpoints | VU Pattern | Target p95 |
|----------|------|-----------|------------|------------|
| **Health** | `scenarios/health.js` | GET /health | 20 VUs steady | <200ms |
| **Dashboard** | `scenarios/dashboard.js` | GET /club/dashboard | 10→50 VUs ramp | <300ms |
| **Sessions** | `scenarios/session-complete.js` | GET /coach/sessions, /sessions/{id} | 10 VUs steady | <1000ms |
| **Notifications** | `scenarios/notifications.js` | GET /notifications | 100 VUs steady | <100ms |
| **Weekly Report** | `scenarios/weekly-report.js` | GET /swimmer/weekly-report | 20 VUs steady | <500ms |
| **Stress** | `stress.js` | Mixed endpoints | 10→200 VUs ramp | <2000ms |

## Interpreting Results

k6 outputs a summary table after each run:

```
http_req_duration.......: avg=45ms  min=12ms  med=38ms  max=234ms  p(90)=89ms  p(95)=120ms
http_req_failed.........: 0.00%    ✓ 0       ✗ 1234
http_reqs...............: 1234     20.56/s
```

Key metrics:
- **p(95)**: 95th percentile latency — the threshold target
- **http_req_failed**: Error rate — should be < 1% for normal scenarios
- **http_reqs**: Total requests and requests/second throughput
- **vus_max**: Peak concurrent virtual users

### Threshold Failures

If a threshold fails, k6 exits with code 99. The failing threshold is shown in red:

```
✗ http_req_duration.......: p(95)=450ms  (threshold: p(95)<300)
```

This means the endpoint is too slow and needs optimization.

## Updating Baselines

After running all scenarios, update `backend/docs/PERFORMANCE_BASELINES.md` with:

1. The p50, p95, p99 latencies from each scenario
2. The max VUs before degradation from the stress test
3. The date of the test run
4. The hardware/environment where tests were run

## File Structure

```
tests/load/
├── config.js                  # Shared configuration (URLs, tokens)
├── helpers.js                 # Auth headers, login, utilities
├── stress.js                  # Stress test (find breaking points)
├── README.md                  # This file
└── scenarios/
    ├── dashboard.js           # Club manager dashboard
    ├── health.js              # Health check endpoint
    ├── notifications.js       # Notification polling
    ├── session-complete.js    # Coach session operations
    └── weekly-report.js       # Swimmer weekly report
```
