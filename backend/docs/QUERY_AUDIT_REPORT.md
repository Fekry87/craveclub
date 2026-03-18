# Query Audit Report

Date: 2026-03-18

## Endpoint Query Counts (Steady State)

| Endpoint | Queries | Slowest (ms) | N+1 Found | Fixed |
|----------|---------|-------------|-----------|-------|
| GET /club/dashboard | 14 | 0.6 | YES | YES |
| GET /club/swimmers | 5 | 0.1 | no | - |
| GET /club/coaches | 4 | 0.1 | no | - |
| GET /club/sessions | 5 | 0.1 | no | - |
| GET /club/analytics | 18 | 0.3 | no | - |
| GET /club/sport-modules | 5 | 0.1 | no | - |
| GET /notifications | 4 | 0.1 | no | - |
| GET /club/registrations | 4 | 0.1 | no | - |
| GET /club/branches | 4 | 0.1 | no | - |
| GET /coach/dashboard | 10 | 0.2 | no | - |
| GET /coach/sessions | 8 | 0.2 | no | - |
| GET /coach/groups | 5 | 0.1 | no | - |
| GET /coach/swimmers | 3 | 0.1 | no | - |

All response times under 65ms with demo data (development server).

## N+1 Fixes Applied

### XpCalculationService::getTopSwimmers()

**Before:** 3 queries per swimmer (evaluations, attendance count, attendance records) = 30+ queries for 10 swimmers.

**After:** 3 batch queries total regardless of swimmer count:
1. `SELECT swimmer_id, rating FROM daily_evaluations WHERE swimmer_id IN (...)`
2. `SELECT swimmer_id, COUNT(*) FROM attendance WHERE swimmer_id IN (...) GROUP BY swimmer_id`
3. `SELECT swimmer_id, present FROM attendance JOIN training_sessions WHERE swimmer_id IN (...)`

**Impact:** Dashboard queries reduced from 48 → 14 (steady state).

## EXPLAIN Results (SQLite)

SQLite uses EXPLAIN QUERY PLAN (not MySQL EXPLAIN). Key findings:

| Query | Index Used | Scan Type | Status |
|-------|-----------|-----------|--------|
| sessions by club_id + date | idx_sessions_club_date_status | SEARCH | OK |
| attendance by session_id + swimmer_id | unique(session_id, swimmer_id) | SEARCH | OK |
| evaluations by session_id + swimmer_id | unique(session_id, swimmer_id) | SEARCH | OK |
| swimmers by club_id | idx_swimmers_club_id | SEARCH | OK |
| coaches by club_id | idx_coaches_club_id | SEARCH | OK |
| groups by club_id | idx_groups_club_id | SEARCH | OK |
| registrations by club_id | idx_registrations_club_id | SEARCH | OK |
| group_memberships by group_id | idx_gm_group_swimmer | SEARCH | OK |

All critical queries use indexes — no full table scans detected.

## Indexes (Already Present)

Three migration passes cover all critical indexes:
- `000045_add_performance_indexes.php` — attendance, sessions, evaluations, memberships
- `000066_add_performance_indexes_v2.php` — notifications, assignments
- `000067_add_performance_indexes_v3.php` — composite indexes for session+present, session+rating, group+date+status

No additional indexes needed.

## Query Count Regression Tests

`tests/Feature/PerformanceTest.php` enforces query count limits:

| Endpoint | Max Queries | N+1 Check |
|----------|------------|-----------|
| Dashboard | 15 | YES |
| Sessions | 8 | YES |
| Analytics | 20 | YES |
| Swimmers | 8 | YES |
| Coaches | 8 | YES |
| Coach Dashboard | 15 | YES |
| Coach Sessions | 10 | YES |
| Notifications | 6 | YES |

## Verdict

**GREEN** — All endpoints under query limits. One N+1 found and fixed (XP calculation). All queries use indexes. No full table scans. Response times under 65ms on development server.
