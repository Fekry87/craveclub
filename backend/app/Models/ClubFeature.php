<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClubFeature extends Model
{
    protected $fillable = [
        'club_id',
        'leaderboard_enabled',
        'evaluations_enabled',
        'skills_enabled',
        'training_plans_enabled',
        'attendance_tracking_enabled',
        'swimmer_accounts_enabled',
        'coach_portal_enabled',
        'subscription_plans_enabled',
    ];

    protected $casts = [
        'leaderboard_enabled' => 'boolean',
        'evaluations_enabled' => 'boolean',
        'skills_enabled' => 'boolean',
        'training_plans_enabled' => 'boolean',
        'attendance_tracking_enabled' => 'boolean',
        'swimmer_accounts_enabled' => 'boolean',
        'coach_portal_enabled' => 'boolean',
        'subscription_plans_enabled' => 'boolean',
    ];

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * Get or create feature flags for a club (all default true).
     */
    public static function forClub(int $clubId): self
    {
        return self::firstOrCreate(['club_id' => $clubId]);
    }

    /**
     * Check if a specific feature is enabled.
     */
    public function isEnabled(string $feature): bool
    {
        $column = $feature.'_enabled';

        if (! array_key_exists($column, $this->casts)) {
            return false;
        }

        return (bool) $this->$column;
    }

    /**
     * Feature keys that can be toggled.
     */
    public static function featureKeys(): array
    {
        return [
            'leaderboard_enabled',
            'evaluations_enabled',
            'skills_enabled',
            'training_plans_enabled',
            'attendance_tracking_enabled',
            'swimmer_accounts_enabled',
            'coach_portal_enabled',
            'subscription_plans_enabled',
        ];
    }
}
