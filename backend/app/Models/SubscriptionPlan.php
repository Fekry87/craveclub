<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'club_id', 'name', 'duration_months', 'price',
        'discount_percent', 'is_popular', 'is_active', 'display_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration_months' => 'integer',
            'discount_percent' => 'integer',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'plan_id');
    }
}
