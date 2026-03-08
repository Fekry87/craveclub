<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingSession extends Model
{
    use BelongsToClub, SoftDeletes;

    protected $fillable = [
        'club_id', 'branch_id', 'coach_user_id', 'group_id', 'plan_id',
        'title', 'type', 'status',
        'date', 'start_time', 'end_time', 'location', 'notes',
        'started_at', 'completed_at', 'summary_notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function group() { return $this->belongsTo(Group::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function plan() { return $this->belongsTo(TrainingPlan::class, 'plan_id'); }
    public function coach() { return $this->belongsTo(User::class, 'coach_user_id'); }
    public function attendances() { return $this->hasMany(Attendance::class, 'session_id'); }
    public function evaluations() { return $this->hasMany(DailyEvaluation::class, 'session_id'); }
    public function groupEvaluation() { return $this->hasOne(GroupEvaluation::class, 'session_id'); }

    public function sessionSwimmers()
    {
        return $this->belongsToMany(SwimmerProfile::class, 'session_swimmers', 'session_id', 'swimmer_id');
    }

    public function sessionExclusions()
    {
        return $this->belongsToMany(SwimmerProfile::class, 'session_exclusions', 'session_id', 'swimmer_id');
    }

    /**
     * Get the effective roster for this session.
     * Effective = (Group swimmers ∪ Session swimmers) − Excluded swimmers
     */
    public function getEffectiveSwimmersAttribute()
    {
        $groupSwimmerIds = $this->group ? $this->group->swimmers->pluck('id') : collect();
        $addedSwimmerIds = $this->sessionSwimmers->pluck('id');
        $excludedSwimmerIds = $this->sessionExclusions->pluck('id');

        $effectiveIds = $groupSwimmerIds->merge($addedSwimmerIds)->unique()->diff($excludedSwimmerIds);

        return SwimmerProfile::whereIn('id', $effectiveIds)->get();
    }
}
