<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SwimmerAward extends Model
{
    use BelongsToClub;

    const TYPE_DAY = 'day';

    const TYPE_WEEK = 'week';

    const TYPE_MONTH = 'month';

    const TYPES = [self::TYPE_DAY, self::TYPE_WEEK, self::TYPE_MONTH];

    protected $fillable = ['club_id', 'swimmer_id', 'award_type', 'xp_value', 'awarded_by'];

    protected $casts = ['xp_value' => 'integer'];

    public function swimmer(): BelongsTo
    {
        return $this->belongsTo(SwimmerProfile::class, 'swimmer_id');
    }

    public function awardedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }

    public function views(): HasMany
    {
        return $this->hasMany(SwimmerAwardView::class, 'award_id');
    }
}
