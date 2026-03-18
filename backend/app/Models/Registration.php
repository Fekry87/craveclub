<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Registration extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'club_id', 'sport_module_id', 'branch_id', 'coach_id', 'plan_id',
        'full_name', 'phone', 'guardian_name', 'guardian_phone', 'guardian_email',
        'gender', 'birth_date', 'avatar_url',
        'height_cm', 'weight_kg', 'fitness_level', 'prior_experience',
        'medical_notes', 'sport_ids', 'experience_level', 'years_experience',
        'competed', 'primary_goal', 'weekly_frequency', 'preferred_time',
        'payment_method', 'status', 'total_amount', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'sport_ids' => 'array',
            'birth_date' => 'date',
            'prior_experience' => 'boolean',
            'competed' => 'boolean',
            'total_amount' => 'decimal:2',
            'height_cm' => 'integer',
            'weight_kg' => 'integer',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(CoachProfile::class, 'coach_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function sportModule(): BelongsTo
    {
        return $this->belongsTo(SportModule::class);
    }
}
