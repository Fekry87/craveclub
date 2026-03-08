<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'club_id', 'name', 'address', 'city',
        'phone', 'working_hours', 'photos', 'is_active',
        'features', 'description', 'capacity',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'features' => 'array',
            'is_active' => 'boolean',
            'capacity' => 'integer',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function coaches(): HasMany
    {
        return $this->hasMany(CoachProfile::class);
    }

    public function swimmers(): HasMany
    {
        return $this->hasMany(SwimmerProfile::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }

    public function isFeatureEnabled(string $feature): bool
    {
        if ($this->features && array_key_exists($feature, $this->features)) {
            return (bool) $this->features[$feature];
        }

        return ClubFeature::forClub($this->club_id)->isEnabled($feature);
    }
}
