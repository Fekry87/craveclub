<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingPlan extends Model
{
    use BelongsToClub, SoftDeletes;

    protected $fillable = [
        'club_id', 'coach_user_id', 'sport_module_id',
        'title', 'level', 'description',
        'duration_weeks', 'duration_unit', 'sessions_per_week',
        'goals', 'difficulty_level', 'is_template', 'phases',
    ];

    protected function casts(): array
    {
        return [
            'is_template' => 'boolean',
            'phases' => 'array',
            'duration_weeks' => 'integer',
            'sessions_per_week' => 'integer',
        ];
    }

    public function items()
    {
        return $this->hasMany(TrainingPlanItem::class, 'plan_id')->orderBy('sort_order');
    }

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_user_id');
    }

    public function sportModule()
    {
        return $this->belongsTo(SportModule::class);
    }

    public function assignments()
    {
        return $this->hasMany(TrainingPlanAssignment::class);
    }

    public function activeAssignments()
    {
        return $this->hasMany(TrainingPlanAssignment::class)->where('status', 'active');
    }
}
