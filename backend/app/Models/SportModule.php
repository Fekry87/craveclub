<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SportModule extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'slug', 'description', 'icon', 'color', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function clubs()
    {
        return $this->belongsToMany(Club::class, 'club_sport_modules')
            ->withPivot(['is_active', 'activated_at'])
            ->withTimestamps();
    }
}
