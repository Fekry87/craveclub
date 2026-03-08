<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use App\Models\CoachSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachScheduleController extends Controller
{
    public function show(CoachProfile $coach): JsonResponse
    {
        if ($coach->club_id !== app('current_club_id')) {
            abort(404);
        }

        $schedules = CoachSchedule::where('coach_id', $coach->id)->get();

        return response()->json($schedules);
    }

    public function update(Request $request, CoachProfile $coach): JsonResponse
    {
        if ($coach->club_id !== app('current_club_id')) {
            abort(404);
        }

        $request->validate([
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'schedules.*.slots' => 'required|array',
            'schedules.*.slots.*.time' => 'required|string',
            'schedules.*.slots.*.is_available' => 'required|boolean',
            'schedules.*.slots.*.max_capacity' => 'required|integer|min:1',
        ]);

        try {
            foreach ($request->schedules as $schedule) {
                CoachSchedule::updateOrCreate(
                    [
                        'coach_id' => $coach->id,
                        'day_of_week' => $schedule['day_of_week'],
                    ],
                    [
                        'slots' => $schedule['slots'],
                    ]
                );
            }

            $schedules = CoachSchedule::where('coach_id', $coach->id)->get();

            return response()->json($schedules);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update schedule'], 500);
        }
    }
}
