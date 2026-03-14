<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleHoliday extends Model
{
    protected $fillable = [
        'recurring_schedule_id', 'holiday_date', 'reason',
    ];

    protected function casts(): array
    {
        return [
            'holiday_date' => 'date',
        ];
    }

    public function schedule()
    {
        return $this->belongsTo(RecurringSchedule::class, 'recurring_schedule_id');
    }
}
