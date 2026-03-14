<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCoachRequest;
use App\Http\Requests\UpdateCoachRequest;
use App\Enums\UserRole;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachManagementController extends Controller
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

    public function coachIndex(Request $request): JsonResponse
    {
        $query = CoachProfile::with('user');
        if ($search = $request->input('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }
        if ($branchId = $request->input('branch_id')) {
            $query->where('branch_id', $branchId);
        }
        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function sportIndex(Request $request): JsonResponse
    {
        $coachUserIds = Group::where('club_id', app('current_club_id'))
            ->where('sport_module_id', app('current_sport_module_id'))
            ->whereNotNull('coach_user_id')
            ->distinct()
            ->pluck('coach_user_id');

        $coaches = CoachProfile::where('club_id', app('current_club_id'))
            ->whereIn('user_id', $coachUserIds)
            ->with('user')
            ->latest()
            ->get();

        return response()->json(['data' => $coaches]);
    }

    public function coachStore(StoreCoachRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => UserRole::COACH,
            'club_id' => $request->user()->club_id,
        ]);

        $profile = CoachProfile::create([
            'club_id' => $request->user()->club_id,
            'user_id' => $user->id,
            'bio' => $request->bio,
            'specialization' => $request->specialization,
            'phone' => $request->phone,
        ]);

        return response()->json($profile->load('user'), 201);
    }

    public function coachShow(CoachProfile $coach): JsonResponse
    {
        $this->assertOwnership($coach);
        return response()->json($coach->load('user'));
    }

    public function coachUpdate(UpdateCoachRequest $request, CoachProfile $coach): JsonResponse
    {
        $this->assertOwnership($coach);

        if ($request->has('name') && $coach->user) {
            $coach->user->update(['name' => $request->name]);
        }

        $coach->update($request->only(['bio', 'specialization', 'phone']));
        return response()->json($coach->load('user'));
    }

    public function coachDestroy(CoachProfile $coach): JsonResponse
    {
        $this->assertOwnership($coach);

        AuditService::log('coach.deleted', CoachProfile::class, $coach->id, [
            'coach_name' => $coach->user?->name,
            'user_id' => $coach->user_id,
        ]);

        if ($coach->user) {
            $coach->user->delete();
        }
        $coach->delete();
        return response()->json(['message' => 'Coach deleted']);
    }
}
