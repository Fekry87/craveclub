<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringSchedule;
use App\Models\Group;
use App\Models\ScheduleHoliday;
use App\Models\TrainingSession;
use App\Services\SessionGeneratorService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecurringScheduleController extends Controller
{
    public function __construct(
        protected SessionGeneratorService $generator,
    ) {}

    public function index(): JsonResponse
    {
        $schedules = RecurringSchedule::where('club_id', app('current_club_id'))
            ->with(['group:id,name', 'coach:id,name'])
            ->withCount(['sessions', 'holidays'])
            ->latest()
            ->paginate(20);

        return response()->json($schedules);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'group_id' => ['required', 'integer', Rule::exists('groups', 'id')->where('club_id', app('current_club_id'))],
            'coach_user_id' => ['required', 'integer', Rule::exists('users', 'id')->where('club_id', app('current_club_id'))],
            'period_start' => 'required|date|after_or_equal:today',
            'period_end' => 'required|date|after:period_start',
            'days_of_week' => 'required|array|min:1',
            'days_of_week.*' => 'integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'duration_minutes' => 'integer|min:15|max:480',
            'location' => 'nullable|string|max:255',
            'training_plan_id' => ['nullable', 'integer', Rule::exists('training_plans', 'id')->where('club_id', app('current_club_id'))],
        ]);

        // Validate period span (max 366 days)
        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);
        if ($start->diffInDays($end) > 366) {
            return response()->json([
                'message' => 'Schedule period cannot exceed 366 days.',
                'errors' => ['period_end' => ['Schedule period cannot exceed 366 days.']],
            ], 422);
        }

        // Validate group belongs to club
        $group = Group::where('id', $validated['group_id'])
            ->where('club_id', app('current_club_id'))
            ->first();

        if (!$group) {
            return response()->json([
                'message' => 'Group not found in this club.',
                'errors' => ['group_id' => ['Group not found in this club.']],
            ], 422);
        }

        $schedule = RecurringSchedule::create(array_merge(
            $validated,
            [
                'club_id' => app('current_club_id'),
                'status' => 'draft',
            ]
        ));

        $schedule->load(['group:id,name', 'coach:id,name']);
        $schedule->loadCount(['sessions', 'holidays']);

        return response()->json($schedule, 201);
    }

    public function show(RecurringSchedule $recurringSchedule): JsonResponse
    {
        if ($recurringSchedule->club_id !== app('current_club_id')) {
            abort(404);
        }

        $recurringSchedule->load(['group:id,name', 'coach:id,name', 'holidays']);
        $recurringSchedule->loadCount(['sessions', 'holidays']);

        return response()->json($recurringSchedule);
    }

    public function preview(RecurringSchedule $recurringSchedule): JsonResponse
    {
        if ($recurringSchedule->club_id !== app('current_club_id')) {
            abort(404);
        }

        $result = $this->generator->preview($recurringSchedule);

        return response()->json($result);
    }

    public function generate(RecurringSchedule $recurringSchedule): JsonResponse
    {
        if ($recurringSchedule->club_id !== app('current_club_id')) {
            abort(404);
        }

        $result = $this->generator->generate($recurringSchedule);

        $recurringSchedule->update(['status' => 'active']);

        return response()->json([
            'message' => "Generated {$result['created']} sessions ({$result['skipped']} skipped).",
            'created' => $result['created'],
            'skipped' => $result['skipped'],
            'dates' => $result['dates'],
        ]);
    }

    public function addHolidays(Request $request, RecurringSchedule $recurringSchedule): JsonResponse
    {
        if ($recurringSchedule->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'dates' => 'required|array|min:1',
            'dates.*' => 'date',
            'reason' => 'nullable|string|max:255',
        ]);

        $created = [];
        foreach ($validated['dates'] as $date) {
            $holiday = ScheduleHoliday::firstOrCreate(
                [
                    'recurring_schedule_id' => $recurringSchedule->id,
                    'holiday_date' => $date,
                ],
                ['reason' => $validated['reason'] ?? null]
            );
            $created[] = $holiday;

            // Cancel existing sessions on this date
            TrainingSession::where('recurring_schedule_id', $recurringSchedule->id)
                ->whereDate('date', $date)
                ->update(['status' => 'Cancelled']);
        }

        return response()->json([
            'message' => count($created) . ' holiday(s) added.',
            'holidays' => $created,
        ]);
    }

    public function removeHoliday(RecurringSchedule $recurringSchedule, string $date): JsonResponse
    {
        if ($recurringSchedule->club_id !== app('current_club_id')) {
            abort(404);
        }

        $deleted = ScheduleHoliday::where('recurring_schedule_id', $recurringSchedule->id)
            ->whereDate('holiday_date', $date)
            ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Holiday not found.'], 404);
        }

        return response()->json(['message' => 'Holiday removed.']);
    }

    public function update(Request $request, RecurringSchedule $recurringSchedule): JsonResponse
    {
        if ($recurringSchedule->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'group_id' => ['sometimes', 'integer', Rule::exists('groups', 'id')->where('club_id', app('current_club_id'))],
            'coach_user_id' => ['sometimes', 'integer', Rule::exists('users', 'id')->where('club_id', app('current_club_id'))],
            'period_start' => 'sometimes|date',
            'period_end' => 'sometimes|date',
            'days_of_week' => 'sometimes|array|min:1',
            'days_of_week.*' => 'integer|between:0,6',
            'start_time' => 'sometimes|date_format:H:i',
            'duration_minutes' => 'sometimes|integer|min:15|max:480',
            'location' => 'nullable|string|max:255',
            'training_plan_id' => ['nullable', 'integer', Rule::exists('training_plans', 'id')->where('club_id', app('current_club_id'))],
        ]);

        // Validate period span if dates are provided
        $start = Carbon::parse($validated['period_start'] ?? $recurringSchedule->period_start);
        $end = Carbon::parse($validated['period_end'] ?? $recurringSchedule->period_end);
        if ($start->diffInDays($end) > 366) {
            return response()->json([
                'message' => 'Schedule period cannot exceed 366 days.',
                'errors' => ['period_end' => ['Schedule period cannot exceed 366 days.']],
            ], 422);
        }

        // Validate group belongs to club if changed
        if (isset($validated['group_id'])) {
            $group = Group::where('id', $validated['group_id'])
                ->where('club_id', app('current_club_id'))
                ->first();
            if (!$group) {
                return response()->json([
                    'message' => 'Group not found in this club.',
                    'errors' => ['group_id' => ['Group not found in this club.']],
                ], 422);
            }
        }

        $recurringSchedule->update($validated);
        $recurringSchedule->load(['group:id,name', 'coach:id,name', 'holidays']);
        $recurringSchedule->loadCount(['sessions', 'holidays']);

        return response()->json($recurringSchedule);
    }

    public function destroy(RecurringSchedule $recurringSchedule): JsonResponse
    {
        if ($recurringSchedule->club_id !== app('current_club_id')) {
            abort(404);
        }

        // Delete ALL sessions generated by this schedule
        TrainingSession::where('recurring_schedule_id', $recurringSchedule->id)->delete();

        $recurringSchedule->delete();

        return response()->json(['message' => 'Schedule and all its sessions deleted.']);
    }
}
