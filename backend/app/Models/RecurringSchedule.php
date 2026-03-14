<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class RecurringSchedule extends Model
{
    use BelongsToClub;

    protected $fillable = [
        'club_id', 'group_id', 'coach_user_id', 'name',
        'period_start', 'period_end', 'days_of_week',
        'start_time', 'duration_minutes', 'location',
        'status', 'training_plan_id',
    ];

    protected function casts(): array
    {
        return [
            'days_of_week' => 'array',
            'period_start' => 'date',
            'period_end' => 'date',
            'duration_minutes' => 'integer',
        ];
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_user_id');
    }

    public function trainingPlan()
    {
        return $this->belongsTo(TrainingPlan::class);
    }

    public function holidays()
    {
        return $this->hasMany(ScheduleHoliday::class);
    }

    public function sessions()
    {
        return $this->hasMany(TrainingSession::class, 'recurring_schedule_id');
    }

    public function getDaysOfWeekLabelsAttribute(): array
    {
        $labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return array_map(fn ($d) => $labels[$d] ?? '?', $this->days_of_week ?? []);
    }
}
