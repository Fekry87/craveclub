<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CorporateController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\ClubDashboardController;
use App\Http\Controllers\Api\CoachApiController;
use App\Http\Controllers\Api\CoachManagementController;
use App\Http\Controllers\Api\GroupManagementController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\SessionManagementController;
use App\Http\Controllers\Api\SwimmerManagementController;
use App\Http\Controllers\Api\SwimmerApiController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\ApiDocController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\SportController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\CoachScheduleController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\PublicRegistrationController;
use App\Http\Controllers\Api\TrainingPlanController;
use App\Http\Controllers\Api\RecurringScheduleController;
use App\Http\Controllers\Api\ClubBrandingController;
use App\Http\Controllers\Api\SportModuleController;
use App\Http\Controllers\Api\CoachPerformanceController;
use App\Http\Controllers\Api\SwimmerReportController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
*/
Route::prefix('v1')->group(function () {

    // Health Check — 4 checks: database, redis, queue, disk
    Route::get('/health', function () {
        $checks = [];

        // 1. Database: SELECT 1, measure latency
        $dbStart = microtime(true);
        try {
            DB::select('SELECT 1');
            $checks['database'] = [
                'status' => 'ok',
                'latency_ms' => round((microtime(true) - $dbStart) * 1000, 1),
            ];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'error', 'error' => $e->getMessage()];
        }

        // 2. Redis: set and get a test key
        $redisStart = microtime(true);
        try {
            $redis = app('redis');
            $redis->set('health_check', 'ok');
            $redis->get('health_check');
            $redis->del('health_check');
            $checks['redis'] = [
                'status' => 'ok',
                'latency_ms' => round((microtime(true) - $redisStart) * 1000, 1),
            ];
        } catch (\Throwable $e) {
            $checks['redis'] = ['status' => 'unavailable', 'error' => 'Redis not configured'];
        }

        // 3. Queue: count pending + recently failed jobs
        try {
            $pendingJobs = DB::table('jobs')->count();
            $failedLastHour = DB::table('failed_jobs')
                ->where('failed_at', '>=', now()->subHour())
                ->count();
            $checks['queue'] = [
                'status' => $pendingJobs > 100 ? 'degraded' : 'ok',
                'pending_jobs' => $pendingJobs,
                'failed_last_hour' => $failedLastHour,
            ];
        } catch (\Throwable $e) {
            $checks['queue'] = ['status' => 'ok', 'pending_jobs' => 0, 'failed_last_hour' => 0];
        }

        // 4. Disk: check free space > 500MB
        try {
            $freeBytes = disk_free_space('/');
            $freeGb = round($freeBytes / (1024 * 1024 * 1024), 1);
            $checks['disk'] = [
                'status' => $freeGb > 0.5 ? 'ok' : 'warning',
                'free_gb' => $freeGb,
            ];
        } catch (\Throwable $e) {
            $checks['disk'] = ['status' => 'unknown'];
        }

        $dbOk = ($checks['database']['status'] ?? 'error') === 'ok';
        $allOk = collect($checks)->every(fn ($c) => in_array($c['status'], ['ok', 'unavailable', 'unknown']));

        return response()->json([
            'status' => $dbOk ? ($allOk ? 'healthy' : 'degraded') : 'unhealthy',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $dbOk ? 200 : 503);
    });

    // API Documentation
    Route::get('/docs', [ApiDocController::class, 'docs']);

    // Public
    Route::get('/clubs/{slug}', [PublicController::class, 'clubBySlug']);
    Route::get('/public/branding', [PublicController::class, 'corporateBranding']);
    Route::get('/branding/{slug}', [ClubBrandingController::class, 'show']);

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

        // Public namespace aliases (for mobile registration wizard)
        Route::get('/public/sports', [PublicRegistrationController::class, 'sports']);
    });

    // Auth — rate limit (10 per minute)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    // Authenticated routes
    Route::middleware(['auth:sanctum', 'throttle:by_user', 'request.log'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Broadcasting channel auth (private channels)
        Route::post('/broadcasting/auth', function (Request $request) {
            return Broadcast::auth($request);
        });

        // ── Notifications (all authenticated users) ──────────
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::match(['put', 'post'], '/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::match(['put', 'post'], '/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::match(['put', 'post'], '/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/push-token', [NotificationController::class, 'registerToken']);

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

            // Club branding management
            Route::put('/clubs/{club}/branding', [ClubBrandingController::class, 'update']);
            Route::post('/clubs/{club}/branding/upload', [ClubBrandingController::class, 'upload']);

            // Sport Modules (platform-wide catalog)
            Route::apiResource('sport-modules', SportModuleController::class);

            // Club sport module assignment
            Route::get('/clubs/{club}/sport-modules', [SportModuleController::class, 'getClubSportModules']);
            Route::post('/clubs/{club}/sport-modules', [SportModuleController::class, 'assignSportModule']);
            Route::delete('/clubs/{club}/sport-modules/{module}', [SportModuleController::class, 'removeSportModule']);
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
            Route::get('/dashboard', [ClubDashboardController::class, 'dashboard']);
            Route::get('/analytics', [ClubDashboardController::class, 'analytics']);
            Route::get('/settings', [ClubDashboardController::class, 'settings']);
            Route::put('/settings', [ClubDashboardController::class, 'updateSettings']);
            Route::get('/features', [ClubDashboardController::class, 'features']);
            Route::get('/branding', [ClubBrandingController::class, 'own']);
            Route::put('/branding', [ClubBrandingController::class, 'updateOwn']);
            Route::post('/branding/upload', [ClubBrandingController::class, 'uploadOwn']);

            // Sport Modules (manager dashboard)
            Route::get('/sport-modules', [ClubDashboardController::class, 'sportModules']);
            Route::get('/sport-modules/{module}', [ClubDashboardController::class, 'sportModuleShow']);

            Route::get('/coaches/performance', [CoachPerformanceController::class, 'index']);
            Route::get('/coaches/performance/compare', [CoachPerformanceController::class, 'comparison']);

            Route::get('/coaches', [CoachManagementController::class, 'coachIndex']);
            Route::post('/coaches', [CoachManagementController::class, 'coachStore']);
            Route::get('/coaches/{coach}', [CoachManagementController::class, 'coachShow']);
            Route::get('/coaches/{coach}/performance', [CoachPerformanceController::class, 'show']);
            Route::put('/coaches/{coach}', [CoachManagementController::class, 'coachUpdate']);
            Route::delete('/coaches/{coach}', [CoachManagementController::class, 'coachDestroy']);

            Route::get('/swimmers', [SwimmerManagementController::class, 'swimmerIndex']);
            Route::post('/swimmers', [SwimmerManagementController::class, 'swimmerStore']);
            Route::get('/swimmers/{swimmer}', [SwimmerManagementController::class, 'swimmerShow']);
            Route::put('/swimmers/{swimmer}', [SwimmerManagementController::class, 'swimmerUpdate']);
            Route::delete('/swimmers/{swimmer}', [SwimmerManagementController::class, 'swimmerDestroy']);
            Route::get('/swimmers/{swimmer}/weekly-report', [SwimmerReportController::class, 'managerSwimmer']);

            Route::get('/groups', [GroupManagementController::class, 'groupIndex']);
            Route::post('/groups', [GroupManagementController::class, 'groupStore']);
            Route::get('/groups/{group}', [GroupManagementController::class, 'groupShow']);
            Route::put('/groups/{group}', [GroupManagementController::class, 'groupUpdate']);
            Route::delete('/groups/{group}', [GroupManagementController::class, 'groupDestroy']);
            Route::post('/groups/{group}/members', [GroupManagementController::class, 'groupMembers']);

            Route::get('/sessions', [SessionManagementController::class, 'sessionIndex']);
            Route::post('/sessions', [SessionManagementController::class, 'sessionStore']);
            Route::get('/sessions/{session}', [SessionManagementController::class, 'sessionShow']);
            Route::get('/sessions/{session}/attendance', [SessionManagementController::class, 'sessionAttendance']);
            Route::put('/sessions/{session}', [SessionManagementController::class, 'sessionUpdate']);
            Route::delete('/sessions/{session}', [SessionManagementController::class, 'sessionDestroy']);

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

                // Training Plan Assignment (Manager)
                Route::post('/training-plans/{plan}/assign-to-coach', [TrainingPlanController::class, 'assignToCoach']);
            });

            // Recurring Schedules
            Route::get('/recurring-schedules', [RecurringScheduleController::class, 'index']);
            Route::post('/recurring-schedules', [RecurringScheduleController::class, 'store']);
            Route::get('/recurring-schedules/{recurringSchedule}', [RecurringScheduleController::class, 'show']);
            Route::put('/recurring-schedules/{recurringSchedule}', [RecurringScheduleController::class, 'update']);
            Route::get('/recurring-schedules/{recurringSchedule}/preview', [RecurringScheduleController::class, 'preview']);
            Route::post('/recurring-schedules/{recurringSchedule}/generate', [RecurringScheduleController::class, 'generate']);
            Route::post('/recurring-schedules/{recurringSchedule}/holidays', [RecurringScheduleController::class, 'addHolidays']);
            Route::delete('/recurring-schedules/{recurringSchedule}/holidays/{date}', [RecurringScheduleController::class, 'removeHoliday']);
            Route::delete('/recurring-schedules/{recurringSchedule}', [RecurringScheduleController::class, 'destroy']);

            // Feature-gated: Skills
            Route::middleware('feature:skills')->group(function () {
                Route::get('/skills', [ClubController::class, 'skillIndex']);
                Route::post('/skills', [ClubController::class, 'skillStore']);
                Route::put('/skills/{skill}', [ClubController::class, 'skillUpdate']);
                Route::delete('/skills/{skill}', [ClubController::class, 'skillDestroy']);
            });

            // Feature-gated: Leaderboard management
            Route::middleware(['feature:leaderboard'])->group(function () {
                Route::get('/leaderboard/settings', [LeaderboardController::class, 'leaderboardSettings']);
                Route::put('/leaderboard/settings', [LeaderboardController::class, 'leaderboardUpdateSettings']);
                Route::get('/leaderboard/overview', [LeaderboardController::class, 'leaderboardOverview']);
                Route::post('/leaderboard/tiers', [LeaderboardController::class, 'leaderboardStoreTier']);
                Route::put('/leaderboard/tiers/{tier}', [LeaderboardController::class, 'leaderboardUpdateTier']);
                Route::delete('/leaderboard/tiers/{tier}', [LeaderboardController::class, 'leaderboardDestroyTier']);
                Route::post('/leaderboard/tiers/reset', [LeaderboardController::class, 'leaderboardResetTiers']);
            });

            // ── Sport-scoped management (optional sport context layer) ──
            Route::prefix('{sportSlug}')
                ->middleware(['sport.context'])
                ->group(function () {
                    Route::get('/groups', [GroupManagementController::class, 'sportIndex']);
                    Route::post('/groups', [GroupManagementController::class, 'sportStore']);

                    Route::get('/sessions', [SessionManagementController::class, 'sportIndex']);
                    Route::post('/sessions', [SessionManagementController::class, 'sportStore']);

                    Route::middleware('feature:training_plans')->group(function () {
                        Route::get('/training-plans', [TrainingPlanController::class, 'sportIndex']);
                    });

                    Route::get('/swimmers', [SwimmerManagementController::class, 'sportIndex']);
                    Route::get('/coaches', [CoachManagementController::class, 'sportIndex']);
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
            Route::get('/sessions/{session}/attendance', [CoachApiController::class, 'sessionAttendance']);
            Route::patch('/sessions/{session}/attendance/{swimmer}', [CoachApiController::class, 'toggleAttendance']);
            Route::post('/sessions/{session}/cancel', [CoachApiController::class, 'sessionCancel']);

            // Coach profile/settings
            Route::get('/profile', [CoachApiController::class, 'profile']);
            Route::put('/profile', [CoachApiController::class, 'updateProfile']);

            // Swimmer detail
            Route::get('/swimmers/{swimmer}', [CoachApiController::class, 'swimmerDetail']);

            // Feature-gated: Evaluations
            Route::middleware('feature:evaluations')->group(function () {
                Route::post('/swimmers/{swimmer}/evaluate', [CoachApiController::class, 'evaluateSwimmer']);
            });

            // Weekly Report (Coach view)
            Route::get('/swimmers/{swimmer}/weekly-report', [SwimmerReportController::class, 'coachSwimmer']);

            // Training Plans (Coach)
            Route::get('/training-plans', [TrainingPlanController::class, 'coachPlans']);
            Route::post('/training-plans/{plan}/assign', [TrainingPlanController::class, 'assign']);
            Route::get('/training-plans/assignments', [TrainingPlanController::class, 'coachAssignments']);
            Route::patch('/training-plans/assignments/{assignment}', [TrainingPlanController::class, 'updateAssignment']);

            // Legacy
            Route::post('/daily-training', [CoachApiController::class, 'dailyTraining']);
        });

        // ── Swimmer ─────────────────────────────────────────
        Route::middleware(['role:SWIMMER', 'club.context'])->prefix('swimmer')->group(function () {
            // Always available (core)
            Route::get('/dashboard', [SwimmerApiController::class, 'dashboard']);
            Route::get('/sessions', [SwimmerApiController::class, 'sessions']);
            Route::get('/stats', [SwimmerApiController::class, 'stats']);

            // Training Plan
            Route::get('/training-plan', [TrainingPlanController::class, 'swimmerPlan']);

            // Weekly Report
            Route::get('/weekly-report', [SwimmerReportController::class, 'swimmerSelf']);

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
