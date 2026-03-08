<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sport extends Model
{
    protected $fillable = [
        'club_id', 'name', 'slug', 'description',
        'icon', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
