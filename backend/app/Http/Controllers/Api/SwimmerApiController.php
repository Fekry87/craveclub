<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\Attendance;
use App\Models\DailyEvaluation;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SwimmerApiController extends Controller
{
    private function getSwimmerProfile(Request $request): ?SwimmerProfile
    {
        return SwimmerProfile::where('user_id', $request->user()->id)->first();
    }

    public function dashboard(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (!$profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $groupIds = $profile->groups()->pluck('groups.id');

        $upcomingSessions = TrainingSession::whereIn('group_id', $groupIds)
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')->orderBy('start_time')
            ->take(5)
            ->with(['group', 'plan'])
            ->get();

        $totalAttendance = Attendance::where('swimmer_id', $profile->id)->count();
        $presentCount = Attendance::where('swimmer_id', $profile->id)->where('present', true)->count();
        $attendanceRate = $totalAttendance > 0 ? round(($presentCount / $totalAttendance) * 100, 1) : 0;

        $recentEvaluations = DailyEvaluation::where('swimmer_id', $profile->id)
            ->with('session.group')
            ->latest()
            ->take(5)
            ->get();

        $avgRating = DailyEvaluation::where('swimmer_id', $profile->id)->avg('rating');
        $bestRating = DailyEvaluation::where('swimmer_id', $profile->id)->max('rating');

        $monthlyRatings = DailyEvaluation::where('swimmer_id', $profile->id)
            ->selectRaw("strftime('%Y-%m', created_at) as month, AVG(rating) as avg_rating, COUNT(*) as count")
            ->groupByRaw("strftime('%Y-%m', created_at)")
            ->orderBy('month', 'desc')
            ->take(6)
            ->get();

        return response()->json([
            'profile' => $profile,
            'upcoming_sessions' => $upcomingSessions,
            'attendance_rate' => $attendanceRate,
            'total_sessions' => $totalAttendance,
            'sessions_attended' => $presentCount,
            'recent_evaluations' => $recentEvaluations,
            'average_rating' => $avgRating ? round($avgRating, 1) : null,
            'best_rating' => $bestRating,
            'monthly_ratings' => $monthlyRatings,
        ]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (!$profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $groupIds = $profile->groups()->pluck('groups.id');

        $sessions = TrainingSession::whereIn('group_id', $groupIds)
            ->with(['group', 'plan', 'attendances' => function ($q) use ($profile) {
                $q->where('swimmer_id', $profile->id);
            }])
            ->orderBy('date', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($sessions);
    }

    public function evaluations(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (!$profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $evaluations = DailyEvaluation::where('swimmer_id', $profile->id)
            ->with('session.group')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($evaluations);
    }

    // ── XP & Level helpers (DB-driven) ──

    private function getClubSettings(int $clubId): LeaderboardSetting
    {
        return LeaderboardSetting::forClub($clubId);
    }

    private function getClubLevels(int $clubId): array
    {
        return LevelTier::forClub($clubId)->map(fn($t, $i) => [
            'level' => $i + 1,
            'name' => $t->name,
            'xp' => $t->xp_threshold,
            'color' => $t->color,
            'icon' => $t->icon,
        ])->values()->toArray();
    }

    private function getLevelInfo(int $totalXp, ?array $levels = null): array
    {
        if (!$levels) {
            $levels = LevelTier::defaults();
            $levels = array_map(fn($t, $i) => ['level' => $i + 1, 'name' => $t['name'], 'xp' => $t['xp_threshold'], 'color' => $t['color']], $levels, array_keys($levels));
        }

        $current = $levels[0];
        $next = $levels[1] ?? null;

        for ($i = count($levels) - 1; $i >= 0; $i--) {
            if ($totalXp >= $levels[$i]['xp']) {
                $current = $levels[$i];
                $next = $levels[$i + 1] ?? null;
                break;
            }
        }

        $progress = 0;
        $xpToNext = null;
        if ($next) {
            $xpToNext = $next['xp'] - $totalXp;
            $xpInLevel = $totalXp - $current['xp'];
            $levelRange = $next['xp'] - $current['xp'];
            $progress = $levelRange > 0 ? round(($xpInLevel / $levelRange) * 100, 1) : 100;
        } else {
            $progress = 100;
        }

        return [
            'level' => $current['level'],
            'name' => $current['name'],
            'color' => $current['color'],
            'xp_to_next' => $xpToNext,
            'next_level_name' => $next['name'] ?? null,
            'next_level_xp' => $next['xp'] ?? null,
            'progress' => $progress,
        ];
    }

    private function computeSwimmerXp(int $swimmerId, int $clubId, ?LeaderboardSetting $settings = null): array
    {
        $settings = $settings ?? $this->getClubSettings($clubId);
        $ratingXpMap = $settings->getRatingXpMap();

        // Rating XP
        $evaluations = DailyEvaluation::where('swimmer_id', $swimmerId)
            ->where('club_id', $clubId)
            ->pluck('rating');

        $ratingXp = 0;
        foreach ($evaluations as $rating) {
            $ratingXp += $ratingXpMap[$rating] ?? 0;
        }

        // Attendance XP
        $attendedCount = Attendance::where('swimmer_id', $swimmerId)
            ->whereHas('session', fn($q) => $q->where('club_id', $clubId))
            ->where('present', true)
            ->count();

        $attendanceXp = $attendedCount * $settings->attendance_xp;

        // Streak XP
        $attendanceRecords = Attendance::where('swimmer_id', $swimmerId)
            ->whereHas('session', fn($q) => $q->where('club_id', $clubId))
            ->join('training_sessions', 'attendance.session_id', '=', 'training_sessions.id')
            ->orderBy('training_sessions.date', 'asc')
            ->select('attendance.present')
            ->get();

        $streakXp = 0;
        $streak = 0;
        foreach ($attendanceRecords as $record) {
            if ($record->present) {
                $streak++;
                if ($streak >= $settings->streak_threshold) {
                    $streakXp += $settings->streak_bonus_xp;
                }
            } else {
                $streak = 0;
            }
        }

        $totalXp = $ratingXp + $attendanceXp + $streakXp;

        return [
            'total_xp' => $totalXp,
            'rating_xp' => $ratingXp,
            'attendance_xp' => $attendanceXp,
            'streak_xp' => $streakXp,
            'evaluation_count' => count($evaluations),
            'attended_count' => $attendedCount,
        ];
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (!$profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $clubId = $profile->club_id;
        $settings = $this->getClubSettings($clubId);
        $levels = $this->getClubLevels($clubId);

        // Get all swimmers in this club
        $allSwimmers = SwimmerProfile::where('club_id', $clubId)->get();

        // Compute XP for each swimmer
        $rankings = [];
        foreach ($allSwimmers as $swimmer) {
            $xpData = $this->computeSwimmerXp($swimmer->id, $clubId, $settings);
            $levelInfo = $this->getLevelInfo($xpData['total_xp'], $levels);

            $rankings[] = [
                'swimmer_id' => $swimmer->id,
                'first_name' => $swimmer->first_name,
                'last_initial' => mb_substr($swimmer->last_name ?? '', 0, 1) . '.',
                'full_name' => $swimmer->first_name . ' ' . $swimmer->last_name,
                'total_xp' => $xpData['total_xp'],
                'level' => $levelInfo['level'],
                'level_name' => $levelInfo['name'],
                'level_color' => $levelInfo['color'],
                'is_current_user' => $swimmer->id === $profile->id,
            ];
        }

        // Sort by XP descending, then by name for ties
        usort($rankings, function ($a, $b) {
            if ($b['total_xp'] !== $a['total_xp']) {
                return $b['total_xp'] - $a['total_xp'];
            }
            return strcmp($a['first_name'], $b['first_name']);
        });

        // Assign ranks
        foreach ($rankings as $i => &$r) {
            $r['rank'] = $i + 1;
        }
        unset($r);

        // Top 5
        $top5 = array_slice($rankings, 0, 5);

        // Apply privacy: remove full_name for non-current users
        $allRankings = array_map(function ($entry) {
            if (!$entry['is_current_user']) {
                unset($entry['full_name']);
            }
            return $entry;
        }, $rankings);

        foreach ($top5 as &$entry) {
            if (!$entry['is_current_user']) {
                unset($entry['full_name']);
            }
        }
        unset($entry);

        // Current swimmer data
        $myXpData = $this->computeSwimmerXp($profile->id, $clubId, $settings);
        $myLevelInfo = $this->getLevelInfo($myXpData['total_xp'], $levels);
        $myRank = null;
        foreach ($rankings as $r) {
            if ($r['swimmer_id'] === $profile->id) {
                $myRank = $r['rank'];
                break;
            }
        }

        return response()->json([
            'top5' => $top5,
            'all_rankings' => array_values($allRankings),
            'my_rank' => $myRank,
            'my_xp' => $myXpData,
            'my_level' => $myLevelInfo,
            'total_swimmers' => count($rankings),
            'levels' => $levels,
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (!$profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $totalSessions = Attendance::where('swimmer_id', $profile->id)->count();
        $present = Attendance::where('swimmer_id', $profile->id)->where('present', true)->count();
        $avgRating = DailyEvaluation::where('swimmer_id', $profile->id)->avg('rating');
        $bestRating = DailyEvaluation::where('swimmer_id', $profile->id)->max('rating');

        $monthlyRatings = DailyEvaluation::where('swimmer_id', $profile->id)
            ->selectRaw("strftime('%Y-%m', created_at) as month, AVG(rating) as avg_rating, COUNT(*) as count")
            ->groupByRaw("strftime('%Y-%m', created_at)")
            ->orderBy('month', 'desc')
            ->take(6)
            ->get();

        return response()->json([
            'total_sessions' => $totalSessions,
            'sessions_attended' => $present,
            'attendance_rate' => $totalSessions > 0 ? round(($present / $totalSessions) * 100, 1) : 0,
            'average_rating' => $avgRating ? round($avgRating, 1) : null,
            'best_rating' => $bestRating,
            'monthly_ratings' => $monthlyRatings,
        ]);
    }
}
