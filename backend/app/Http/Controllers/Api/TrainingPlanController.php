<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\SwimmerProfile;
use App\Models\TrainingPlan;
use App\Models\TrainingPlanAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingPlanController extends Controller
{
    public function sportIndex(Request $request): JsonResponse
    {
        $plans = TrainingPlan::where('club_id', app('current_club_id'))
            ->where('sport_module_id', app('current_sport_module_id'))
            ->with(['items', 'coach'])
            ->withCount('assignments', 'activeAssignments')
            ->latest()
            ->get();

        return response()->json(['data' => $plans]);
    }

    // ── Club Manager: Assign plan to coach ──

    public function assignToCoach(Request $request, TrainingPlan $plan): JsonResponse
    {
        $clubId = app('current_club_id');
        if ($plan->club_id !== $clubId) {
            abort(404);
        }

        $request->validate([
            'coach_user_id' => 'required|integer',
        ]);

        $coach = User::where('id', $request->coach_user_id)
            ->where('club_id', $clubId)
            ->where('role', 'COACH')
            ->first();

        if (! $coach) {
            return response()->json(['message' => 'Coach not found in this club.', 'errors' => ['coach_user_id' => ['Coach not found in this club.']]], 422);
        }

        $plan->update(['coach_user_id' => $coach->id]);

        return response()->json($plan->load('coach'));
    }

    // ── Coach: List training plans ──

    public function coachPlans(Request $request): JsonResponse
    {
        $user = $request->user();
        $clubId = app('current_club_id');

        $query = TrainingPlan::where('club_id', $clubId)
            ->where(function ($q) use ($user) {
                $q->where('coach_user_id', $user->id)
                  ->orWhere('is_template', true);
            });

        if (app()->bound('current_sport_module_id')) {
            $query->where('sport_module_id', app('current_sport_module_id'));
        }

        $plans = $query->with(['items', 'coach'])
            ->withCount('assignments', 'activeAssignments')
            ->latest()
            ->get();

        return response()->json($plans);
    }

    // ── Coach: Assign plan to group or swimmer ──

    public function assign(Request $request, TrainingPlan $plan): JsonResponse
    {
        $user = $request->user();
        $clubId = app('current_club_id');

        if ($plan->club_id !== $clubId) {
            abort(404);
        }

        // Coach must own the plan or it must be a template
        if ($plan->coach_user_id !== $user->id && ! $plan->is_template) {
            return response()->json(['message' => 'You do not have access to this plan.'], 403);
        }

        $request->validate([
            'assignee_type' => 'required|in:group,swimmer',
            'assignee_id' => 'required|integer',
            'start_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $groupId = null;
        $swimmerProfileId = null;

        if ($request->assignee_type === 'group') {
            $group = Group::where('id', $request->assignee_id)
                ->where('club_id', $clubId)
                ->where('coach_user_id', $user->id)
                ->first();

            if (! $group) {
                return response()->json(['message' => 'Group not found or does not belong to you.', 'errors' => ['assignee_id' => ['Group not found or does not belong to you.']]], 422);
            }
            $groupId = $group->id;
        } else {
            $swimmer = SwimmerProfile::where('id', $request->assignee_id)
                ->where('club_id', $clubId)
                ->first();

            if (! $swimmer) {
                return response()->json(['message' => 'Swimmer not found.', 'errors' => ['assignee_id' => ['Swimmer not found.']]], 422);
            }

            // Check for existing active assignment
            $existing = TrainingPlanAssignment::where('swimmer_profile_id', $swimmer->id)
                ->where('status', 'active')
                ->first();

            if ($existing) {
                return response()->json(['message' => 'This swimmer already has an active training plan.', 'errors' => ['assignee_id' => ['This swimmer already has an active training plan.']]], 422);
            }

            $swimmerProfileId = $swimmer->id;
        }

        $startDate = Carbon::parse($request->start_date);
        $endDate = $startDate->copy()->addDays($plan->duration_weeks * 7);

        $assignment = TrainingPlanAssignment::create([
            'training_plan_id' => $plan->id,
            'club_id' => $clubId,
            'assigned_by_coach_id' => $user->id,
            'group_id' => $groupId,
            'swimmer_profile_id' => $swimmerProfileId,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'status' => 'active',
            'coach_notes' => $request->notes,
        ]);

        return response()->json(
            $assignment->load(['trainingPlan', 'group', 'swimmer', 'assignedByCoach']),
            201
        );
    }

    // ── Coach: List assignments ──

    public function coachAssignments(Request $request): JsonResponse
    {
        $user = $request->user();
        $clubId = app('current_club_id');

        $assignments = TrainingPlanAssignment::where('club_id', $clubId)
            ->where('assigned_by_coach_id', $user->id)
            ->with(['trainingPlan', 'group', 'swimmer', 'assignedByCoach'])
            ->latest()
            ->get();

        return response()->json($assignments);
    }

    // ── Coach: Update assignment status ──

    public function updateAssignment(Request $request, TrainingPlanAssignment $assignment): JsonResponse
    {
        $user = $request->user();
        $clubId = app('current_club_id');

        if ($assignment->club_id !== $clubId || $assignment->assigned_by_coach_id !== $user->id) {
            abort(404);
        }

        $request->validate([
            'status' => 'required|in:paused,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $assignment->update([
            'status' => $request->status,
            'coach_notes' => $request->notes ?? $assignment->coach_notes,
        ]);

        return response()->json(
            $assignment->load(['trainingPlan', 'group', 'swimmer', 'assignedByCoach'])
        );
    }

    // ── Swimmer: Get active training plan ──

    public function swimmerPlan(Request $request): JsonResponse
    {
        $user = $request->user();

        $swimmerProfile = SwimmerProfile::where('user_id', $user->id)->first();

        if (! $swimmerProfile) {
            return response()->json(['message' => 'Swimmer profile not found.'], 404);
        }

        // Get group IDs the swimmer belongs to
        $groupIds = $swimmerProfile->groups()->pluck('groups.id');

        // Find active assignment: direct (swimmer_profile_id) OR group-based
        $assignment = TrainingPlanAssignment::where('status', 'active')
            ->where(function ($q) use ($swimmerProfile, $groupIds) {
                $q->where('swimmer_profile_id', $swimmerProfile->id)
                  ->orWhereIn('group_id', $groupIds);
            })
            ->with(['trainingPlan.items', 'assignedByCoach'])
            ->latest()
            ->first();

        if (! $assignment) {
            return response()->json(['message' => 'No active training plan.'], 404);
        }

        $plan = $assignment->trainingPlan;

        // Unset the nested trainingPlan from assignment to avoid circular reference
        $assignmentData = $assignment->toArray();
        unset($assignmentData['training_plan']);

        return response()->json([
            'assignment' => $assignmentData,
            'plan' => $plan->load('items'),
            'phases' => $plan->phases ?? [],
        ]);
    }
}
