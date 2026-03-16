-- ============================================================
-- CraveClubs — EXPLAIN Query Reference
-- ============================================================
-- Run these queries to verify index usage on critical paths.
-- For SQLite: use EXPLAIN QUERY PLAN (not EXPLAIN ANALYZE).
-- For MySQL:  use EXPLAIN or EXPLAIN ANALYZE.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. ATTENDANCE — Session + Present (analytics trend)
-- Expected: Uses att_session_present_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT session_id,
       COUNT(*) as total,
       SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present
FROM attendance
WHERE session_id IN (1, 2, 3, 4, 5)
GROUP BY session_id;

-- ──────────────────────────────────────────────────────────────
-- 2. ATTENDANCE — Swimmer attendance stats (coach detail)
-- Expected: Uses att_session_swimmer_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT swimmer_id,
       COUNT(*) as total,
       SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present
FROM attendance
WHERE session_id IN (1, 2, 3, 4, 5)
  AND swimmer_id IN (1, 2, 3)
GROUP BY swimmer_id;

-- ──────────────────────────────────────────────────────────────
-- 3. TRAINING_SESSIONS — Club date range + status (trend/retention)
-- Expected: Uses ts_club_date_status_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT id, date
FROM training_sessions
WHERE club_id = 1
  AND date BETWEEN '2026-01-01' AND '2026-03-16'
  AND status = 'Completed'
  AND deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. TRAINING_SESSIONS — Group + date + status (coach weekly)
-- Expected: Uses ts_group_date_status_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT id, date
FROM training_sessions
WHERE group_id IN (1, 2, 3)
  AND date BETWEEN '2026-01-01' AND '2026-03-16'
  AND status = 'Completed'
  AND deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 5. DAILY_EVALUATIONS — Rating distribution per session group
-- Expected: Uses eval_session_rating_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT rating, COUNT(*) as cnt
FROM daily_evaluations
WHERE session_id IN (1, 2, 3, 4, 5)
GROUP BY rating;

-- ──────────────────────────────────────────────────────────────
-- 6. DAILY_EVALUATIONS — Top swimmers by avg rating
-- Expected: Uses eval_session_swimmer_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT swimmer_id, AVG(rating) as avg_rating
FROM daily_evaluations
WHERE session_id IN (1, 2, 3, 4, 5)
  AND swimmer_id IN (1, 2, 3)
GROUP BY swimmer_id
ORDER BY avg_rating DESC
LIMIT 5;

-- ──────────────────────────────────────────────────────────────
-- 7. GROUP_MEMBERSHIPS — Swimmer lookup by groups
-- Expected: Uses gm_group_swimmer_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT DISTINCT swimmer_id
FROM group_memberships
WHERE group_id IN (1, 2, 3);

-- ──────────────────────────────────────────────────────────────
-- 8. SWIMMER_PROFILES — Club growth analytics
-- Expected: Uses sp_club_created_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as new_count
FROM swimmer_profiles
WHERE club_id = 1
  AND created_at >= '2025-09-01'
  AND deleted_at IS NULL
GROUP BY month
ORDER BY month;

-- ──────────────────────────────────────────────────────────────
-- 9. REGISTRATIONS — Funnel (club + status + date)
-- Expected: Uses registrations_club_id_status_index
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT status, COUNT(*) as cnt
FROM registrations
WHERE club_id = 1
  AND created_at >= '2026-02-14'
  AND deleted_at IS NULL
GROUP BY status;

-- ──────────────────────────────────────────────────────────────
-- 10. NOTIFICATIONS — User inbox (unread first)
-- Expected: Uses notif_user_read_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT *
FROM notifications
WHERE user_id = 1
  AND read_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ──────────────────────────────────────────────────────────────
-- 11. TRAINING_PLAN_ASSIGNMENTS — Active plan for swimmer
-- Expected: Uses tpa_club_swimmer_status_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT *
FROM training_plan_assignments
WHERE club_id = 1
  AND swimmer_profile_id = 5
  AND status = 'active'
  AND start_date <= '2026-03-16'
  AND end_date >= '2026-03-16'
ORDER BY created_at DESC
LIMIT 1;

-- ──────────────────────────────────────────────────────────────
-- 12. GROUPS — Coach groups with sport module
-- Expected: Uses grp_club_coach_idx or grp_club_sport_idx
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT id, coach_user_id
FROM groups
WHERE club_id = 1
  AND coach_user_id IN (1, 2, 3)
  AND deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 13. RETENTION — Attendance join for active swimmer detection
-- Expected: Uses att_session_present_idx + training_sessions PK
-- ──────────────────────────────────────────────────────────────
EXPLAIN QUERY PLAN
SELECT attendance.swimmer_id, training_sessions.date
FROM attendance
JOIN training_sessions ON attendance.session_id = training_sessions.id
WHERE attendance.present = 1
  AND training_sessions.club_id = 1
  AND training_sessions.date >= '2026-01-15';
