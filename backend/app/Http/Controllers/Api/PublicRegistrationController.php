<?php

namespace App\Http\Controllers\Api;

use App\Events\NewRegistrationSubmitted;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\CoachSchedule;
use App\Models\Registration;
use App\Models\Sport;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

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
     * Active sport modules assigned to the club.
     */
    public function sports(): JsonResponse
    {
        $club = Club::find(app('current_club_id'));

        if (! $club) {
            return response()->json([]);
        }

        $modules = $club->activeSportModules()
            ->where('sport_modules.is_active', true)
            ->orderBy('sort_order')
            ->get(['sport_modules.id', 'sport_modules.name', 'sport_modules.slug', 'sport_modules.description', 'sport_modules.icon', 'sport_modules.color']);

        return response()->json($modules);
    }

    /**
     * Active subscription plans for the club.
     */
    public function plans(): JsonResponse
    {
        $features = ClubFeature::forClub(app('current_club_id'));
        if (! $features->isEnabled('subscription_plans')) {
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
            ->with('user:id,name,email,avatar');

        if ($request->sport_id) {
            $query->whereJsonContains('sport_ids', $request->sport_id);
        }

        // Public endpoint: expose only what the registration wizard needs.
        // Coach email/phone are NOT returned to anonymous callers (email is also a login id).
        $coaches = $query->get()->map(fn ($coach) => [
            'id' => $coach->id,
            'name' => $coach->user->name ?? null,
            'photo' => $coach->user->avatar ?? null,
            'avatar_url' => $coach->user->avatar ?? null,
            'specialization' => $coach->specialization,
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
            'avatar_url' => $coach->user->avatar ?? null,
            'specialization' => $coach->specialization,
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

        $dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Transform to mobile-expected shape: { coach_id, slots: [{ day, start_time, end_time }] }
        $slots = [];
        foreach ($schedules as $schedule) {
            $dayName = $dayNames[$schedule->day_of_week] ?? $schedule->day_of_week;
            if (is_array($schedule->slots)) {
                foreach ($schedule->slots as $slot) {
                    if (! empty($slot['is_available'])) {
                        $slots[] = [
                            'day' => $dayName,
                            'start_time' => $slot['time'] ?? $slot['start_time'] ?? null,
                            'end_time' => $slot['end_time'] ?? null,
                        ];
                    }
                }
            }
        }

        return response()->json([
            'coach_id' => $coach->id,
            'slots' => $slots,
        ]);
    }

    /**
     * Submit a new registration.
     */
    public function store(Request $request): JsonResponse
    {
        // Email-based rate limiting: max 5 registration attempts per phone per hour
        $phoneKey = 'registration_attempt_'.hash('sha256', $request->input('phone', ''));
        $attempts = Cache::get($phoneKey, 0);
        abort_if($attempts >= 5, 429, 'Too many registration attempts. Please try again later.');
        Cache::put($phoneKey, $attempts + 1, now()->addHour());

        $validated = $request->validate([
            'full_name' => 'required|string|min:2|max:255',
            'phone' => 'required|string|min:10|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'guardian_email' => 'nullable|email|max:255',
            'gender' => 'required|in:male,female',
            'birth_date' => 'required|date|before:today|after:1920-01-01',
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
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')->where('club_id', app('current_club_id'))],
            'plan_id' => ['required', 'integer', Rule::exists('subscription_plans', 'id')->where('club_id', app('current_club_id'))],
            'coach_id' => ['required', 'integer', Rule::exists('coach_profiles', 'id')->where('club_id', app('current_club_id'))],
            'preferred_time' => 'required|string',
            'payment_method' => 'required|in:cash',
            'avatar_url' => 'nullable|string',
            'medical_notes' => 'nullable|string|max:500',
            // PDPL: explicit data-processing consent. Optional at the API level so
            // older mobile builds keep working; the portal wizard always sends it.
            'consent_given' => 'sometimes|boolean',
        ]);

        $consentGivenAt = ! empty($validated['consent_given']) ? now() : null;
        unset($validated['consent_given']);

        $clubId = app('current_club_id');

        // Cross-club scope checks
        $branch = Branch::where('id', $validated['branch_id'])
            ->where('club_id', $clubId)->first();
        if (! $branch) {
            abort(422, 'Branch does not belong to this club.');
        }

        $plan = SubscriptionPlan::where('id', $validated['plan_id'])
            ->where('club_id', $clubId)->first();
        if (! $plan) {
            abort(422, 'Plan does not belong to this club.');
        }

        $coach = CoachProfile::where('id', $validated['coach_id'])
            ->where('club_id', $clubId)->first();
        if (! $coach) {
            abort(422, 'Coach does not belong to this club.');
        }

        // Resolve sport_module_id from club's active sport modules
        $sportModuleId = DB::table('club_sport_modules')
            ->where('club_id', $clubId)
            ->where('is_active', true)
            ->value('sport_module_id');

        try {
            $registration = DB::transaction(function () use ($validated, $clubId, $plan, $sportModuleId, $consentGivenAt) {
                return Registration::create(array_merge($validated, [
                    'reference_code' => 'REG-'.strtoupper(\Illuminate\Support\Str::random(8)),
                    'club_id' => $clubId,
                    'sport_module_id' => $sportModuleId,
                    'total_amount' => $plan->price,
                    'status' => 'pending',
                    'consent_given_at' => $consentGivenAt,
                ]));
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Something went wrong. Please try again.',
            ], 500);
        }

        // Load relations for broadcast payload
        $registration->load(['branch', 'coach.user', 'plan']);

        // Fire broadcast event OUTSIDE transaction — graceful if Reverb unavailable
        try {
            broadcast(new NewRegistrationSubmitted($registration))->toOthers();
        } catch (\Exception $e) {
            Log::warning('Broadcast failed for registration', [
                'registration_id' => $registration->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Registration submitted successfully.',
            'registration_id' => $registration->id,
            'reference_code' => $registration->reference_code,
            'status' => 'pending',
        ], 201);
    }

    /**
     * Check registration status by its unguessable reference code.
     *
     * Looked up by reference_code (not the sequential id) so applicant PII can't
     * be harvested by iterating numeric ids against a public club slug.
     */
    public function status(string $reference): JsonResponse
    {
        $registration = Registration::where('reference_code', $reference)
            ->where('club_id', app('current_club_id'))
            ->firstOrFail();

        return response()->json([
            'reference_code' => $registration->reference_code,
            'status' => $registration->status,
            'swimmer_name' => $registration->full_name,
        ]);
    }
}
