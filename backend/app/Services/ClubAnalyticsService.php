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

            $thirtyDaysAgo = now()->subDays(30)->toDateString();
            $twentyOneDaysAgo = now()->subDays(21)->toDateString();
            $sixtyDaysAgo = now()->subDays(60)->toDateString();

            // Swimmers who attended at least 1 session in last 30 days
            $activeSwimmerIds = Attendance::where('present', true)
                ->whereHas('session', fn ($q) => $q->where('club_id', $clubId)->where('date', '>=', $thirtyDaysAgo))
                ->distinct()
                ->pluck('swimmer_id');

            $retentionRate = round(($activeSwimmerIds->count() / $totalSwimmers) * 100, 1);

            // Swimmers with any attendance record in club
            $allClubSwimmerIds = SwimmerProfile::where('club_id', $clubId)->pluck('id');

            // At-risk: 0 sessions in last 21 days
            $recentAttenders21 = Attendance::where('present', true)
                ->whereIn('swimmer_id', $allClubSwimmerIds)
                ->whereHas('session', fn ($q) => $q->where('club_id', $clubId)->where('date', '>=', $twentyOneDaysAgo))
                ->distinct()
                ->pluck('swimmer_id');

            $atRiskCount = $allClubSwimmerIds->diff($recentAttenders21)->count();

            // Churned: 0 sessions in last 60 days
            $recentAttenders60 = Attendance::where('present', true)
                ->whereIn('swimmer_id', $allClubSwimmerIds)
                ->whereHas('session', fn ($q) => $q->where('club_id', $clubId)->where('date', '>=', $sixtyDaysAgo))
                ->distinct()
                ->pluck('swimmer_id');

            $churnedCount = $allClubSwimmerIds->diff($recentAttenders60)->count();

            // Average attendance rate last 30 days
            $totalMarks = Attendance::whereHas('session', fn ($q) => $q->where('club_id', $clubId)->where('date', '>=', $thirtyDaysAgo))->count();
            $presentMarks = Attendance::where('present', true)
                ->whereHas('session', fn ($q) => $q->where('club_id', $clubId)->where('date', '>=', $thirtyDaysAgo))
                ->count();

            $avgAttendanceRate = $totalMarks > 0 ? round(($presentMarks / $totalMarks) * 100, 1) : 0;

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
            $result = [];

            for ($i = 7; $i >= 0; $i--) {
                $weekStart = now()->subWeeks($i)->startOfWeek()->toDateString();
                $weekEnd = now()->subWeeks($i)->endOfWeek()->toDateString();
                $weekLabel = now()->subWeeks($i)->format('Y-\\WW');

                $sessions = TrainingSession::where('club_id', $clubId)
                    ->whereBetween('date', [$weekStart, $weekEnd])
                    ->where('status', 'Completed')
                    ->pluck('id');

                $sessionsCount = $sessions->count();

                if ($sessionsCount === 0) {
                    $result[] = [
                        'week' => $weekLabel,
                        'rate' => 0,
                        'sessions' => 0,
                        'total_marks' => 0,
                    ];
                    continue;
                }

                $totalMarks = Attendance::whereIn('session_id', $sessions)->count();
                $presentMarks = Attendance::whereIn('session_id', $sessions)->where('present', true)->count();

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

            $thirtyDaysAgo = now()->subDays(30)->toDateString();

            return $coaches->map(function ($coach) use ($clubId, $thirtyDaysAgo): array {
                $groups = Group::where('club_id', $clubId)
                    ->where('coach_user_id', $coach->user_id)
                    ->get();

                $groupIds = $groups->pluck('id');
                $swimmersCount = $groupIds->isNotEmpty()
                    ? DB::table('group_memberships')->whereIn('group_id', $groupIds)->distinct('swimmer_id')->count('swimmer_id')
                    : 0;

                $sessions30d = TrainingSession::whereIn('group_id', $groupIds)
                    ->where('date', '>=', $thirtyDaysAgo)
                    ->where('status', 'Completed')
                    ->pluck('id');

                $totalMarks = Attendance::whereIn('session_id', $sessions30d)->count();
                $presentMarks = Attendance::whereIn('session_id', $sessions30d)->where('present', true)->count();
                $avgAttendance = $totalMarks > 0 ? round(($presentMarks / $totalMarks) * 100, 1) : 0;

                $avgRating = DailyEvaluation::whereIn('session_id', $sessions30d)->avg('rating');

                // At-risk: swimmers in coach's groups with < 60% attendance in last 30d
                $atRiskCount = 0;
                if ($sessions30d->isNotEmpty()) {
                    $swimmerIds = DB::table('group_memberships')
                        ->whereIn('group_id', $groupIds)
                        ->distinct()
                        ->pluck('swimmer_id');

                    foreach ($swimmerIds as $swimmerId) {
                        $total = Attendance::whereIn('session_id', $sessions30d)->where('swimmer_id', $swimmerId)->count();
                        $present = Attendance::whereIn('session_id', $sessions30d)->where('swimmer_id', $swimmerId)->where('present', true)->count();
                        if ($total > 0 && ($present / $total) < 0.6) {
                            $atRiskCount++;
                        }
                    }
                }

                return [
                    'coach_id' => $coach->id,
                    'user_id' => $coach->user_id,
                    'coach_name' => $coach->user?->name ?? 'Unknown',
                    'groups_count' => $groups->count(),
                    'swimmers_count' => $swimmersCount,
                    'sessions_30d' => $sessions30d->count(),
                    'avg_attendance' => $avgAttendance,
                    'avg_rating' => $avgRating ? round($avgRating, 1) : null,
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

        // Attendance by week (last 8 weeks)
        $attendanceByWeek = [];
        for ($i = 7; $i >= 0; $i--) {
            $weekStart = now()->subWeeks($i)->startOfWeek()->toDateString();
            $weekEnd = now()->subWeeks($i)->endOfWeek()->toDateString();
            $weekLabel = now()->subWeeks($i)->format('Y-\\WW');

            $sessionIds = TrainingSession::whereIn('group_id', $groupIds)
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->where('status', 'Completed')
                ->pluck('id');

            $sessionsCount = $sessionIds->count();
            $totalMarks = $sessionIds->isNotEmpty() ? Attendance::whereIn('session_id', $sessionIds)->count() : 0;
            $presentMarks = $sessionIds->isNotEmpty() ? Attendance::whereIn('session_id', $sessionIds)->where('present', true)->count() : 0;

            $attendanceByWeek[] = [
                'week' => $weekLabel,
                'rate' => $totalMarks > 0 ? round(($presentMarks / $totalMarks) * 100, 1) : 0,
                'sessions_count' => $sessionsCount,
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

        // Top 5 swimmers by avg rating
        $topSwimmers = [];
        if ($allSessionIds->isNotEmpty() && $swimmerIds->isNotEmpty()) {
            $topSwimmers = DailyEvaluation::whereIn('session_id', $allSessionIds)
                ->whereIn('swimmer_id', $swimmerIds)
                ->selectRaw('swimmer_id, AVG(rating) as avg_rating')
                ->groupBy('swimmer_id')
                ->orderByDesc('avg_rating')
                ->take(5)
                ->get()
                ->map(function ($row) use ($allSessionIds) {
                    $swimmer = SwimmerProfile::find($row->swimmer_id);
                    $total = Attendance::whereIn('session_id', $allSessionIds)->where('swimmer_id', $row->swimmer_id)->count();
                    $present = Attendance::whereIn('session_id', $allSessionIds)->where('swimmer_id', $row->swimmer_id)->where('present', true)->count();

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
            foreach ($swimmerIds as $swimmerId) {
                $total = Attendance::whereIn('session_id', $sessions30d)->where('swimmer_id', $swimmerId)->count();
                $present = Attendance::whereIn('session_id', $sessions30d)->where('swimmer_id', $swimmerId)->where('present', true)->count();
                $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

                if ($rate < 60) {
                    $swimmer = SwimmerProfile::find($swimmerId);
                    $lastAttendance = Attendance::where('swimmer_id', $swimmerId)
                        ->where('present', true)
                        ->whereHas('session', fn ($q) => $q->whereIn('id', $sessions30d))
                        ->latest('created_at')
                        ->first();

                    $atRiskSwimmers[] = [
                        'swimmer_id' => $swimmerId,
                        'name' => $swimmer ? ($swimmer->first_name . ' ' . $swimmer->last_name) : 'Unknown',
                        'attendance_rate' => $rate,
                        'last_seen' => $lastAttendance?->created_at?->toDateString(),
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
