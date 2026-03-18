-- ============================================================
-- EXPLAIN queries for the 5 most critical endpoints
-- Run against SQLite: sqlite3 database/database.sqlite < database/sql/explain_queries.sql
-- Verify: all show SEARCH (index scan), not SCAN (full table scan)
-- ============================================================

-- 1. Dashboard: upcoming sessions (club_id + date filter + group eager load)
EXPLAIN QUERY PLAN
SELECT * FROM training_sessions
WHERE club_id = 1
  AND date >= '2025-01-01'
ORDER BY date, start_time
LIMIT 5;

-- 2. Dashboard: attendance rate last 7 days (sessions + attendance join)
EXPLAIN QUERY PLAN
SELECT training_sessions.id,
       SUM(CASE WHEN attendance.present = 1 THEN 1 ELSE 0 END) as present_count,
       COUNT(attendance.id) as total_count
FROM training_sessions
LEFT JOIN attendance ON training_sessions.id = attendance.session_id
WHERE training_sessions.club_id = 1
  AND training_sessions.date >= '2025-01-01'
  AND training_sessions.date <= '2025-01-08'
GROUP BY training_sessions.id;

-- 3. Weekly report: session lookup for swimmer (club_id + date range + status)
EXPLAIN QUERY PLAN
SELECT * FROM training_sessions
WHERE club_id = 1
  AND date BETWEEN '2025-01-06' AND '2025-01-12'
  AND status != 'Cancelled';

-- 4. Coach performance summary: sessions + attendance aggregation
EXPLAIN QUERY PLAN
SELECT training_sessions.coach_user_id,
       COUNT(DISTINCT training_sessions.id) as sessions_count,
       SUM(attendance.present) as present_count,
       COUNT(attendance.id) as total_count
FROM training_sessions
JOIN attendance ON training_sessions.id = attendance.session_id
WHERE training_sessions.club_id = 1
  AND training_sessions.status = 'Completed'
  AND training_sessions.date >= '2025-01-01'
GROUP BY training_sessions.coach_user_id;

-- 5. Notification unread count (user_id + read_at IS NULL)
EXPLAIN QUERY PLAN
SELECT COUNT(*) FROM notifications
WHERE user_id = 1
  AND read_at IS NULL;
