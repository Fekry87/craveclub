<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LevelTier extends Model
{
    protected $fillable = [
        'club_id', 'name', 'xp_threshold', 'color', 'icon', 'sort_order',
    ];

    protected $casts = [
        'xp_threshold' => 'integer',
        'sort_order' => 'integer',
    ];

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * Get default level tiers.
     */
    public static function defaults(): array
    {
        return [
            ['name' => 'Bronze Fish',     'xp_threshold' => 0,    'color' => '#CD7F32', 'icon' => '🐟', 'sort_order' => 1],
            ['name' => 'Silver Dolphin',  'xp_threshold' => 200,  'color' => '#C0C0C0', 'icon' => '🐬', 'sort_order' => 2],
            ['name' => 'Gold Shark',      'xp_threshold' => 500,  'color' => '#FFD700', 'icon' => '🦈', 'sort_order' => 3],
            ['name' => 'Platinum Whale',  'xp_threshold' => 1000, 'color' => '#7DD3FC', 'icon' => '🐋', 'sort_order' => 4],
            ['name' => 'Diamond Kraken',  'xp_threshold' => 2000, 'color' => '#A78BFA', 'icon' => '🐙', 'sort_order' => 5],
        ];
    }

    /**
     * Seed default tiers for a club if none exist.
     */
    public static function seedForClub(int $clubId): void
    {
        if (self::where('club_id', $clubId)->exists()) {
            return;
        }

        foreach (self::defaults() as $tier) {
            self::create(array_merge($tier, ['club_id' => $clubId]));
        }
    }

    /**
     * Get ordered tiers for a club.
     */
    public static function forClub(int $clubId): \Illuminate\Database\Eloquent\Collection
    {
        $tiers = self::where('club_id', $clubId)->orderBy('xp_threshold', 'asc')->get();

        if ($tiers->isEmpty()) {
            self::seedForClub($clubId);
            $tiers = self::where('club_id', $clubId)->orderBy('xp_threshold', 'asc')->get();
        }

        return $tiers;
    }
}
