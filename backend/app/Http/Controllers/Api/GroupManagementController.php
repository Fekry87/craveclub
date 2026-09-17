<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Services\GroupScheduleConflictService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GroupManagementController extends Controller
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

    private const SCHEDULE_FIELDS = ['name', 'description', 'coach_user_id', 'group_type', 'capacity', 'days_of_week', 'start_time', 'end_time'];

    /**
     * 422 with the clashing group when the coach already meets another group on a
     * shared day at an overlapping time. `$group` is the one being edited (so it is
     * excluded from the search) and supplies whatever fields the request left out.
     */
    private function scheduleConflict(Request $request, ?Group $group = null): ?JsonResponse
    {
        $coachId = $request->has('coach_user_id') ? $request->input('coach_user_id') : $group?->coach_user_id;
        $days = $request->has('days_of_week') ? $request->input('days_of_week') : $group?->days_of_week;
        $start = $request->input('start_time', $group?->start_time);
        $end = $request->input('end_time', $group?->end_time);

        if (! $coachId || empty($days) || ! $start || ! $end) {
            return null;
        }

        $conflict = app(GroupScheduleConflictService::class)->findConflict(
            coachUserId: (int) $coachId,
            daysOfWeek: $days,
            startTime: $start,
            endTime: $end,
            excludeGroupId: $group?->id,
        );

        if (! $conflict) {
            return null;
        }

        $days = implode(', ', $conflict->days_of_week_labels);
        $window = substr($conflict->start_time, 0, 5).'–'.substr($conflict->end_time, 0, 5);

        return response()->json([
            'message' => "This coach already has \"{$conflict->name}\" on {$days} at {$window}. Pick a different time or day.",
            'conflicting_group' => [
                'id' => $conflict->id,
                'name' => $conflict->name,
                'days_of_week' => $conflict->days_of_week,
                'days_of_week_labels' => $conflict->days_of_week_labels,
                'start_time' => substr($conflict->start_time, 0, 5),
                'end_time' => substr($conflict->end_time, 0, 5),
            ],
        ], 422);
    }

    public function groupIndex(Request $request): JsonResponse
    {
        // Explicit club scope (defense-in-depth on top of the BelongsToClub global scope).
        $query = Group::where('club_id', app('current_club_id'))->with(['coach', 'swimmers']);
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function groupStore(StoreGroupRequest $request): JsonResponse
    {
        if ($conflict = $this->scheduleConflict($request)) {
            return $conflict;
        }

        $data = $request->only(self::SCHEDULE_FIELDS);

        if ($request->filled('sport_module_id')) {
            $request->validate(['sport_module_id' => 'integer|exists:sport_modules,id']);
            $assigned = \DB::table('club_sport_modules')
                ->where('club_id', app('current_club_id'))
                ->where('sport_module_id', $request->sport_module_id)
                ->where('is_active', true)
                ->exists();
            if (! $assigned) {
                abort(422, 'Sport module not assigned to this club.');
            }
            $data['sport_module_id'] = $request->sport_module_id;
        }

        $group = Group::create($data);

        return response()->json($group->load(['coach', 'swimmers']), 201);
    }

    public function sportIndex(Request $request): JsonResponse
    {
        $groups = Group::where('club_id', app('current_club_id'))
            ->where('sport_module_id', app('current_sport_module_id'))
            ->with(['coach', 'swimmers', 'sportModule'])
            ->latest()
            ->get();

        return response()->json(['data' => $groups]);
    }

    public function sportStore(StoreGroupRequest $request): JsonResponse
    {
        if ($conflict = $this->scheduleConflict($request)) {
            return $conflict;
        }

        $data = $request->only(self::SCHEDULE_FIELDS);
        $data['sport_module_id'] = app('current_sport_module_id');

        $group = Group::create($data);

        return response()->json($group->load(['coach', 'swimmers', 'sportModule']), 201);
    }

    public function groupShow(Group $group): JsonResponse
    {
        $this->assertOwnership($group);

        return response()->json($group->load(['coach', 'swimmers', 'plans']));
    }

    public function groupUpdate(UpdateGroupRequest $request, Group $group): JsonResponse
    {
        $this->assertOwnership($group);

        if ($conflict = $this->scheduleConflict($request, $group)) {
            return $conflict;
        }

        $group->update($request->only(self::SCHEDULE_FIELDS));

        return response()->json($group->load(['coach', 'swimmers']));
    }

    public function groupDestroy(Group $group): JsonResponse
    {
        $this->assertOwnership($group);
        $group->delete();

        return response()->json(['message' => 'Group deleted']);
    }

    public function groupMembers(Request $request, Group $group): JsonResponse
    {
        $this->assertOwnership($group);
        $request->validate([
            'swimmer_ids' => 'required|array',
            'swimmer_ids.*' => [
                Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id')),
            ],
        ]);

        GroupMembership::where('group_id', $group->id)->delete();
        foreach ($request->swimmer_ids as $swimmerId) {
            GroupMembership::create([
                'club_id' => $request->user()->club_id,
                'group_id' => $group->id,
                'swimmer_id' => $swimmerId,
            ]);
        }

        return response()->json($group->load('swimmers'));
    }
}
