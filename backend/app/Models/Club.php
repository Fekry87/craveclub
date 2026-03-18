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
        'name', 'display_name', 'slug', 'logo_url', 'cover_url', 'favicon_url',
        'theme_color', 'primary_color', 'secondary_color', 'accent_color', 'font_preference',
        'app_name', 'about', 'contact_email', 'contact_phone',
        'support_email', 'support_phone', 'social_links',
        'custom_domain', 'is_domain_active', 'branding_tier',
        'is_active', 'max_branches',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_domain_active' => 'boolean',
            'max_branches' => 'integer',
            'social_links' => 'array',
        ];
    }

    public function canAddBranch(): bool
    {
        return $this->branches()->count() < $this->max_branches;
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function coachProfiles(): HasMany
    {
        return $this->hasMany(CoachProfile::class);
    }

    public function swimmerProfiles(): HasMany
    {
        return $this->hasMany(SwimmerProfile::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }

    public function trainingPlans(): HasMany
    {
        return $this->hasMany(TrainingPlan::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    public function trainingSessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }

    public function features(): HasOne
    {
        return $this->hasOne(ClubFeature::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function sports(): HasMany
    {
        return $this->hasMany(Sport::class);
    }

    public function subscriptionPlans(): HasMany
    {
        return $this->hasMany(SubscriptionPlan::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function sportModules()
    {
        return $this->belongsToMany(SportModule::class, 'club_sport_modules')
            ->withPivot(['is_active', 'activated_at'])
            ->withTimestamps();
    }

    public function activeSportModules()
    {
        return $this->sportModules()->wherePivot('is_active', true);
    }
}
