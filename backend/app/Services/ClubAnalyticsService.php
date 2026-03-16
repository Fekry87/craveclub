<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\CoachProfile;
use App\Models\DailyEvaluation;
use App\Models\Group;
use App\Models\Registration;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ClubAnalyticsService
{
    public function getMembershipGrowth(int $clubId): array
    {
        return Cache::remember("analytics_growth_{$clubId}", 3600, function () use ($clubId) {
            $sixMonthsAgo = now()->subMonths(5)->startOfMonth();

            $monthlyCounts = SwimmerProfile::where('club_id', $clubId)
                ->where('created_at', '>=', $sixMonthsAgo)
                ->selectRaw("strftime('%Y-%m', created_at) as month, COUNT(*) as new_count")
                ->groupBy('month')
                ->orderBy('month')
                ->pluck('new_count', 'month');

            $totalBefore = SwimmerProfile::where('club_id', $clubId)
                ->where('created_at', '<', $sixMonthsAgo)
                ->count();

            $result = [];
            $runningTotal = $totalBefore;

            for ($i = 5; $i >= 0; $i--) {
                $month = now()->subMonths($i)->format('Y-m');
                $newCount = $monthlyCounts->get($month, 0);
                $runningTotal += $newCount;
                $result[] = [
                    'month' => $month,
                    'new' => $newCount,
                    'total' => $runningTotal,
                ];
            }

            return $result;
        });
    }

    public function getRetentionMetrics(int $clubId): array
    {
        return Cache::remember("analytics_retention_{$clubId}", 3600, function () use ($clubId) {
            $totalSwimmers = SwimmerProfile::where('club_id', $clubId)->count();

            if ($totalSwimmers === 0) {
                return [
                    'retention_rate_30d' => 0,
                    'at_risk_count' => 0,
                    'churned_count' => 0,
                    'avg_attendance_rate' => 0,
                ];
            }

            $sixtyDaysAgo = now()->subDays(60)->toDateString();

            $allClubSwimmerIds = SwimmerProfile::where('club_id', $clubId)->pluck('id');

            // Single query: all club sessions in last 60 days (covers 30d, 21d, and 60d windows)
            $sessions60d = TrainingSession::where('club_id', $clubId)
                ->where('date', '>=', $sixtyDaysAgo)
                ->select('id', 'date')
                ->get();

            $sessionIds60d = $sessions60d->pluck('id');

            // Single query: all attendance with present=true for those sessions
            $presentAttendance = $sessionIds60d->isNotEmpty()
                ? DB::table('attendance')
                    ->whereIn('session_id', $sessionIds60d)
                    ->where('present', true)
                    ->join('training_sessions', 'attendance.session_id', '=', 'training_sessions.id')
                    ->select('attendance.swimmer_id', 'training_sessions.date')
                    ->get()
                : collect();

            // Derive all three time windows from the same dataset
            $thirtyDaysAgo = now()->subDays(30)->toDateString();
            $twentyOneDaysAgo = now()->subDays(21)->toDateString();

            $activeIn30d = $presentAttendance->where('date', '>=', $thirtyDaysAgo)->pluck('swimmer_id')->unique();
            $activeIn21d = $presentAttendance->where('date', '>=', $twentyOneDaysAgo)->pluck('swimmer_id')->unique();
            $activeIn60d = $presentAttendance->pluck('swimmer_id')->unique();

            $retentionRate = round(($activeIn30d->count() / $totalSwimmers) * 100, 1);
            $atRiskCount = $allClubSwimmerIds->diff($activeIn21d)->count();
            $churnedCount = $allClubSwimmerIds->diff($activeIn60d)->count();

            // Average attendance rate last 30 days — single aggregation
            $sessionIds30d = $sessions60d->where('date', '>=', $thirtyDaysAgo)->pluck('id');
            $attStats30d = $sessionIds30d->isNotEmpty()
                ? DB::table('attendance')
                    ->whereIn('session_id', $sessionIds30d)
                    ->selectRaw('COUNT(*) as total, SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present')
                    ->first()
                : (object) ['total' => 0, 'present' => 0];

            $avgAttendanceRate = $attStats30d->total > 0
                ? round(($attStats30d->present / $attStats30d->total) * 100, 1)
                : 0;

            return [
                'retention_rate_30d' => $retentionRate,
                'at_risk_count' => $atRiskCount,
                'churned_count' => $churnedCount,
                'avg_attendance_rate' => $avgAttendanceRate,
            ];
        });
    }

    public function getAttendanceTrend(int $clubId): array
    {
        return Cache::remember("analytics_attendance_trend_{$clubId}", 3600, function () use ($clubId) {
            $eightWeeksAgo = now()->subWeeks(7)->startOfWeek()->toDateString();
            $thisWeekEnd = now()->endOfWeek()->toDateString();

            // Single query: all completed sessions in the 8-week window
            $sessions = TrainingSession::where('club_id', $clubId)
                ->whereBetween('date', [$eightWeeksAgo, $thisWeekEnd])
                ->where('status', 'Completed')
                ->select('id', 'date')
                ->get();

            $allSessionIds = $sessions->pluck('id');

            // Single query: attendance stats grouped by session_id
            $attendanceBySession = $allSessionIds->isNotEmpty()
                ? DB::table('attendance')
                    ->whereIn('session_id', $allSessionIds)
                    ->selectRaw('session_id, COUNT(*) as total, SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present')
                    ->groupBy('session_id')
                    ->get()
                    ->keyBy('session_id')
                : collect();

            // Build weekly buckets from pre-loaded data (zero additional queries)
            $result = [];
            for ($i = 7; $i >= 0; $i--) {
                $weekStart = now()->subWeeks($i)->startOfWeek();
                $weekEnd = now()->subWeeks($i)->endOfWeek();
                $weekLabel = now()->subWeeks($i)->format('Y-\\WW');

                $weekSessions = $sessions->filter(fn ($s) =>
                    $s->date->between($weekStart, $weekEnd)
                );

                $sessionsCount = $weekSessions->count();
                $totalMarks = 0;
                $presentMarks = 0;

                foreach ($weekSessions as $s) {
                    $att = $attendanceBySession->get($s->id);
                    if ($att) {
                        $totalMarks += $att->total;
                        $presentMarks += $att->present;
                    }
                }

                $result[] = [
                    'week' => $weekLabel,
                    'rate' => $totalMarks > 0 ? round(($presentMarks / $totalMarks) * 100, 1) : 0,
                    'sessions' => $sessionsCount,
                    'total_marks' => $totalMarks,
                ];
            }

            return $result;
        });
    }

    public function getRegistrationFunnel(int $clubId): array
    {
        return Cache::remember("analytics_funnel_{$clubId}", 3600, function () use ($clubId) {
            $thirtyDaysAgo = now()->subDays(30);

            $submitted = Registration::where('club_id', $clubId)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();

            $approved = Registration::where('club_id', $clubId)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->where('status', 'approved')
                ->count();

            $rejected = Registration::where('club_id', $clubId)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->where('status', 'cancelled')
                ->count();

            $pending = Registration::where('club_id', $clubId)
                ->where('status', 'pending')
                ->count();

            $decided = $approved + $rejected;

            return [
                'submitted_30d' => $submitted,
                'approved_30d' => $approved,
                'rejected_30d' => $rejected,
                'pending_now' => $pending,
                'approval_rate' => $decided > 0 ? round(($approved / $decided) * 100, 1) : 0,
            ];
        });
    }

    public function getCoachPerformanceSummary(int $clubId): array
    {
        return Cache::remember("analytics_coaches_{$clubId}", 3600, function () use ($clubId) {
            $coaches = CoachProfile::where('club_id', $clubId)
                ->where('is_active', true)
                ->with('user:id,name')
                ->get();

            if ($coaches->isEmpty()) {
                return [];
            }

            $thirtyDaysAgo = now()->subDays(30)->toDateString();
            $coachUserIds = $coaches->pluck('user_id');

            // Pre-load all groups for all coaches in one query
            $allGroups = Group::where('club_id', $clubId)
                ->whereIn('coach_user_id', $coachUserIds)
                ->select('id', 'coach_user_id')
                ->get()
                ->groupBy('coach_user_id');

            $allGroupIds = $allGroups->flatten()->pluck('id');

            // Pre-load all memberships in one query
            $allMemberships = $allGroupIds->isNotEmpty()
                ? DB::table('group_memberships')
                    ->whereIn('group_id', $allGroupIds)
                    ->select('group_id', 'swimmer_id')
                    ->get()
                    ->groupBy('group_id')
                : collect();

            // Pre-load all completed sessions in last 30d grouped by coach
            $allSessions30d = $allGroupIds->isNotEmpty()
                ? TrainingSession::whereIn('group_id', $allGroupIds)
                    ->where('date', '>=', $thirtyDaysAgo)
                    ->where('status', 'Completed')
                    ->select('id', 'group_id')
                    ->get()
                : collect();

            // Map sessions to coach_user_id
            $groupToCoach = $allGroups->flatMap(fn ($groups, $coachId) =>
                $groups->mapWithKeys(fn ($g) => [$g->id => $coachId])
            );

            $sessionsByCoach = $allSessions30d->groupBy(fn ($s) => $groupToCoach->get($s->group_id));
            $allSessionIds = $allSessions30d->pluck('id');

            // Single aggregation query for attendance stats by session
            $attendanceStats = $allSessionIds->isNotEmpty()
                ? DB::table('attendance')
                    ->whereIn('session_id', $allSessionIds)
                    ->selectRaw('session_id, swimmer_id, present')
                    ->get()
                : collect();

            $attendanceBySession = $attendanceStats->groupBy('session_id');

            // Single aggregation for avg rating by session
            $ratingsBySession = $allSessionIds->isNotEmpty()
                ? DB::table('daily_evaluations')
                    ->whereIn('session_id', $allSessionIds)
                    ->selectRaw('session_id, rating')
                    ->get()
                    ->groupBy('session_id')
                : collect();

            return $coaches->map(function ($coach) use ($allGroups, $allMemberships, $sessionsByCoach, $attendanceBySession, $ratingsBySession) {
                $coachGroups = $allGroups->get($coach->user_id, collect());
                $coachGroupIds = $coachGroups->pluck('id');

                // Swimmers count from pre-loaded memberships
                $swimmersCount = $coachGroupIds
                    ->flatMap(fn ($gid) => $allMemberships->get($gid, collect()))
                    ->pluck('swimmer_id')
                    ->unique()
                    ->count();

                $coachSessions = $sessionsByCoach->get($coach->user_id, collect());
                $coachSessionIds = $coachSessions->pluck('id');

                // Compute attendance from pre-loaded data
                $totalMarks = 0;
                $presentMarks = 0;
                $swimmerAttendance = []; // swimmer_id => [total, present]

                foreach ($coachSessionIds as $sid) {
                    $sessionAtt = $attendanceBySession->get($sid, collect());
                    foreach ($sessionAtt as $att) {
                        $totalMarks++;
                        if ($att->present) $presentMarks++;

                        if (!isset($swimmerAttendance[$att->swimmer_id])) {
                            $swimmerAttendance[$att->swimmer_id] = ['total' => 0, 'present' => 0];
                        }
                        $swimmerAttendance[$att->swimmer_id]['total']++;
                        if ($att->present) $swimmerAttendance[$att->swimmer_id]['present']++;
                    }
                }

                $avgAttendance = $totalMarks > 0 ? round(($presentMarks / $totalMarks) * 100, 1) : 0;

                // Avg rating from pre-loaded data
                $allRatings = $coachSessionIds->flatMap(fn ($sid) => $ratingsBySession->get($sid, collect()));
                $avgRating = $allRatings->isNotEmpty() ? round($allRatings->avg('rating'), 1) : null;

                // At-risk count from pre-loaded attendance
                $atRiskCount = 0;
                foreach ($swimmerAttendance as $stats) {
                    if ($stats['total'] > 0 && ($stats['present'] / $stats['total']) < 0.6) {
                        $atRiskCount++;
                    }
                }

                return [
                    'coach_id' => $coach->id,
                    'user_id' => $coach->user_id,
                    'coach_name' => $coach->user?->name ?? 'Unknown',
                    'groups_count' => $coachGroups->count(),
                    'swimmers_count' => $swimmersCount,
                    'sessions_30d' => $coachSessions->count(),
                    'avg_attendance' => $avgAttendance,
                    'avg_rating' => $avgRating,
                    'at_risk_count' => $atRiskCount,
                ];
            })->values()->toArray();
        });
    }

    public function getCoachDetail(int $clubId, int $coachUserId): array
    {
        $coach = CoachProfile::where('club_id', $clubId)
            ->whereHas('user', fn ($q) => $q->where('id', $coachUserId))
            ->with('user:id,name')
            ->first();

        if (!$coach) {
            return [];
        }

        $groups = Group::where('club_id', $clubId)
            ->where('coach_user_id', $coachUserId)
            ->get();

        $groupIds = $groups->pluck('id');

        $swimmerIds = $groupIds->isNotEmpty()
            ? DB::table('group_memberships')->whereIn('group_id', $groupIds)->distinct()->pluck('swimmer_id')
            : collect();

        $swimmersCount = $swimmerIds->count();

        $thirtyDaysAgo = now()->subDays(30)->toDateString();
        $sessionsCompleted30d = TrainingSession::whereIn('group_id', $groupIds)
            ->where('date', '>=', $thirtyDaysAgo)
            ->where('status', 'Completed')
            ->count();

        // Attendance by week (last 8 weeks) — batch: 2 queries total instead of 24
        $eightWeeksAgo = now()->subWeeks(7)->startOfWeek()->toDateString();
        $thisWeekEnd = now()->endOfWeek()->toDateString();

        $coachSessions8w = $groupIds->isNotEmpty()
            ? TrainingSession::whereIn('group_id', $groupIds)
                ->whereBetween('date', [$eightWeeksAgo, $thisWeekEnd])
                ->where('status', 'Completed')
                ->select('id', 'date')
                ->get()
            : collect();

        $coachSessionIds8w = $coachSessions8w->pluck('id');
        $attBySession8w = $coachSessionIds8w->isNotEmpty()
            ? DB::table('attendance')
                ->whereIn('session_id', $coachSessionIds8w)
                ->selectRaw('session_id, COUNT(*) as total, SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present')
                ->groupBy('session_id')
                ->get()
                ->keyBy('session_id')
            : collect();

        $attendanceByWeek = [];
        for ($i = 7; $i >= 0; $i--) {
            $weekStart = now()->subWeeks($i)->startOfWeek();
            $weekEnd = now()->subWeeks($i)->endOfWeek();
            $weekLabel = now()->subWeeks($i)->format('Y-\\WW');

            $weekSessions = $coachSessions8w->filter(fn ($s) => $s->date->between($weekStart, $weekEnd));
            $totalMarks = 0;
            $presentMarks = 0;

            foreach ($weekSessions as $s) {
                $att = $attBySession8w->get($s->id);
                if ($att) {
                    $totalMarks += $att->total;
                    $presentMarks += $att->present;
                }
            }

            $attendanceByWeek[] = [
                'week' => $weekLabel,
                'rate' => $totalMarks > 0 ? round(($presentMarks / $totalMarks) * 100, 1) : 0,
                'sessions_count' => $weekSessions->count(),
            ];
        }

        // Rating distribution
        $allSessionIds = TrainingSession::whereIn('group_id', $groupIds)
            ->where('status', 'Completed')
            ->pluck('id');

        $ratingDist = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        if ($allSessionIds->isNotEmpty()) {
            $ratings = DailyEvaluation::whereIn('session_id', $allSessionIds)
                ->selectRaw('rating, COUNT(*) as cnt')
                ->groupBy('rating')
                ->pluck('cnt', 'rating');

            foreach ($ratings as $r => $cnt) {
                if (isset($ratingDist[$r])) {
                    $ratingDist[$r] = $cnt;
                }
            }
        }

        // Pre-load all swimmer profiles in one batch query (used by top + at-risk)
        $swimmerProfiles = $swimmerIds->isNotEmpty()
            ? SwimmerProfile::whereIn('id', $swimmerIds)->get()->keyBy('id')
            : collect();

        // Top 5 swimmers by avg rating
        $topSwimmers = [];
        if ($allSessionIds->isNotEmpty() && $swimmerIds->isNotEmpty()) {
            // Single aggregation: attendance stats per swimmer across all sessions
            $attendanceBySwimmer = DB::table('attendance')
                ->whereIn('session_id', $allSessionIds)
                ->whereIn('swimmer_id', $swimmerIds)
                ->selectRaw('swimmer_id, COUNT(*) as total, SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present')
                ->groupBy('swimmer_id')
                ->get()
                ->keyBy('swimmer_id');

            $topSwimmers = DailyEvaluation::whereIn('session_id', $allSessionIds)
                ->whereIn('swimmer_id', $swimmerIds)
                ->selectRaw('swimmer_id, AVG(rating) as avg_rating')
                ->groupBy('swimmer_id')
                ->orderByDesc('avg_rating')
                ->take(5)
                ->get()
                ->map(function ($row) use ($swimmerProfiles, $attendanceBySwimmer) {
                    $swimmer = $swimmerProfiles->get($row->swimmer_id);
                    $att = $attendanceBySwimmer->get($row->swimmer_id);
                    $total = $att?->total ?? 0;
                    $present = $att?->present ?? 0;

                    return [
                        'swimmer_id' => $row->swimmer_id,
                        'name' => $swimmer ? ($swimmer->first_name . ' ' . $swimmer->last_name) : 'Unknown',
                        'avg_rating' => round($row->avg_rating, 1),
                        'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
                    ];
                })->toArray();
        }

        // At-risk swimmers (< 60% attendance in last 30 days)
        $sessions30d = TrainingSession::whereIn('group_id', $groupIds)
            ->where('date', '>=', $thirtyDaysAgo)
            ->where('status', 'Completed')
            ->pluck('id');

        $atRiskSwimmers = [];
        if ($sessions30d->isNotEmpty() && $swimmerIds->isNotEmpty()) {
            // Single aggregation: attendance stats per swimmer for 30d sessions
            $att30dBySwimmer = DB::table('attendance')
                ->whereIn('session_id', $sessions30d)
                ->whereIn('swimmer_id', $swimmerIds)
                ->selectRaw('swimmer_id, COUNT(*) as total, SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present, MAX(CASE WHEN present = 1 THEN created_at ELSE NULL END) as last_present_at')
                ->groupBy('swimmer_id')
                ->get()
                ->keyBy('swimmer_id');

            foreach ($swimmerIds as $swimmerId) {
                $att = $att30dBySwimmer->get($swimmerId);
                $total = $att?->total ?? 0;
                $present = $att?->present ?? 0;
                $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

                if ($rate < 60) {
                    $swimmer = $swimmerProfiles->get($swimmerId);

                    $atRiskSwimmers[] = [
                        'swimmer_id' => $swimmerId,
                        'name' => $swimmer ? ($swimmer->first_name . ' ' . $swimmer->last_name) : 'Unknown',
                        'attendance_rate' => $rate,
                        'last_seen' => $att?->last_present_at ? \Carbon\Carbon::parse($att->last_present_at)->toDateString() : null,
                    ];
                }
            }
        }

        return [
            'coach' => [
                'id' => $coach->user_id,
                'name' => $coach->user?->name ?? 'Unknown',
                'bio' => $coach->bio,
                'specialization' => $coach->specialization,
                'groups_count' => $groups->count(),
                'swimmers_count' => $swimmersCount,
                'sessions_completed_30d' => $sessionsCompleted30d,
            ],
            'attendance_by_week' => $attendanceByWeek,
            'swimmer_rating_distribution' => $ratingDist,
            'top_swimmers' => $topSwimmers,
            'at_risk_swimmers' => $atRiskSwimmers,
        ];
    }
}
