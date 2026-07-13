<?php

namespace App\Services;

use App\Models\CoachProfile;
use App\Models\RecurringSchedule;
use App\Models\TrainingSession;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class SessionGeneratorService
{
    /**
     * Generate training sessions for a recurring schedule.
     * Idempotent: skips dates that already have sessions for this schedule.
     *
     * @return array{created: int, skipped: int, dates: array}
     */
    public function generate(RecurringSchedule $schedule): array
    {
        // Groups have no branch column; the schedule's coach carries the branch.
        $branchId = $schedule->coach_user_id
            ? CoachProfile::where('user_id', $schedule->coach_user_id)->value('branch_id')
            : null;

        $dates = $this->computeDates($schedule);
        $existingDates = TrainingSession::where('recurring_schedule_id', $schedule->id)
            ->pluck('date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $holidayDates = $schedule->holidays()->pluck('holiday_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $toCreate = [];
        $skipped = 0;

        foreach ($dates as $date) {
            $dateStr = $date->toDateString();

            if (in_array($dateStr, $existingDates) || in_array($dateStr, $holidayDates)) {
                $skipped++;

                continue;
            }

            $endTime = Carbon::parse($schedule->start_time)
                ->addMinutes($schedule->duration_minutes)
                ->format('H:i:s');

            $toCreate[] = [
                'club_id' => $schedule->club_id,
                'branch_id' => $branchId,
                'coach_user_id' => $schedule->coach_user_id,
                'group_id' => $schedule->group_id,
                'plan_id' => $schedule->training_plan_id,
                'recurring_schedule_id' => $schedule->id,
                'title' => $schedule->name,
                'type' => 'training',
                'status' => 'Scheduled',
                'date' => $dateStr,
                'start_time' => $schedule->start_time,
                'end_time' => $endTime,
                'location' => $schedule->location,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::transaction(function () use ($toCreate) {
            foreach (array_chunk($toCreate, 100) as $chunk) {
                TrainingSession::insert($chunk);
            }
        });

        return [
            'created' => count($toCreate),
            'skipped' => $skipped,
            'dates' => array_map(fn ($r) => $r['date'], $toCreate),
        ];
    }

    /**
     * Compute all dates within the schedule period that match days_of_week.
     *
     * @return Carbon[]
     */
    public function computeDates(RecurringSchedule $schedule): array
    {
        $period = CarbonPeriod::create(
            $schedule->period_start,
            $schedule->period_end
        );

        $daysOfWeek = $schedule->days_of_week ?? [];
        $dates = [];

        foreach ($period as $date) {
            if (in_array($date->dayOfWeek, $daysOfWeek)) {
                $dates[] = $date->copy();
            }
        }

        return $dates;
    }

    /**
     * Preview what sessions would be generated (no DB writes).
     *
     * @return array{dates: array, holiday_dates: array, total: int}
     */
    public function preview(RecurringSchedule $schedule): array
    {
        $allDates = $this->computeDates($schedule);
        $holidayDates = $schedule->holidays()->pluck('holiday_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $effectiveDates = [];
        foreach ($allDates as $date) {
            $dateStr = $date->toDateString();
            if (! in_array($dateStr, $holidayDates)) {
                $effectiveDates[] = $dateStr;
            }
        }

        return [
            'dates' => $effectiveDates,
            'holiday_dates' => $holidayDates,
            'total' => count($effectiveDates),
        ];
    }
}
