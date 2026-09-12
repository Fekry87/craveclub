<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSwimmerRequest;
use App\Http\Requests\UpdateSwimmerRequest;
use App\Models\Group;
use App\Models\SwimmerProfile;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SwimmerManagementController extends Controller
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

    public function pendingDeletion(): JsonResponse
    {
        $members = User::withTrashed()
            ->with(['swimmerProfile:id,user_id,first_name,last_name', 'coachProfile:id,user_id'])
            ->where('club_id', app('current_club_id'))
            ->whereNotNull('deletion_requested_at')
            ->whereNotNull('scheduled_purge_at')
            ->where('scheduled_purge_at', '>', now())
            ->orderBy('scheduled_purge_at', 'asc')
            ->get(['id', 'name', 'email', 'role', 'deletion_requested_at', 'scheduled_purge_at']);

        // Use SwimmerProfile name (authoritative) when available
        $members->transform(function ($user) {
            if ($user->swimmerProfile) {
                $user->name = trim($user->swimmerProfile->first_name.' '.$user->swimmerProfile->last_name);
            }
            unset($user->swimmerProfile, $user->coachProfile);

            return $user;
        });

        return response()->json([
            'data' => $members,
            'total' => $members->count(),
        ]);
    }

    public function swimmerIndex(Request $request): JsonResponse
    {
        // Explicit club scope (defense-in-depth on top of the BelongsToClub global scope).
        $query = SwimmerProfile::where('club_id', app('current_club_id'))->with('user');
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }
        if ($branchId = $request->input('branch_id')) {
            $query->where('branch_id', $branchId);
        }

        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function sportIndex(Request $request): JsonResponse
    {
        $groupIds = Group::where('club_id', app('current_club_id'))
            ->where('sport_module_id', app('current_sport_module_id'))
            ->pluck('id');

        $swimmers = SwimmerProfile::where('club_id', app('current_club_id'))
            ->whereHas('groups', function ($q) use ($groupIds) {
                $q->whereIn('groups.id', $groupIds);
            })
            ->with('user')
            ->latest()
            ->get();

        return response()->json(['data' => $swimmers]);
    }

    public function swimmerStore(StoreSwimmerRequest $request): JsonResponse
    {
        $userId = null;
        if ($request->create_login) {
            $user = User::create([
                'name' => $request->first_name.' '.$request->last_name,
                'email' => $request->email,
                'password' => $request->password,
                'role' => UserRole::SWIMMER,
                'club_id' => $request->user()->club_id,
            ]);
            $userId = $user->id;
        }

        $swimmer = SwimmerProfile::create([
            'club_id' => $request->user()->club_id,
            'user_id' => $userId,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'level' => $request->level,
            'date_of_birth' => $request->date_of_birth,
            'guardian_name' => $request->guardian_name,
            'guardian_phone' => $request->guardian_phone,
            'guardian_email' => $request->guardian_email,
            'medical_notes' => $request->medical_notes,
        ]);

        return response()->json($swimmer->load('user'), 201);
    }

    public function swimmerShow(SwimmerProfile $swimmer): JsonResponse
    {
        $this->assertOwnership($swimmer);

        return response()->json($swimmer->load(['user', 'groups']));
    }

    public function swimmerUpdate(UpdateSwimmerRequest $request, SwimmerProfile $swimmer): JsonResponse
    {
        $this->assertOwnership($swimmer);

        $swimmer->update($request->only([
            'first_name', 'last_name', 'level', 'date_of_birth',
            'guardian_name', 'guardian_phone', 'guardian_email', 'medical_notes',
        ]));

        return response()->json($swimmer->load('user'));
    }

    /**
     * Regenerate a temporary password for a swimmer and return the credentials
     * to the manager to relay. Revokes the swimmer's existing tokens.
     */
    public function resetPassword(SwimmerProfile $swimmer): JsonResponse
    {
        if ($swimmer->club_id !== app('current_club_id')) {
            abort(404);
        }

        $user = $swimmer->user;
        if (! $user) {
            return response()->json(['message' => 'This swimmer does not have a login account yet.'], 422);
        }

        $tempPassword = \App\Support\TempPassword::generate();

        $user->password = $tempPassword;
        $user->save();
        $user->tokens()->delete();

        AuditService::log('swimmer.password_reset', SwimmerProfile::class, $swimmer->id, [
            'swimmer_name' => $swimmer->full_name,
        ]);

        // A swimmer types their phone number, not this address, and a phone reaches
        // only the oldest account holding it. When the club has a second account for
        // the same phone, this password is real but unusable that way — the manager
        // has to relay the email instead, so say so rather than let it look broken.
        $phone = \App\Support\SwimmerLogin::phoneFromEmail($user->email);
        $reachableByPhone = \App\Support\SwimmerLogin::isReachableByPhone($user);

        return response()->json([
            'message' => 'Password reset. Share these credentials with the swimmer.',
            'credentials' => [
                'email' => $user->email,
                'temp_password' => $tempPassword,
                'phone' => $reachableByPhone ? $phone : null,
                'phone_login_works' => $reachableByPhone,
            ],
        ]);
    }

    public function swimmerDestroy(SwimmerProfile $swimmer): JsonResponse
    {
        $this->assertOwnership($swimmer);

        AuditService::log('swimmer.deleted', SwimmerProfile::class, $swimmer->id, [
            'swimmer_name' => $swimmer->first_name.' '.$swimmer->last_name,
            'user_id' => $swimmer->user_id,
        ]);

        if ($swimmer->user) {
            $swimmer->user->delete();
        }
        $swimmer->delete();

        return response()->json(['message' => 'Swimmer deleted']);
    }
}
