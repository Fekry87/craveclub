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
     * Get or create settings for a club (with defaults).
     */
    public static function forClub(int $clubId): self
    {
        return self::firstOrCreate(['club_id' => $clubId]);
    }
}
