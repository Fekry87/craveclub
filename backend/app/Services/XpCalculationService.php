<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\DailyEvaluation;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\SwimmerProfile;
use Illuminate\Support\Facades\Cache;

class XpCalculationService
{
    /**
     * Compute XP breakdown for a single swimmer.
     */
    public function computeForSwimmer(int $swimmerId, int $clubId, LeaderboardSetting $settings): array
    {
        $cacheKey = "swimmer_xp:{$clubId}:{$swimmerId}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($swimmerId, $clubId, $settings) {
            $ratingXpMap = $settings->getRatingXpMap();

            // Rating XP — single query
            $ratingXp = 0;
            $evaluations = DailyEvaluation::where('swimmer_id', $swimmerId)
                ->where('club_id', $clubId)
                ->pluck('rating');

            foreach ($evaluations as $rating) {
                $ratingXp += $ratingXpMap[$rating] ?? 0;
            }

            // Attendance XP — single count query
            $attendedCount = Attendance::where('swimmer_id', $swimmerId)
                ->whereHas('session', fn($q) => $q->where('club_id', $clubId))
                ->where('present', true)
                ->count();

            $attendanceXp = $attendedCount * $settings->attendance_xp;

            // Streak XP — single ordered query
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

            return [
                'total_xp' => $ratingXp + $attendanceXp + $streakXp,
                'rating_xp' => $ratingXp,
                'attendance_xp' => $attendanceXp,
                'streak_xp' => $streakXp,
            ];
        });
    }

    /**
     * Get the level tier for a given XP amount.
     */
    public function getLevelFromTiers(int $totalXp, array $tiers): array
    {
        $current = $tiers[0] ?? ['name' => 'Unranked', 'color' => '#64748b', 'icon' => ''];
        for ($i = count($tiers) - 1; $i >= 0; $i--) {
            if ($totalXp >= $tiers[$i]['xp_threshold']) {
                $current = $tiers[$i];
                break;
            }
        }
        return $current;
    }

    /**
     * Get top N swimmers with XP and level info.
     * Uses batch queries to avoid N+1 (3 queries total instead of 3*N).
     */
    public function getTopSwimmers(int $clubId, int $limit = 5): array
    {
        $settings = LeaderboardSetting::forClub($clubId);
        $tiers = LevelTier::forClub($clubId)->toArray();
        $swimmers = SwimmerProfile::where('club_id', $clubId)
            ->select('id', 'first_name', 'last_name')
            ->get();

        if ($swimmers->isEmpty()) {
            return [];
        }

        $swimmerIds = $swimmers->pluck('id')->toArray();
        $ratingXpMap = $settings->getRatingXpMap();

        // Batch: all evaluations for all swimmers (1 query)
        $allEvaluations = DailyEvaluation::whereIn('swimmer_id', $swimmerIds)
            ->where('club_id', $clubId)
            ->select('swimmer_id', 'rating')
            ->get()
            ->groupBy('swimmer_id');

        // Batch: attendance counts for all swimmers (1 query)
        $attendanceCounts = Attendance::whereIn('swimmer_id', $swimmerIds)
            ->where('present', true)
            ->whereIn('session_id', function ($q) use ($clubId) {
                $q->select('id')->from('training_sessions')->where('club_id', $clubId)->whereNull('deleted_at');
            })
            ->selectRaw('swimmer_id, COUNT(*) as cnt')
            ->groupBy('swimmer_id')
            ->pluck('cnt', 'swimmer_id');

        // Batch: attendance records for streak calculation (1 query)
        $allAttendance = Attendance::whereIn('swimmer_id', $swimmerIds)
            ->whereIn('session_id', function ($q) use ($clubId) {
                $q->select('id')->from('training_sessions')->where('club_id', $clubId)->whereNull('deleted_at');
            })
            ->join('training_sessions', 'attendance.session_id', '=', 'training_sessions.id')
            ->orderBy('training_sessions.date', 'asc')
            ->select('attendance.swimmer_id', 'attendance.present')
            ->get()
            ->groupBy('swimmer_id');

        $results = [];
        foreach ($swimmers as $swimmer) {
            // Rating XP from batch
            $ratingXp = 0;
            foreach ($allEvaluations->get($swimmer->id, collect()) as $eval) {
                $ratingXp += $ratingXpMap[$eval->rating] ?? 0;
            }

            // Attendance XP from batch
            $attendedCount = $attendanceCounts->get($swimmer->id, 0);
            $attendanceXp = $attendedCount * $settings->attendance_xp;

            // Streak XP from batch
            $streakXp = 0;
            $streak = 0;
            foreach ($allAttendance->get($swimmer->id, collect()) as $record) {
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
            $level = $this->getLevelFromTiers($totalXp, $tiers);

            $results[] = [
                'swimmer_id' => $swimmer->id,
                'name' => $swimmer->first_name . ' ' . mb_substr($swimmer->last_name ?? '', 0, 1) . '.',
                'total_xp' => $totalXp,
                'level_name' => $level['name'],
                'level_color' => $level['color'],
                'level_icon' => $level['icon'] ?? '',
            ];
        }

        usort($results, fn($a, $b) => $b['total_xp'] - $a['total_xp']);
        return array_slice($results, 0, $limit);
    }

    /**
     * Invalidate cached XP for a swimmer.
     */
    public function invalidateCache(int $swimmerId, int $clubId): void
    {
        Cache::forget("swimmer_xp:{$clubId}:{$swimmerId}");
    }
}
