<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\Registration;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    public function index(): JsonResponse
    {
        $registrations = Registration::where('club_id', app('current_club_id'))
            ->with(['branch', 'coach.user', 'plan'])
            ->latest()
            ->paginate(20);

        return response()->json($registrations);
    }

    public function show(Registration $registration): JsonResponse
    {
        if ($registration->club_id !== app('current_club_id')) {
            abort(404);
        }

        $registration->load(['branch', 'coach.user', 'plan']);

        return response()->json($registration);
    }

    public function updateStatus(Request $request, Registration $registration): JsonResponse
    {
        if ($registration->club_id !== app('current_club_id')) {
            abort(404);
        }

        $request->validate([
            'status' => 'required|string|in:approved,cancelled',
        ]);

        // Guard: only pending registrations can be approved/cancelled
        if ($registration->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending registrations can be updated.',
            ], 422);
        }

        if ($request->status === 'approved') {
            return $this->approveRegistration($registration);
        }

        return $this->rejectRegistration($registration);
    }

    private function approveRegistration(Registration $registration): JsonResponse
    {
        $clubId = app('current_club_id');

        try {
            $result = DB::transaction(function () use ($registration, $clubId) {
                // 1. Split full_name into first/last
                $nameParts = explode(' ', trim($registration->full_name), 2);
                $firstName = $nameParts[0];
                $lastName = $nameParts[1] ?? '';

                // 2. Generate unique email for swimmer account
                $baseEmail = 'swimmer_' . preg_replace('/[^0-9]/', '', $registration->phone) . '@club' . $clubId . '.craveclubs.local';
                $email = $baseEmail;
                $counter = 1;
                while (User::where('email', $email)->exists()) {
                    $email = 'swimmer_' . preg_replace('/[^0-9]/', '', $registration->phone) . '_' . $counter . '@club' . $clubId . '.craveclubs.local';
                    $counter++;
                }

                // 3. Generate temporary password
                $tempPassword = Str::upper(Str::random(2))
                    . rand(10, 99)
                    . Str::random(4)
                    . str_shuffle('!@#$')[0];

                // 4. Create User account
                $user = User::create([
                    'name' => $registration->full_name,
                    'email' => $email,
                    'password' => $tempPassword, // auto-hashed via 'hashed' cast
                    'role' => UserRole::SWIMMER,
                    'club_id' => $clubId,
                ]);

                // 5. Create SwimmerProfile
                $swimmerProfile = SwimmerProfile::create([
                    'club_id' => $clubId,
                    'user_id' => $user->id,
                    'branch_id' => $registration->branch_id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'date_of_birth' => $registration->birth_date,
                    'medical_notes' => $registration->medical_notes,
                    'guardian_phone' => $registration->phone,
                    'level' => $registration->experience_level ?? 'beginner',
                ]);

                // 6. Auto-assign to coach's group
                $groupAssigned = false;
                if ($registration->coach_id) {
                    $coachProfile = $registration->coach;
                    if ($coachProfile) {
                        $group = Group::where('club_id', $clubId)
                            ->where('coach_user_id', $coachProfile->user_id)
                            ->first();

                        if ($group) {
                            GroupMembership::create([
                                'club_id' => $clubId,
                                'group_id' => $group->id,
                                'swimmer_id' => $swimmerProfile->id,
                            ]);
                            $groupAssigned = true;
                        }
                    }
                }

                // 7. Update registration status
                $registration->update(['status' => 'approved']);

                return [
                    'registration' => $registration,
                    'swimmer' => [
                        'user_id' => $user->id,
                        'profile_id' => $swimmerProfile->id,
                        'email' => $email,
                        'temp_password' => $tempPassword,
                        'group_assigned' => $groupAssigned,
                    ],
                ];
            });

            $result['registration']->load(['branch', 'coach.user', 'plan']);

            return response()->json([
                'registration' => $result['registration'],
                'swimmer' => $result['swimmer'],
                'message' => 'Registration approved. Swimmer account created successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Registration approval failed', ['error' => $e->getMessage(), 'registration_id' => $registration->id]);

            return response()->json([
                'message' => 'Operation failed. Please try again.',
            ], 500);
        }
    }

    private function rejectRegistration(Registration $registration): JsonResponse
    {
        try {
            $registration->update(['status' => 'cancelled']);
            $registration->load(['branch', 'coach.user', 'plan']);

            return response()->json([
                'registration' => $registration,
                'message' => 'Registration has been rejected.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject registration.',
            ], 500);
        }
    }
}
