<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HasSportScope
{
    public function scopeForCurrentSport(Builder $query): Builder
    {
        $sportId = app()->has('current_sport_module_id')
            ? app('current_sport_module_id')
            : null;

        return $sportId
            ? $query->where('sport_module_id', $sportId)
            : $query;
    }
}
