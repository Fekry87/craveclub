<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

/**
 * A club's award title — "Man of the Week", or whatever the club names it —
 * with the XP it grants. Clubs add, rename, re-price and remove them. A given
 * award snapshots the name and XP, so changing or deleting a type here never
 * touches awards already handed out.
 */
class AwardType extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'name', 'xp_value', 'position'];

    protected $casts = [
        'xp_value' => 'integer',
        'position' => 'integer',
    ];

    /** The award titles a club starts with, in order. */
    public const DEFAULTS = [
        ['name' => 'Man of the Day', 'xp_value' => 50],
        ['name' => 'Man of the Week', 'xp_value' => 150],
        ['name' => 'Man of the Month', 'xp_value' => 400],
    ];

    /**
     * Give a club its default award titles, once. Idempotent: a club that
     * already has any award type (even after the manager edited or pruned the
     * list) is left alone.
     *
     * @param  array<int,int>|null  $xpOverrides  per-position XP (migration
     *                                            preserves each club's old values)
     */
    public static function seedDefaults(int $clubId, ?array $xpOverrides = null): void
    {
        if (static::where('club_id', $clubId)->exists()) {
            return;
        }

        $rows = [];
        foreach (self::DEFAULTS as $position => $default) {
            $rows[] = [
                'club_id' => $clubId,
                'name' => $default['name'],
                'xp_value' => $xpOverrides[$position] ?? $default['xp_value'],
                'position' => $position,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        static::insert($rows);
    }
}
