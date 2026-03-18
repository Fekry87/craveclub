<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\Registration;
use App\Models\SportModule;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Services\ClubAnalyticsService;
use App\Services\XpCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClubDashboardController extends Controller
{
    public function __construct(
        private XpCalculationService $xpService,
        private ClubAnalyticsService $analyticsService,
    ) {}

    /**
     * Return enabled features for the current club (sidebar rendering).
     */
    public function features(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;

        try {
            $features = Cache::remember("club_features_{$clubId}", 3600, fn () => ClubFeature::forClub($clubId));
        } catch (\Exception $e) {
            Log::warning('Cache unavailable, using direct query', ['club_id' => $clubId, 'method' => 'features']);
            $features = ClubFeature::forClub($clubId);
        }

        return response()->json($features);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;

        try {
            $metrics = Cache::remember("dashboard_metrics_{$clubId}", 300, fn () => $this->computeDashboardMetrics($clubId));
        } catch (\Exception $e) {
            Log::warning('Cache unavailable, using direct query', ['club_id' => $clubId, 'method' => 'dashboard']);
            $metrics = $this->computeDashboardMetrics($clubId);
        }

        return response()->json($metrics);
    }

    private function computeDashboardMetrics(int $clubId): array
    {
        $swimmersCount = SwimmerProfile::where('club_id', $clubId)->count();
        $coachesCount = CoachProfile::where('club_id', $clubId)->count();
        $groupsCount = Group::where('club_id', $clubId)->count();
        $upcomingSessions = TrainingSession::where('club_id', $clubId)
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')->orderBy('start_time')->take(5)->with('group')->get();

        $last7days = TrainingSession::where('club_id', $clubId)
            ->where('date', '>=', now()->subDays(7)->toDateString())
            ->where('date', '<=', now()->toDateString())
            ->withCount(['attendances as present_count' => function ($q) {
                $q->where('present', true);
            }, 'attendances as total_count'])
            ->get();

        $totalAttendance = $last7days->sum('total_count');
        $presentAttendance = $last7days->sum('present_count');
        $attendanceRate = $totalAttendance > 0 ? round(($presentAttendance / $totalAttendance) * 100, 1) : 0;

        $topSwimmers = $this->xpService->getTopSwimmers($clubId, 5);
        $sessionsCount = TrainingSession::where('club_id', $clubId)->count();

        return [
            'swimmers_count' => $swimmersCount,
            'coaches_count' => $coachesCount,
            'groups_count' => $groupsCount,
            'upcoming_sessions' => $upcomingSessions,
            'attendance_rate_7d' => $attendanceRate,
            'sessions_count' => $sessionsCount,
            'top_swimmers' => $topSwimmers,
        ];
    }

    public function settings(Request $request): JsonResponse
    {
        return response()->json($request->user()->club);
    }

    /**
     * List active sport modules for the current club with computed stats.
     */
    public function sportModules(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;

        $club = Club::findOrFail($clubId);
        $modules = $club->activeSportModules()->orderBy('sort_order')->get();

        // Club-level counts (not sport-scoped) — single query
        $branchesCount = Branch::where('club_id', $clubId)->count();

        // Pre-load all groups for this club with sport_module_id — zero per-module queries
        $allGroups = Group::where('club_id', $clubId)
            ->whereNotNull('sport_module_id')
            ->select('id', 'sport_module_id')
            ->get()
            ->groupBy('sport_module_id');

        // Pre-load all memberships for those groups in one query
        $allGroupIds = $allGroups->flatten()->pluck('id');
        $membershipsByGroup = $allGroupIds->isNotEmpty()
            ? DB::table('group_memberships')
                ->whereIn('group_id', $allGroupIds)
                ->select('group_id', 'swimmer_id')
                ->get()
                ->groupBy('group_id')
            : collect();

        // Pre-load pending registration counts per sport module in one query
        $pendingByModule = Registration::where('club_id', $clubId)
            ->where('status', 'pending')
            ->whereNotNull('sport_module_id')
            ->selectRaw('sport_module_id, COUNT(*) as cnt')
            ->groupBy('sport_module_id')
            ->pluck('cnt', 'sport_module_id');

        $result = $modules->map(function ($module) use ($branchesCount, $allGroups, $membershipsByGroup, $pendingByModule) {
            $moduleId = $module->id;
            $moduleGroups = $allGroups->get($moduleId, collect());
            $moduleGroupIds = $moduleGroups->pluck('id');

            // Compute active swimmers from pre-loaded data
            $activeSwimmers = $moduleGroupIds
                ->flatMap(fn ($gid) => $membershipsByGroup->get($gid, collect()))
                ->pluck('swimmer_id')
                ->unique()
                ->count();

            return [
                'id' => $module->id,
                'name' => $module->name,
                'slug' => $module->slug,
                'icon' => $module->icon,
                'color' => $module->color,
                'description' => $module->description,
                'stats' => [
                    'branches_count' => $branchesCount,
                    'new_registrations_count' => $pendingByModule->get($moduleId, 0),
                    'active_swimmers_count' => $activeSwimmers,
                ],
            ];
        });

        return response()->json($result);
    }

    /**
     * Show a single sport module with detail stats for the current club.
     */
    public function sportModuleShow(Request $request, SportModule $module): JsonResponse
    {
        $clubId = $request->user()->club_id;

        // Verify the module is assigned to this club
        $isAssigned = $module->clubs()
            ->where('club_id', $clubId)
            ->wherePivot('is_active', true)
            ->exists();

        abort_if(! $isAssigned, 404);

        $moduleId = $module->id;
        $weekStart = now()->startOfWeek()->toDateString();
        $weekEnd = now()->endOfWeek()->toDateString();

        $groupIds = Group::where('club_id', $clubId)
            ->where('sport_module_id', $moduleId)
            ->pluck('id');

        $membersCount = $groupIds->isNotEmpty()
            ? \DB::table('group_memberships')->whereIn('group_id', $groupIds)->distinct('swimmer_id')->count('swimmer_id')
            : 0;

        $coachesCount = Group::where('club_id', $clubId)
            ->where('sport_module_id', $moduleId)
            ->whereNotNull('coach_user_id')
            ->distinct('coach_user_id')
            ->count('coach_user_id');

        $groupsCount = $groupIds->count();

        $sessionsThisWeek = TrainingSession::where('club_id', $clubId)
            ->where('sport_module_id', $moduleId)
            ->whereBetween('date', [$weekStart, $weekEnd])
            ->count();

        $recentSessions = TrainingSession::where('club_id', $clubId)
            ->where('sport_module_id', $moduleId)
            ->orderByDesc('date')
            ->orderByDesc('start_time')
            ->take(10)
            ->with('group:id,name')
            ->get();

        // Registration sport_ids stores sport slugs/names — match by module slug
        $pendingRegistrations = Registration::where('club_id', $clubId)
            ->where('status', 'pending')
            ->whereJsonContains('sport_ids', $module->slug)
            ->count();

        return response()->json([
            'id' => $module->id,
            'name' => $module->name,
            'slug' => $module->slug,
            'icon' => $module->icon,
            'color' => $module->color,
            'description' => $module->description,
            'stats' => [
                'members_count' => $membersCount,
                'coaches_count' => $coachesCount,
                'groups_count' => $groupsCount,
                'sessions_this_week' => $sessionsThisWeek,
            ],
            'recent_sessions' => $recentSessions,
            'pending_registrations' => $pendingRegistrations,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'logo_url' => 'nullable|string|max:500',
            'theme_color' => 'nullable|string|max:7',
            'about' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
        ]);

        $club = Club::findOrFail($request->user()->club_id);
        $club->update($request->only(['name', 'logo_url', 'theme_color', 'about', 'contact_email', 'contact_phone']));

        return response()->json($club);
    }

    public function analytics(): JsonResponse
    {
        $clubId = app('current_club_id');

        try {
            $data = Cache::remember("analytics_full_{$clubId}", 1800, fn () => $this->computeAnalytics($clubId));
        } catch (\Exception $e) {
            Log::warning('Cache unavailable, using direct query', ['club_id' => $clubId, 'method' => 'analytics']);
            $data = $this->computeAnalytics($clubId);
        }

        return response()->json($data);
    }

    private function computeAnalytics(int $clubId): array
    {
        return [
            'membership_growth' => $this->analyticsService->getMembershipGrowth($clubId),
            'retention' => $this->analyticsService->getRetentionMetrics($clubId),
            'attendance_trend' => $this->analyticsService->getAttendanceTrend($clubId),
            'registration_funnel' => $this->analyticsService->getRegistrationFunnel($clubId),
            'coach_performance' => $this->analyticsService->getCoachPerformanceSummary($clubId),
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
