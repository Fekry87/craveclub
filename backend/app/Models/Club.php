<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name', 'slug', 'logo_url', 'theme_color',
        'primary_color', 'secondary_color', 'accent_color', 'font_preference',
        'about', 'contact_email', 'contact_phone', 'is_active',
        'max_branches',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'max_branches' => 'integer',
        ];
    }

    public function canAddBranch(): bool
    {
        return $this->branches()->count() < $this->max_branches;
    }

    public function users(): HasMany { return $this->hasMany(User::class); }
    public function coachProfiles(): HasMany { return $this->hasMany(CoachProfile::class); }
    public function swimmerProfiles(): HasMany { return $this->hasMany(SwimmerProfile::class); }
    public function groups(): HasMany { return $this->hasMany(Group::class); }
    public function trainingPlans(): HasMany { return $this->hasMany(TrainingPlan::class); }
    public function skills(): HasMany { return $this->hasMany(Skill::class); }
    public function trainingSessions(): HasMany { return $this->hasMany(TrainingSession::class); }
    public function features(): HasOne { return $this->hasOne(ClubFeature::class); }
    public function branches(): HasMany { return $this->hasMany(Branch::class); }
    public function sports(): HasMany { return $this->hasMany(Sport::class); }
    public function subscriptionPlans(): HasMany { return $this->hasMany(SubscriptionPlan::class); }
    public function registrations(): HasMany { return $this->hasMany(Registration::class); }
}
