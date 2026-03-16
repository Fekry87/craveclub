# CraveClubs — Failover Runbook

## Scenario 1: Primary Database Unreachable

### Detection

- `GET /api/v1/health` returns `"status": "unhealthy"` with `database.status: "error"`
- UptimeRobot alerts within 5 minutes
- Sentry reports `SQLSTATE[HY000]` connection errors

### Step 1: Confirm the Issue

```bash
# SSH into Railway console
railway shell

# Test database connection
php artisan tinker
>>> DB::select('SELECT 1')
```

If this fails: DB is indeed down. Proceed to Step 2.

### Step 2: Promote Read Replica (if configured)

1. In Railway dashboard: go to MySQL service
2. Promote replica to primary
3. Copy the new primary connection string

If no replica is configured, skip to Step 3 and wait for Railway to restore the primary.

### Step 3: Update Environment

```bash
# In Railway dashboard:
# 1. Set DB_HOST to the new primary host
# 2. Clear DB_READ_HOST (or set to empty)
# 3. Trigger redeploy
```

### Step 4: Verify

```bash
# Check health endpoint
curl https://api.craveclubs.com/api/v1/health | jq .

# Expected: database.status = "ok"
# Test a login and basic operation
```

### Step 5: Restore Original Primary (when back online)

1. Set up the restored database as a new read replica
2. Let it catch up (monitor `replica.lag_seconds` in health endpoint)
3. Switch back to original primary at next maintenance window
4. Update `DB_HOST` and `DB_READ_HOST` accordingly

**RTO target: under 10 minutes**
**RPO target: under 5 minutes** (replica lag)

---

## Scenario 2: Redis Unavailable

### Detection

- `GET /api/v1/health` returns `redis.status: "unavailable"`
- Application continues working (graceful degradation) but slower
- Log warnings: "Cache unavailable, using direct query"

### Impact

| Feature | Impact |
|---------|--------|
| Cache | Falls back to direct DB queries (slower, no crash) |
| Queue | Falls back to database queue driver if configured |
| Broadcasting | WebSocket events delayed until Redis returns |
| Rate limiting | May not enforce limits during outage |

### Step 1: Check Redis Status

```bash
railway shell
php artisan tinker
>>> app('redis')->ping()
```

### Step 2: Restart Redis

In Railway dashboard: restart the Redis service.

### Step 3: Verify

```bash
curl https://api.craveclubs.com/api/v1/health | jq .checks.redis
# Expected: status = "ok"
```

### Step 4: Warm Cache

High-traffic endpoints will auto-warm cache on first request. No manual action needed.

---

## Scenario 3: Queue Worker Down

### Detection

- `GET /api/v1/health` returns `queue.pending_jobs` growing steadily
- Push notifications not being delivered
- `queue:health-check` command alerts in Sentry

### Impact

- Push notifications queued but not sent (processed when worker returns)
- SMS notifications delayed
- No data loss — jobs persist in Redis/database

### Step 1: Check Worker Process

```bash
# Railway dashboard → check "worker" process status
# If crashed, check logs for error
railway logs --service worker
```

### Step 2: Restart Worker

In Railway dashboard: restart the worker service.

### Step 3: Process Backlog

```bash
# Check pending jobs count
curl https://api.craveclubs.com/api/v1/health | jq .checks.queue

# If large backlog, consider temporarily scaling to 2 workers
```

### Step 4: Check Failed Jobs

```bash
railway shell
php artisan queue:failed
# Retry specific failed jobs
php artisan queue:retry all
```

---

## Scenario 4: Full Application Down (All Services)

### Detection

- `GET /api/v1/health` times out or returns 5xx
- UptimeRobot alerts on all monitors
- No Railway dashboard access (platform issue)

### Step 1: Check Railway Status

Visit https://status.railway.app/ for platform-wide issues.

### Step 2: If Railway is Down

1. Communicate to users via social channels
2. Wait for Railway to restore services
3. Verify health endpoint when platform returns

### Step 3: If App-Specific

1. Check recent deployments — rollback if a bad deploy caused the issue
2. Check environment variables — ensure nothing was accidentally changed
3. Redeploy the last known good commit

```bash
# Rollback to previous deployment
railway deploy --rollback
```

### Step 4: Post-Recovery

1. Verify `GET /api/v1/health` returns `"status": "healthy"`
2. Check `GET /api/v1/health` → `config` section confirms correct drivers
3. Run a manual test: login, view dashboard, trigger a notification
4. Monitor for 30 minutes for any recurring issues

---

## Scenario 5: Maintenance Mode

### Entering Maintenance Mode

```bash
railway shell
php artisan down --retry=300
```

- All API endpoints return JSON 503: `{"message": "System is under maintenance...", "retry_after": 300}`
- Health endpoint (`/api/v1/health`) continues returning 200 with `"status": "maintenance"`
- Load balancer keeps the instance in rotation

### Exiting Maintenance Mode

```bash
php artisan up
```

- Normal operation resumes immediately
- No cache warming needed — cache entries persist

---

## Contact & Escalation

| Severity | Response Time | Who |
|----------|---------------|-----|
| SEV1 (full outage) | 15 minutes | On-call engineer + CTO |
| SEV2 (degraded) | 30 minutes | On-call engineer |
| SEV3 (minor) | 4 hours | Engineering team |
| SEV4 (cosmetic) | Next business day | Engineering team |

## Post-Incident

After every SEV1/SEV2 incident:
1. Write a blameless post-mortem within 48 hours
2. Identify root cause and contributing factors
3. Create action items with owners and deadlines
4. Share with the team
