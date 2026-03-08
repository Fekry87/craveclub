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
     */
    public function getTopSwimmers(int $clubId, int $limit = 5): array
    {
        $settings = LeaderboardSetting::forClub($clubId);
        $tiers = LevelTier::forClub($clubId)->toArray();
        $swimmers = SwimmerProfile::where('club_id', $clubId)->get();

        $results = [];
        foreach ($swimmers as $swimmer) {
            $xpData = $this->computeForSwimmer($swimmer->id, $clubId, $settings);
            $level = $this->getLevelFromTiers($xpData['total_xp'], $tiers);
            $results[] = [
                'swimmer_id' => $swimmer->id,
                'name' => $swimmer->first_name . ' ' . mb_substr($swimmer->last_name ?? '', 0, 1) . '.',
                'total_xp' => $xpData['total_xp'],
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
