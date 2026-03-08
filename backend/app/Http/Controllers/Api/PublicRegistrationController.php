<?php

namespace App\Http\Controllers\Api;

use App\Events\NewRegistrationSubmitted;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\CoachSchedule;
use App\Models\Registration;
use App\Models\Sport;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicRegistrationController extends Controller
{
    /**
     * Active branches for the club.
     */
    public function branches(): JsonResponse
    {
        $branches = Branch::where('club_id', app('current_club_id'))
            ->where('is_active', true)
            ->get(['id', 'name', 'address', 'city', 'phone', 'working_hours', 'photos']);

        return response()->json($branches);
    }

    /**
     * Active sports offered by the club.
     */
    public function sports(): JsonResponse
    {
        $sports = Sport::where('club_id', app('current_club_id'))
            ->where('is_active', true)
            ->get(['id', 'name', 'slug', 'description', 'icon']);

        return response()->json($sports);
    }

    /**
     * Active subscription plans for the club.
     */
    public function plans(): JsonResponse
    {
        $features = ClubFeature::forClub(app('current_club_id'));
        if (!$features->isEnabled('subscription_plans')) {
            return response()->json([]);
        }

        $plans = SubscriptionPlan::where('club_id', app('current_club_id'))
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('duration_months')
            ->get(['id', 'name', 'duration_months', 'price', 'discount_percent', 'is_popular']);

        return response()->json($plans);
    }

    /**
     * Active coaches, optionally filtered by sport slug.
     */
    public function coaches(Request $request): JsonResponse
    {
        $query = CoachProfile::where('club_id', app('current_club_id'))
            ->where('is_active', true)
            ->with('user:id,name,avatar');

        if ($request->sport_id) {
            $query->whereJsonContains('sport_ids', $request->sport_id);
        }

        $coaches = $query->get()->map(fn($coach) => [
            'id' => $coach->id,
            'name' => $coach->user->name ?? null,
            'photo' => $coach->user->avatar ?? null,
            'bio' => $coach->bio,
            'experience_years' => $coach->experience_years,
            'certifications' => $coach->certifications,
            'rating' => $coach->rating,
            'current_swimmers_count' => $coach->current_swimmers_count,
        ]);

        return response()->json($coaches);
    }

    /**
     * Single coach detail.
     */
    public function coachShow(CoachProfile $coach): JsonResponse
    {
        if ($coach->club_id !== app('current_club_id')) {
            abort(404);
        }

        $coach->load('user:id,name,avatar');

        return response()->json([
            'id' => $coach->id,
            'name' => $coach->user->name ?? null,
            'photo' => $coach->user->avatar ?? null,
            'bio' => $coach->bio,
            'experience_years' => $coach->experience_years,
            'certifications' => $coach->certifications,
            'rating' => $coach->rating,
            'current_swimmers_count' => $coach->current_swimmers_count,
        ]);
    }

    /**
     * Coach's weekly schedule.
     */
    public function coachSchedule(CoachProfile $coach): JsonResponse
    {
        if ($coach->club_id !== app('current_club_id')) {
            abort(404);
        }

        $schedules = CoachSchedule::where('coach_id', $coach->id)->get();

        return response()->json($schedules);
    }

    /**
     * Submit a new registration.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|min:2',
            'phone' => 'required|string|min:10',
            'gender' => 'required|in:male,female',
            'birth_date' => 'required|date|before:today',
            'height_cm' => 'nullable|integer|min:50|max:250',
            'weight_kg' => 'nullable|integer|min:20|max:300',
            'fitness_level' => 'nullable|in:excellent,good,average,beginner',
            'prior_experience' => 'required|boolean',
            'sport_ids' => 'required|array|min:1',
            'sport_ids.*' => 'string',
            'experience_level' => 'required|in:beginner,intermediate,advanced,professional',
            'years_experience' => 'required|string',
            'competed' => 'required|boolean',
            'primary_goal' => 'required|string',
            'weekly_frequency' => 'required|string',
            'branch_id' => 'required|integer|exists:branches,id',
            'plan_id' => 'required|integer|exists:subscription_plans,id',
            'coach_id' => 'required|integer|exists:coach_profiles,id',
            'preferred_time' => 'required|string',
            'payment_method' => 'required|in:cash',
            'avatar_url' => 'nullable|string',
            'medical_notes' => 'nullable|string|max:500',
        ]);

        $clubId = app('current_club_id');

        // Cross-club scope checks
        $branch = Branch::where('id', $validated['branch_id'])
            ->where('club_id', $clubId)->first();
        if (!$branch) {
            abort(422, 'Branch does not belong to this club.');
        }

        $plan = SubscriptionPlan::where('id', $validated['plan_id'])
            ->where('club_id', $clubId)->first();
        if (!$plan) {
            abort(422, 'Plan does not belong to this club.');
        }

        $coach = CoachProfile::where('id', $validated['coach_id'])
            ->where('club_id', $clubId)->first();
        if (!$coach) {
            abort(422, 'Coach does not belong to this club.');
        }

        try {
            $registration = DB::transaction(function () use ($validated, $clubId, $plan) {
                return Registration::create(array_merge($validated, [
                    'club_id' => $clubId,
                    'total_amount' => $plan->price,
                    'status' => 'pending',
                ]));
            });

            // Load relations for broadcast payload
            $registration->load(['branch', 'coach.user', 'plan']);

            // Fire broadcast event OUTSIDE transaction
            broadcast(new NewRegistrationSubmitted($registration))->toOthers();

            return response()->json([
                'message' => 'Registration submitted successfully.',
                'registration_id' => $registration->id,
                'status' => 'pending',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Something went wrong. Please try again.',
            ], 500);
        }
    }

    /**
     * Check registration status.
     */
    public function status(int $id): JsonResponse
    {
        $registration = Registration::where('id', $id)
            ->where('club_id', app('current_club_id'))
            ->firstOrFail();

        return response()->json([
            'id' => $registration->id,
            'status' => $registration->status,
            'swimmer_name' => $registration->full_name,
        ]);
    }
}
