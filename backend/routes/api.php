<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CorporateController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\CoachApiController;
use App\Http\Controllers\Api\SwimmerApiController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\SportController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\CoachScheduleController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\PublicRegistrationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
*/
Route::prefix('v1')->group(function () {

    // Public
    Route::get('/clubs/{slug}', [PublicController::class, 'clubBySlug']);
    Route::get('/public/branding', [PublicController::class, 'corporateBranding']);

    // ── Public Registration API (club resolved via X-Club-Slug header) ──
    Route::middleware(['club.header', 'throttle:60,1'])->group(function () {
        Route::get('/branches', [PublicRegistrationController::class, 'branches']);
        Route::get('/sports', [PublicRegistrationController::class, 'sports']);
        Route::get('/subscription-plans', [PublicRegistrationController::class, 'plans']);
        Route::get('/coaches', [PublicRegistrationController::class, 'coaches']);
        Route::get('/coaches/{coach}', [PublicRegistrationController::class, 'coachShow']);
        Route::get('/coaches/{coach}/schedule', [PublicRegistrationController::class, 'coachSchedule']);
        Route::post('/registrations', [PublicRegistrationController::class, 'store']);
        Route::get('/registrations/{id}', [PublicRegistrationController::class, 'status']);
    });

    // Auth — rate limit (10 per minute)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    // Authenticated routes
    Route::middleware(['auth:sanctum', 'throttle:200,1', 'request.log'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Broadcasting channel auth (private channels)
        Route::post('/broadcasting/auth', function (Request $request) {
            return Broadcast::auth($request);
        });

        // ── Corporate (CraveClubs) ──────────────────────────
        Route::middleware('role:PLATFORM_ADMIN')->prefix('corporate')->group(function () {
            // Corporate settings
            Route::get('/settings', [CorporateController::class, 'settings']);
            Route::put('/settings', [CorporateController::class, 'updateSettings']);

            // Enhanced metrics
            Route::get('/metrics', [CorporateController::class, 'metrics']);

            // Club CRUD with branding + features
            Route::get('/clubs', [CorporateController::class, 'clubIndex']);
            Route::post('/clubs', [CorporateController::class, 'clubStore']);
            Route::get('/clubs/{club}', [CorporateController::class, 'clubShow']);
            Route::put('/clubs/{club}', [CorporateController::class, 'clubUpdate']);
            Route::delete('/clubs/{club}', [CorporateController::class, 'clubDestroy']);

            // Club feature management
            Route::get('/clubs/{club}/features', [CorporateController::class, 'clubFeatures']);
            Route::put('/clubs/{club}/features', [CorporateController::class, 'updateClubFeatures']);
        });

        // ── Platform Admin (backward compat — same as old routes) ──
        Route::middleware('role:PLATFORM_ADMIN')->prefix('platform')->group(function () {
            Route::get('/metrics', [PlatformController::class, 'metrics']);
            Route::get('/clubs', [PlatformController::class, 'clubIndex']);
            Route::post('/clubs', [PlatformController::class, 'clubStore']);
            Route::get('/clubs/{club}', [PlatformController::class, 'clubShow']);
            Route::put('/clubs/{club}', [PlatformController::class, 'clubUpdate']);
            Route::delete('/clubs/{club}', [PlatformController::class, 'clubDestroy']);
        });

        // ── Club Manager ────────────────────────────────────
        Route::middleware(['role:CLUB_MANAGER', 'club.context'])->prefix('club')->group(function () {
            // Always available (core)
            Route::get('/dashboard', [ClubController::class, 'dashboard']);
            Route::get('/settings', [ClubController::class, 'settings']);
            Route::put('/settings', [ClubController::class, 'updateSettings']);
            Route::get('/features', [ClubController::class, 'features']);

            Route::get('/coaches', [ClubController::class, 'coachIndex']);
            Route::post('/coaches', [ClubController::class, 'coachStore']);
            Route::get('/coaches/{coach}', [ClubController::class, 'coachShow']);
            Route::put('/coaches/{coach}', [ClubController::class, 'coachUpdate']);
            Route::delete('/coaches/{coach}', [ClubController::class, 'coachDestroy']);

            Route::get('/swimmers', [ClubController::class, 'swimmerIndex']);
            Route::post('/swimmers', [ClubController::class, 'swimmerStore']);
            Route::get('/swimmers/{swimmer}', [ClubController::class, 'swimmerShow']);
            Route::put('/swimmers/{swimmer}', [ClubController::class, 'swimmerUpdate']);
            Route::delete('/swimmers/{swimmer}', [ClubController::class, 'swimmerDestroy']);

            Route::get('/groups', [ClubController::class, 'groupIndex']);
            Route::post('/groups', [ClubController::class, 'groupStore']);
            Route::get('/groups/{group}', [ClubController::class, 'groupShow']);
            Route::put('/groups/{group}', [ClubController::class, 'groupUpdate']);
            Route::delete('/groups/{group}', [ClubController::class, 'groupDestroy']);
            Route::post('/groups/{group}/members', [ClubController::class, 'groupMembers']);

            Route::get('/sessions', [ClubController::class, 'sessionIndex']);
            Route::post('/sessions', [ClubController::class, 'sessionStore']);
            Route::get('/sessions/{session}', [ClubController::class, 'sessionShow']);
            Route::put('/sessions/{session}', [ClubController::class, 'sessionUpdate']);
            Route::delete('/sessions/{session}', [ClubController::class, 'sessionDestroy']);

            // Branches
            Route::apiResource('branches', BranchController::class);
            Route::put('branches/{branch}/features', [BranchController::class, 'updateFeatures']);
            Route::get('branches/{branch}/available-coaches', [BranchController::class, 'availableCoaches']);
            Route::get('branches/{branch}/available-swimmers', [BranchController::class, 'availableSwimmers']);
            Route::post('branches/{branch}/assign-coaches', [BranchController::class, 'assignCoaches']);
            Route::post('branches/{branch}/unassign-coaches', [BranchController::class, 'unassignCoaches']);
            Route::post('branches/{branch}/assign-swimmers', [BranchController::class, 'assignSwimmers']);
            Route::post('branches/{branch}/unassign-swimmers', [BranchController::class, 'unassignSwimmers']);

            // Sports
            Route::apiResource('sports', SportController::class);

            // Subscription Plans
            Route::middleware('feature:subscription_plans')->group(function () {
                Route::apiResource('subscription-plans', SubscriptionPlanController::class);
                Route::patch('subscription-plans/{subscription_plan}/toggle-active', [SubscriptionPlanController::class, 'toggleActive']);
                Route::post('subscription-plans/reorder', [SubscriptionPlanController::class, 'reorder']);
            });

            // Coach Schedule
            Route::get('coaches/{coach}/schedule', [CoachScheduleController::class, 'show']);
            Route::put('coaches/{coach}/schedule', [CoachScheduleController::class, 'update']);

            // Registrations (admin view)
            Route::get('registrations', [RegistrationController::class, 'index']);
            Route::get('registrations/{registration}', [RegistrationController::class, 'show']);
            Route::patch('registrations/{registration}/status', [RegistrationController::class, 'updateStatus']);

            // Feature-gated: Training Plans
            Route::middleware('feature:training_plans')->group(function () {
                Route::get('/plans', [ClubController::class, 'planIndex']);
                Route::post('/plans', [ClubController::class, 'planStore']);
                Route::get('/plans/{plan}', [ClubController::class, 'planShow']);
                Route::put('/plans/{plan}', [ClubController::class, 'planUpdate']);
                Route::delete('/plans/{plan}', [ClubController::class, 'planDestroy']);
            });

            // Feature-gated: Skills
            Route::middleware('feature:skills')->group(function () {
                Route::get('/skills', [ClubController::class, 'skillIndex']);
                Route::post('/skills', [ClubController::class, 'skillStore']);
                Route::put('/skills/{skill}', [ClubController::class, 'skillUpdate']);
                Route::delete('/skills/{skill}', [ClubController::class, 'skillDestroy']);
            });

            // Feature-gated: Leaderboard management
            Route::middleware(['feature:leaderboard'])->group(function () {
                Route::get('/leaderboard/settings', [ClubController::class, 'leaderboardSettings']);
                Route::put('/leaderboard/settings', [ClubController::class, 'leaderboardUpdateSettings']);
                Route::get('/leaderboard/overview', [ClubController::class, 'leaderboardOverview']);
                Route::post('/leaderboard/tiers', [ClubController::class, 'leaderboardStoreTier']);
                Route::put('/leaderboard/tiers/{tier}', [ClubController::class, 'leaderboardUpdateTier']);
                Route::delete('/leaderboard/tiers/{tier}', [ClubController::class, 'leaderboardDestroyTier']);
                Route::post('/leaderboard/tiers/reset', [ClubController::class, 'leaderboardResetTiers']);
            });
        });

        // ── Coach ───────────────────────────────────────────
        Route::middleware(['role:COACH', 'club.context', 'feature:coach_portal'])->prefix('coach')->group(function () {
            Route::get('/dashboard', [CoachApiController::class, 'dashboard']);
            Route::get('/groups', [CoachApiController::class, 'groups']);
            Route::post('/groups', [CoachApiController::class, 'groupStore']);
            Route::put('/groups/{group}', [CoachApiController::class, 'groupUpdate']);
            Route::delete('/groups/{group}', [CoachApiController::class, 'groupDestroy']);
            Route::get('/swimmers', [CoachApiController::class, 'allSwimmers']);

            // Session CRUD
            Route::get('/sessions', [CoachApiController::class, 'sessionIndex']);
            Route::post('/sessions', [CoachApiController::class, 'sessionStore']);
            Route::get('/sessions/{session}', [CoachApiController::class, 'sessionShow']);
            Route::put('/sessions/{session}', [CoachApiController::class, 'sessionUpdate']);
            Route::delete('/sessions/{session}', [CoachApiController::class, 'sessionDestroy']);

            // Session lifecycle
            Route::post('/sessions/{session}/start', [CoachApiController::class, 'sessionStart']);
            Route::post('/sessions/{session}/complete', [CoachApiController::class, 'sessionComplete']);
            Route::get('/sessions/{session}/roster', [CoachApiController::class, 'sessionRoster']);

            // Coach profile/settings
            Route::get('/profile', [CoachApiController::class, 'profile']);
            Route::put('/profile', [CoachApiController::class, 'updateProfile']);

            // Swimmer detail
            Route::get('/swimmers/{swimmer}', [CoachApiController::class, 'swimmerDetail']);

            // Feature-gated: Evaluations
            Route::middleware('feature:evaluations')->group(function () {
                Route::post('/swimmers/{swimmer}/evaluate', [CoachApiController::class, 'evaluateSwimmer']);
            });

            // Legacy
            Route::post('/daily-training', [CoachApiController::class, 'dailyTraining']);
        });

        // ── Swimmer ─────────────────────────────────────────
        Route::middleware(['role:SWIMMER', 'club.context'])->prefix('swimmer')->group(function () {
            // Always available (core)
            Route::get('/dashboard', [SwimmerApiController::class, 'dashboard']);
            Route::get('/sessions', [SwimmerApiController::class, 'sessions']);
            Route::get('/stats', [SwimmerApiController::class, 'stats']);

            // Feature-gated: Evaluations
            Route::middleware('feature:evaluations')->group(function () {
                Route::get('/evaluations', [SwimmerApiController::class, 'evaluations']);
            });

            // Feature-gated: Leaderboard
            Route::middleware(['feature:leaderboard'])->group(function () {
                Route::get('/leaderboard', [SwimmerApiController::class, 'leaderboard']);
            });
        });
    });
});
