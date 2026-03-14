<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubSportModule extends Model
{
    protected $table = 'club_sport_modules';

    protected $fillable = ['club_id', 'sport_module_id', 'is_active', 'activated_at'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'activated_at' => 'datetime',
        ];
    }

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function sportModule()
    {
        return $this->belongsTo(SportModule::class);
    }
}
