<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardSetting extends Model
{
    protected $fillable = [
        'club_id',
        'rating_xp_1', 'rating_xp_2', 'rating_xp_3', 'rating_xp_4', 'rating_xp_5',
        'attendance_xp', 'streak_bonus_xp', 'streak_threshold',
        'award_day_xp', 'award_week_xp', 'award_month_xp',
    ];

    /**
     * Mirrors the migration defaults so a freshly created row reads the same
     * values in memory as it does after a reload (firstOrCreate does not pull
     * DB defaults back into the model).
     */
    protected $attributes = [
        'rating_xp_1' => 10,
        'rating_xp_2' => 25,
        'rating_xp_3' => 50,
        'rating_xp_4' => 80,
        'rating_xp_5' => 120,
        'attendance_xp' => 5,
        'streak_bonus_xp' => 10,
        'streak_threshold' => 3,
        'award_day_xp' => 50,
        'award_week_xp' => 150,
        'award_month_xp' => 400,
    ];

    protected $casts = [
        'rating_xp_1' => 'integer',
        'rating_xp_2' => 'integer',
        'rating_xp_3' => 'integer',
        'rating_xp_4' => 'integer',
        'rating_xp_5' => 'integer',
        'attendance_xp' => 'integer',
        'streak_bonus_xp' => 'integer',
        'streak_threshold' => 'integer',
        'award_day_xp' => 'integer',
        'award_week_xp' => 'integer',
        'award_month_xp' => 'integer',
    ];

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * Get rating XP map [1 => xp, 2 => xp, ...]
     */
    public function getRatingXpMap(): array
    {
        return [
            1 => $this->rating_xp_1,
            2 => $this->rating_xp_2,
            3 => $this->rating_xp_3,
            4 => $this->rating_xp_4,
            5 => $this->rating_xp_5,
        ];
    }

    /**
     * XP granted by a Man of the Day / Week / Month award.
     */
    public function getAwardXpFor(string $type): int
    {
        return match ($type) {
            SwimmerAward::TYPE_DAY => (int) $this->award_day_xp,
            SwimmerAward::TYPE_WEEK => (int) $this->award_week_xp,
            SwimmerAward::TYPE_MONTH => (int) $this->award_month_xp,
            default => 0,
        };
    }

    /**
     * Get or create settings for a club (with defaults).
     */
    public static function forClub(int $clubId): self
    {
        return self::firstOrCreate(['club_id' => $clubId]);
    }
}
