<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class TrainingPlanAssignment extends Model
{
    use BelongsToClub;

    protected $fillable = [
        'training_plan_id', 'club_id', 'assigned_by_coach_id',
        'group_id', 'swimmer_profile_id',
        'start_date', 'end_date', 'status', 'coach_notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function trainingPlan()
    {
        return $this->belongsTo(TrainingPlan::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function swimmer()
    {
        return $this->belongsTo(SwimmerProfile::class, 'swimmer_profile_id');
    }

    public function assignedByCoach()
    {
        return $this->belongsTo(User::class, 'assigned_by_coach_id');
    }

    public function getAssigneeLabelAttribute(): string
    {
        if ($this->group) {
            return $this->group->name;
        }

        if ($this->swimmer) {
            return $this->swimmer->first_name.' '.$this->swimmer->last_name;
        }

        return 'Unknown';
    }
}
