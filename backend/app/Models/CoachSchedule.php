<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachSchedule extends Model
{
    protected $fillable = [
        'coach_id', 'day_of_week', 'slots',
    ];

    protected function casts(): array
    {
        return [
            'slots' => 'array',
        ];
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(CoachProfile::class, 'coach_id');
    }
}
