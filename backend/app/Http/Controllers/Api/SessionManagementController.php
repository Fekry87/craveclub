<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSessionRequest;
use App\Http\Requests\UpdateSessionRequest;
use App\Models\Attendance;
use App\Models\DailyEvaluation;
use App\Models\Group;
use App\Models\TrainingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionManagementController extends Controller
{
    /**
     * Guard: abort 404 if the model doesn't belong to the current club.
     */
    private function assertOwnership(mixed $model): void
    {
        abort_if(
            $model->club_id !== app('current_club_id'),
            404,
            'Resource not found.'
        );
    }

    public function sessionIndex(Request $request): JsonResponse
    {
        $query = TrainingSession::with(['group', 'plan']);
        if ($date = $request->input('date')) {
            $query->where('date', $date);
        }
        if ($groupId = $request->input('group_id')) {
            $query->where('group_id', $groupId);
        }
        if ($branchId = $request->input('branch_id')) {
            $query->where('branch_id', $branchId);
        }
        if ($request->boolean('with_attendance')) {
            $query->withCount([
                'attendances as attendance_total',
                'attendances as attendance_present' => fn ($q) => $q->where('present', true),
            ]);
        }

        return response()->json($query->orderBy('date', 'desc')->orderBy('start_time')->paginate($request->input('per_page', 15)));
    }

    public function sessionStore(StoreSessionRequest $request): JsonResponse
    {
        $sportModuleId = $request->sport_module_id;
        if (! $sportModuleId && $request->group_id) {
            $group = Group::find($request->group_id);
            $sportModuleId = $group?->sport_module_id;
        }

        $session = TrainingSession::create(array_merge(
            $request->only(['group_id', 'plan_id', 'date', 'start_time', 'end_time', 'location', 'notes']),
            [
                'club_id' => $request->user()->club_id,
                'sport_module_id' => $sportModuleId,
            ]
        ));

        return response()->json($session->load(['group', 'plan']), 201);
    }

    public function sportIndex(Request $request): JsonResponse
    {
        $sessions = TrainingSession::where('club_id', app('current_club_id'))
            ->where('sport_module_id', app('current_sport_module_id'))
            ->with(['group', 'plan'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time')
            ->get();

        return response()->json(['data' => $sessions]);
    }

    public function sportStore(StoreSessionRequest $request): JsonResponse
    {
        $session = TrainingSession::create(array_merge(
            $request->only(['group_id', 'plan_id', 'date', 'start_time', 'end_time', 'location', 'notes']),
            [
                'club_id' => $request->user()->club_id,
                'sport_module_id' => app('current_sport_module_id'),
            ]
        ));

        return response()->json($session->load(['group', 'plan']), 201);
    }

    public function sessionShow(TrainingSession $session): JsonResponse
    {
        $this->assertOwnership($session);

        return response()->json($session->load(['group.swimmers', 'plan.items', 'attendances.swimmer', 'evaluations.swimmer', 'groupEvaluation']));
    }

    public function sessionAttendance(TrainingSession $session): JsonResponse
    {
        $this->assertOwnership($session);
        $session->load(['group.swimmers', 'sessionSwimmers', 'sessionExclusions']);

        $effectiveSwimmers = $session->effective_swimmers;
        $attendances = Attendance::where('session_id', $session->id)->get()->keyBy('swimmer_id');
        $evaluations = DailyEvaluation::where('session_id', $session->id)->get()->keyBy('swimmer_id');

        $roster = $effectiveSwimmers->map(function ($swimmer) use ($attendances, $evaluations) {
            $att = $attendances->get($swimmer->id);
            $eval = $evaluations->get($swimmer->id);

            return [
                'swimmer_id' => $swimmer->id,
                'first_name' => $swimmer->first_name,
                'last_name' => $swimmer->last_name,
                'avatar_url' => $swimmer->avatar_url ?? null,
                'present' => $att ? (bool) $att->present : false,
                'evaluated' => $eval !== null,
                'rating' => $eval?->rating,
                'notes' => $eval?->notes,
            ];
        })->values();

        $presentCount = $roster->where('present', true)->count();

        return response()->json([
            'session' => [
                'id' => $session->id,
                'title' => $session->title,
                'date' => $session->date?->toDateString(),
                'start_time' => $session->start_time,
                'status' => $session->status,
                'group_id' => $session->group_id,
            ],
            'roster' => $roster,
            'summary' => [
                'total' => $roster->count(),
                'present' => $presentCount,
                'absent' => $roster->count() - $presentCount,
                'evaluated' => $roster->where('evaluated', true)->count(),
            ],
        ]);
    }

    public function sessionUpdate(UpdateSessionRequest $request, TrainingSession $session): JsonResponse
    {
        $this->assertOwnership($session);

        $session->update($request->only(['group_id', 'plan_id', 'date', 'start_time', 'end_time', 'location', 'notes']));

        return response()->json($session->load(['group', 'plan']));
    }

    public function sessionDestroy(TrainingSession $session): JsonResponse
    {
        $this->assertOwnership($session);
        $session->delete();

        return response()->json(['message' => 'Session deleted']);
    }
}
