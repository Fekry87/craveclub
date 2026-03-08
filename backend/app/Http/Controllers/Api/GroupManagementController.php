<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Models\Group;
use App\Models\GroupMembership;
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

    public function groupIndex(Request $request): JsonResponse
    {
        $query = Group::with(['coach', 'swimmers']);
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function groupStore(StoreGroupRequest $request): JsonResponse
    {
        $group = Group::create($request->only(['name', 'description', 'coach_user_id']));
        return response()->json($group->load(['coach', 'swimmers']), 201);
    }

    public function groupShow(Group $group): JsonResponse
    {
        $this->assertOwnership($group);
        return response()->json($group->load(['coach', 'swimmers', 'plans']));
    }

    public function groupUpdate(UpdateGroupRequest $request, Group $group): JsonResponse
    {
        $this->assertOwnership($group);

        $group->update($request->only(['name', 'description', 'coach_user_id']));
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
