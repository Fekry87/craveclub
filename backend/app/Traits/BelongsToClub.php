<?php

namespace App\Traits;

use App\Models\Club;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToClub
{
    public static function bootBelongsToClub(): void
    {
        static::creating(function ($model) {
            if (auth()->check() && auth()->user()->club_id && !$model->club_id) {
                $model->club_id = auth()->user()->club_id;
            }
        });

        static::addGlobalScope('club', function (Builder $builder) {
            if (auth()->check() && auth()->user()->club_id) {
                $builder->where($builder->getModel()->getTable() . '.club_id', auth()->user()->club_id);
            }
        });
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
