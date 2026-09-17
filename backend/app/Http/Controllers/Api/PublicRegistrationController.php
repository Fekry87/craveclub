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
use App\Support\SafeCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            ->get(['id', 'name', 'training_type', 'duration_months', 'price', 'discount_percent', 'is_popular']);

        // `final_price` rides along via $appends — clients render it instead of each
        // re-deriving the discount and drifting apart.
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
            // Groups point at the coach's users.id (coach_user_id); the app's group
            // step cuts /clubs/{slug}/groups down to the chosen coach with it.
            'user_id' => $coach->user_id,
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
     * The one message the swimmer sees for an email that belongs to an account,
     * whether it is caught up front (Step 1) or at submission.
     */
    public const EMAIL_TAKEN_MESSAGE = 'This email is already registered. Sign in instead, or use a different email.';

    /**
     * Rules for the swimmer's own email. Shared by the up-front check and the
     * submission so the app cannot pass one and fail the other.
     */
    private static function emailRules(): array
    {
        return ['nullable', 'email', 'max:255', Rule::unique('users', 'email')];
    }

    /**
     * Check the swimmer's email before they fill in the other seven steps.
     *
     * Runs the same rule the submission runs and answers 422 with the same
     * field error, so Step 1 can refuse an email that would only have failed at
     * the end. Answers 200 with nothing else — it reveals no more than the
     * submission itself already did.
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $request->validate(
            ['email' => self::emailRules()],
            ['email.unique' => self::EMAIL_TAKEN_MESSAGE],
        );

        return response()->json(['available' => true]);
    }

    /**
     * Submit a new registration.
     */
    public function store(Request $request): JsonResponse
    {
        // Per-phone rate limiting: max 5 registration attempts per hour.
        // The key hashes the DIGITS of the number, not the raw string — otherwise
        // "0551234567", "+966 55 123 4567" and a trailing space are three separate
        // buckets and the limit is bypassed by reformatting.
        $phoneKey = 'registration_attempt_'.hash('sha256', self::normalizePhone($request->input('phone', '')));
        $attempts = SafeCache::get($phoneKey, 0);
        abort_if($attempts >= 5, 429, 'Too many registration attempts. Please try again later.');

        $validated = $request->validate([
            'full_name' => 'required|string|min:2|max:255',
            'phone' => 'required|string|min:10|max:20',
            // Becomes the account's login address at approval; without one the
            // generated swimmer_<phone>@club<N> address is used as before.
            'email' => self::emailRules(),
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
            // Optional since 2026-09-17: the plan's training type says how often the
            // member trains, so the app no longer asks separately.
            'weekly_frequency' => 'nullable|string',
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')->where('club_id', app('current_club_id'))],
            'plan_id' => ['required', 'integer', Rule::exists('subscription_plans', 'id')->where('club_id', app('current_club_id'))],
            'coach_id' => ['required', 'integer', Rule::exists('coach_profiles', 'id')->where('club_id', app('current_club_id'))],
            // The group the applicant picked by type + schedule. Optional so the portal
            // wizard and older app builds, which choose a coach only, keep working.
            'group_id' => ['nullable', 'integer', Rule::exists('groups', 'id')->where('club_id', app('current_club_id'))->whereNull('deleted_at')],
            'preferred_time' => 'required|string',
            'payment_method' => 'required|in:cash',
            'avatar_url' => 'nullable|string',
            // Step 1's optional photo: a data URL, already cropped square and
            // shrunk by the app. Validated by its bytes in ProfilePhotoService.
            'photo' => 'nullable|string|max:3000000',
            'medical_notes' => 'nullable|string|max:500',
            // PDPL: explicit data-processing consent. Optional at the API level so
            // older mobile builds keep working; the portal wizard always sends it.
            'consent_given' => 'sometimes|boolean',
        ], ['email.unique' => self::EMAIL_TAKEN_MESSAGE]);

        // Friendly early answer for a group that is already full. The authoritative
        // check runs under a row lock at approval, when the seat is actually taken.
        if (! empty($validated['group_id'])) {
            $chosen = \App\Models\Group::where('club_id', app('current_club_id'))->find($validated['group_id']);
            if ($chosen && $chosen->isFull()) {
                return response()->json([
                    'message' => 'This group is full. Please choose another group.',
                    'errors' => ['group_id' => ['This group is full. Please choose another group.']],
                ], 422);
            }
        }

        // Count the attempt only once the payload is well-formed. Counting before
        // validation burns an honest applicant's whole hourly quota on five typos.
        SafeCache::put($phoneKey, $attempts + 1, now()->addHour());

        $consentGivenAt = ! empty($validated['consent_given']) ? now() : null;
        unset($validated['consent_given']);

        // Refuse a bad photo here, as a 422, before anything is written.
        $photo = ! empty($validated['photo'])
            ? app(\App\Services\ProfilePhotoService::class)->parse($validated['photo'])
            : null;
        unset($validated['photo'], $validated['avatar_url']);

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

        // Resolve sport_module_id: honour the applicant's chosen sport when it maps to one
        // of the club's active modules, otherwise fall back to the club's first module by
        // its own sort order. The previous ->value() without an ORDER BY filed multi-sport
        // applicants under whatever row the database happened to return first.
        $sportModuleId = $this->resolveSportModuleId($clubId, $validated['sport_ids']);

        try {
            $registration = DB::transaction(function () use ($validated, $clubId, $plan, $sportModuleId, $consentGivenAt, $photo) {
                $photoToken = $photo
                    ? app(\App\Services\ProfilePhotoService::class)->store($photo, $clubId)->token
                    : null;

                return Registration::create(array_merge($validated, [
                    'reference_code' => 'REG-'.strtoupper(\Illuminate\Support\Str::random(8)),
                    'club_id' => $clubId,
                    'photo_token' => $photoToken,
                    'sport_module_id' => $sportModuleId,
                    // final_price, not price: `price` is the list price and the portal
                    // advertises the discounted figure, so billing the list price charged
                    // members a number no screen ever showed them.
                    'total_amount' => $plan->final_price,
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

        // Fire broadcast event OUTSIDE transaction — graceful if Reverb unavailable.
        // Degrading silently here is deliberate (a registration must never fail because
        // the socket server is down), but the log has to say enough to diagnose it:
        // a publish failure looks identical to a healthy portal from the browser's side,
        // because the client stays connected and simply never receives anything.
        try {
            broadcast(new NewRegistrationSubmitted($registration))->toOthers();
        } catch (\Throwable $e) {
            Log::error('REALTIME_PUBLISH_FAILED', [
                'registration_id' => $registration->id,
                'error' => $e->getMessage(),
                'hint' => $this->broadcastFailureHint($e),
                'reverb_host' => config('broadcasting.connections.reverb.options.host'),
                'reverb_port' => config('broadcasting.connections.reverb.options.port'),
                'reverb_scheme' => config('broadcasting.connections.reverb.options.scheme'),
                'reverb_app_id' => config('broadcasting.connections.reverb.app_id'),
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
     * Turn a broadcast exception into the one line that actually identifies the cause.
     *
     * Both failure modes render as a perfectly healthy portal in the browser — connected,
     * subscribed, and silent — so the log is the only place the difference is visible.
     */
    private function broadcastFailureHint(\Throwable $e): string
    {
        $message = $e->getMessage();

        if (str_contains($message, 'signature invalid')) {
            return 'REVERB_APP_KEY/REVERB_APP_SECRET on this API do not match the Reverb server. They must be identical on both services.';
        }

        if (str_contains($message, 'cURL error 7') || str_contains($message, 'Could not connect')) {
            return 'Cannot reach the Reverb server at the configured host. Check REVERB_HOST/REVERB_PORT/REVERB_SCHEME and that the reverb process is running.';
        }

        if (str_contains($message, 'cURL error 6') || str_contains($message, 'Could not resolve host')) {
            return 'REVERB_HOST does not resolve. It must be the reverb service hostname without a scheme.';
        }

        if (str_contains($message, '404')) {
            return 'Reverb rejected the app id. Check REVERB_APP_ID matches on both services.';
        }

        return 'Unrecognised broadcast failure — see `error`.';
    }

    /**
     * Canonicalise a phone number so every spelling of it shares one rate-limit key.
     *
     * Strips formatting (spaces, dashes, brackets, the leading +), then folds the Saudi
     * country code into the national form so "+966 55 123 4567", "00966551234567" and
     * "055-123-4567" all reduce to "0551234567". Market is KSA (see CLAUDE.md); the
     * worst case of an over-eager fold is two unrelated numbers sharing a counter, which
     * makes the limit marginally stricter rather than bypassable.
     */
    private static function normalizePhone(mixed $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        // International dialling prefix
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        // +966 5X XXX XXXX → 05X XXX XXXX
        if (str_starts_with($digits, '966')) {
            $digits = '0'.substr($digits, 3);
        }

        return $digits;
    }

    /**
     * Pick the sport module a registration belongs to.
     *
     * `sport_ids` is a free-form array of client-chosen sport identifiers — the portal
     * wizard sends swimming disciplines ("freestyle"), mobile sends module slugs or ids.
     * Match either against the club's active modules; when nothing matches, fall back to
     * the club's first active module in a STABLE order (sort_order, then id) so the same
     * applicant always lands in the same place.
     *
     * @param  array<int, string>  $sportIds
     */
    private function resolveSportModuleId(int $clubId, array $sportIds): ?int
    {
        $modules = DB::table('club_sport_modules')
            ->join('sport_modules', 'sport_modules.id', '=', 'club_sport_modules.sport_module_id')
            ->where('club_sport_modules.club_id', $clubId)
            ->where('club_sport_modules.is_active', true)
            ->where('sport_modules.is_active', true)
            ->whereNull('sport_modules.deleted_at')
            ->orderBy('sport_modules.sort_order')
            ->orderBy('sport_modules.id')
            ->get(['sport_modules.id', 'sport_modules.slug']);

        if ($modules->isEmpty()) {
            return null;
        }

        $chosen = array_map(fn ($id) => strtolower(trim((string) $id)), $sportIds);

        foreach ($modules as $module) {
            if (in_array(strtolower((string) $module->slug), $chosen, true)
                || in_array((string) $module->id, $chosen, true)) {
                return (int) $module->id;
            }
        }

        return (int) $modules->first()->id;
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
