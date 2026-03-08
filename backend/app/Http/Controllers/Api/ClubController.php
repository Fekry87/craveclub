<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSessionRequest;
use App\Http\Requests\StoreSwimmerRequest;
use App\Http\Requests\StoreTierRequest;
use App\Http\Requests\UpdateLeaderboardSettingsRequest;
use App\Enums\UserRole;
use App\Models\Club;
use App\Models\User;
use App\Models\CoachProfile;
use App\Models\SwimmerProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\TrainingPlan;
use App\Models\TrainingPlanItem;
use App\Models\TrainingSession;
use App\Models\Skill;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\ClubFeature;
use App\Services\AuditService;
use App\Services\XpCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ClubController extends Controller
{
    public function __construct(private XpCalculationService $xpService) {}

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

    /**
     * Return enabled features for the current club (sidebar rendering).
     */
    public function features(Request $request): JsonResponse
    {
        return response()->json(ClubFeature::forClub($request->user()->club_id));
    }

    // ── Dashboard ──
    public function dashboard(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;

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

        return response()->json([
            'swimmers_count' => $swimmersCount,
            'coaches_count' => $coachesCount,
            'groups_count' => $groupsCount,
            'upcoming_sessions' => $upcomingSessions,
            'attendance_rate_7d' => $attendanceRate,
            'sessions_count' => $sessionsCount,
            'top_swimmers' => $topSwimmers,
        ]);
    }

    // ── Settings ──
    public function settings(Request $request): JsonResponse
    {
        return response()->json($request->user()->club);
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

    // ── Training Plans ──
    public function planIndex(Request $request): JsonResponse
    {
        $query = TrainingPlan::with('items');
        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }
        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function planStore(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'level' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.sort_order' => 'integer',
            'items.*.stroke' => 'nullable|string|max:100',
            'items.*.drill' => 'nullable|string|max:255',
            'items.*.distance' => 'nullable|string|max:100',
            'items.*.reps' => 'nullable|integer',
            'items.*.interval' => 'nullable|string|max:100',
            'items.*.notes' => 'nullable|string',
        ]);

        $plan = TrainingPlan::create($request->only(['title', 'level', 'description']));

        if ($request->has('items')) {
            foreach ($request->items as $item) {
                $plan->items()->create(array_merge($item, ['club_id' => $request->user()->club_id]));
            }
        }

        return response()->json($plan->load('items'), 201);
    }

    public function planShow(TrainingPlan $plan): JsonResponse
    {
        $this->assertOwnership($plan);
        return response()->json($plan->load('items'));
    }

    public function planUpdate(Request $request, TrainingPlan $plan): JsonResponse
    {
        $this->assertOwnership($plan);
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'level' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
        ]);

        $plan->update($request->only(['title', 'level', 'description']));

        if ($request->has('items')) {
            $plan->items()->delete();
            foreach ($request->items as $item) {
                $plan->items()->create(array_merge($item, ['club_id' => $request->user()->club_id]));
            }
        }

        return response()->json($plan->load('items'));
    }

    public function planDestroy(TrainingPlan $plan): JsonResponse
    {
        $this->assertOwnership($plan);
        $plan->delete();
        return response()->json(['message' => 'Plan deleted']);
    }

    // ── Skills ──
    public function skillIndex(Request $request): JsonResponse
    {
        $query = Skill::query();
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }
        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function skillStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:SKILL,SWIM_TYPE,TECHNIQUE',
            'description' => 'nullable|string',
        ]);

        $skill = Skill::create($request->only(['name', 'type', 'description']));
        return response()->json($skill, 201);
    }

    public function skillUpdate(Request $request, Skill $skill): JsonResponse
    {
        $this->assertOwnership($skill);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:SKILL,SWIM_TYPE,TECHNIQUE',
            'description' => 'nullable|string',
        ]);

        $skill->update($request->only(['name', 'type', 'description']));
        return response()->json($skill);
    }

    public function skillDestroy(Skill $skill): JsonResponse
    {
        $this->assertOwnership($skill);
        $skill->delete();
        return response()->json(['message' => 'Skill deleted']);
    }

    // ── Coaches ──
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

    public function coachStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'bio' => 'nullable|string',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
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

    public function coachUpdate(Request $request, CoachProfile $coach): JsonResponse
    {
        $this->assertOwnership($coach);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'bio' => 'nullable|string',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

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

    // ── Swimmers ──
    public function swimmerIndex(Request $request): JsonResponse
    {
        $query = SwimmerProfile::with('user');
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

    public function swimmerStore(StoreSwimmerRequest $request): JsonResponse
    {
        $userId = null;
        if ($request->create_login) {
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
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

    public function swimmerUpdate(Request $request, SwimmerProfile $swimmer): JsonResponse
    {
        $this->assertOwnership($swimmer);
        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'level' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'guardian_email' => 'nullable|email|max:255',
            'medical_notes' => 'nullable|string',
        ]);

        $swimmer->update($request->only([
            'first_name', 'last_name', 'level', 'date_of_birth',
            'guardian_name', 'guardian_phone', 'guardian_email', 'medical_notes',
        ]));

        return response()->json($swimmer->load('user'));
    }

    public function swimmerDestroy(SwimmerProfile $swimmer): JsonResponse
    {
        $this->assertOwnership($swimmer);

        AuditService::log('swimmer.deleted', SwimmerProfile::class, $swimmer->id, [
            'swimmer_name' => $swimmer->first_name . ' ' . $swimmer->last_name,
            'user_id' => $swimmer->user_id,
        ]);

        if ($swimmer->user) {
            $swimmer->user->delete();
        }
        $swimmer->delete();
        return response()->json(['message' => 'Swimmer deleted']);
    }

    // ── Groups ──
    public function groupIndex(Request $request): JsonResponse
    {
        $query = Group::with(['coach', 'swimmers']);
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function groupStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'coach_user_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('club_id', app('current_club_id')),
            ],
        ]);

        $group = Group::create($request->only(['name', 'description', 'coach_user_id']));
        return response()->json($group->load(['coach', 'swimmers']), 201);
    }

    public function groupShow(Group $group): JsonResponse
    {
        $this->assertOwnership($group);
        return response()->json($group->load(['coach', 'swimmers', 'plans']));
    }

    public function groupUpdate(Request $request, Group $group): JsonResponse
    {
        $this->assertOwnership($group);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'coach_user_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('club_id', app('current_club_id')),
            ],
        ]);

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

    // ── Sessions ──
    public function sessionIndex(Request $request): JsonResponse
    {
        $query = TrainingSession::with(['group', 'plan']);
        if ($date = $request->input('date')) {
            $query->where('date', $date);
        }
        if ($groupId = $request->input('group_id')) {
            $query->where('group_id', $groupId);
        }
        if ($branchId = $request->input('branch_id')) {
            $query->where('branch_id', $branchId);
        }
        return response()->json($query->orderBy('date', 'desc')->orderBy('start_time')->paginate($request->input('per_page', 15)));
    }

    public function sessionStore(StoreSessionRequest $request): JsonResponse
    {
        $session = TrainingSession::create(array_merge(
            $request->only(['group_id', 'plan_id', 'date', 'start_time', 'end_time', 'location', 'notes']),
            ['club_id' => $request->user()->club_id]
        ));

        return response()->json($session->load(['group', 'plan']), 201);
    }

    public function sessionShow(TrainingSession $session): JsonResponse
    {
        $this->assertOwnership($session);
        return response()->json($session->load(['group.swimmers', 'plan.items', 'attendances.swimmer', 'evaluations.swimmer', 'groupEvaluation']));
    }

    public function sessionUpdate(Request $request, TrainingSession $session): JsonResponse
    {
        $this->assertOwnership($session);
        $request->validate([
            'group_id' => [
                'sometimes',
                Rule::exists('groups', 'id')->where('club_id', app('current_club_id')),
            ],
            'plan_id' => [
                'nullable',
                Rule::exists('training_plans', 'id')->where('club_id', app('current_club_id')),
            ],
            'date' => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $session->update($request->only(['group_id', 'plan_id', 'date', 'start_time', 'end_time', 'location', 'notes']));
        return response()->json($session->load(['group', 'plan']));
    }

    public function sessionDestroy(TrainingSession $session): JsonResponse
    {
        $this->assertOwnership($session);
        $session->delete();
        return response()->json(['message' => 'Session deleted']);
    }

    // ── Leaderboard Settings ──

    public function leaderboardSettings(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;
        $settings = LeaderboardSetting::forClub($clubId);
        $tiers = LevelTier::forClub($clubId);

        return response()->json([
            'settings' => $settings,
            'tiers' => $tiers,
        ]);
    }

    public function leaderboardUpdateSettings(UpdateLeaderboardSettingsRequest $request): JsonResponse
    {
        $clubId = $request->user()->club_id;
        $settings = LeaderboardSetting::forClub($clubId);
        $before = $settings->toArray();
        $settings->update($request->only([
            'rating_xp_1', 'rating_xp_2', 'rating_xp_3', 'rating_xp_4', 'rating_xp_5',
            'attendance_xp', 'streak_bonus_xp', 'streak_threshold',
        ]));

        AuditService::log('leaderboard.settings_changed', LeaderboardSetting::class, $settings->id, [
            'before' => $before,
            'after' => $settings->fresh()->toArray(),
        ]);

        return response()->json($settings);
    }

    public function leaderboardStoreTier(StoreTierRequest $request): JsonResponse
    {
        $clubId = $request->user()->club_id;

        if (LevelTier::where('club_id', $clubId)->where('xp_threshold', $request->xp_threshold)->exists()) {
            return response()->json(['message' => 'A tier with this XP threshold already exists'], 422);
        }

        $maxOrder = LevelTier::where('club_id', $clubId)->max('sort_order') ?? 0;

        $tier = LevelTier::create([
            'club_id' => $clubId,
            'name' => $request->name,
            'xp_threshold' => $request->xp_threshold,
            'color' => $request->color,
            'icon' => $request->icon,
            'sort_order' => $maxOrder + 1,
        ]);

        $this->resortTiers($clubId);

        return response()->json($tier, 201);
    }

    public function leaderboardUpdateTier(StoreTierRequest $request, LevelTier $tier): JsonResponse
    {
        $this->assertOwnership($tier);
        $clubId = $request->user()->club_id;

        $conflict = LevelTier::where('club_id', $clubId)
            ->where('xp_threshold', $request->xp_threshold)
            ->where('id', '!=', $tier->id)
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'A tier with this XP threshold already exists'], 422);
        }

        $tier->update($request->only(['name', 'xp_threshold', 'color', 'icon']));
        $this->resortTiers($clubId);

        return response()->json($tier);
    }

    public function leaderboardDestroyTier(LevelTier $tier): JsonResponse
    {
        $this->assertOwnership($tier);
        $clubId = $tier->club_id;
        $count = LevelTier::where('club_id', $clubId)->count();

        if ($count <= 2) {
            return response()->json(['message' => 'Minimum 2 level tiers required'], 422);
        }

        if ($tier->xp_threshold === 0) {
            return response()->json(['message' => 'Cannot delete the base tier (0 XP)'], 422);
        }

        $tier->delete();
        $this->resortTiers($clubId);

        return response()->json(['message' => 'Tier deleted']);
    }

    public function leaderboardResetTiers(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;
        LevelTier::where('club_id', $clubId)->delete();
        LevelTier::seedForClub($clubId);

        return response()->json(LevelTier::forClub($clubId));
    }

    public function leaderboardOverview(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;
        $settings = LeaderboardSetting::forClub($clubId);
        $tiers = LevelTier::forClub($clubId)->toArray();
        $swimmers = SwimmerProfile::where('club_id', $clubId)->get();

        $distribution = [];
        $topSwimmers = [];

        foreach ($swimmers as $swimmer) {
            $xpData = $this->xpService->computeForSwimmer($swimmer->id, $clubId, $settings);
            $level = $this->xpService->getLevelFromTiers($xpData['total_xp'], $tiers);

            $topSwimmers[] = [
                'swimmer_id' => $swimmer->id,
                'name' => $swimmer->first_name . ' ' . $swimmer->last_name,
                'total_xp' => $xpData['total_xp'],
                'level_name' => $level['name'],
                'level_color' => $level['color'],
            ];

            $levelName = $level['name'];
            $distribution[$levelName] = ($distribution[$levelName] ?? 0) + 1;
        }

        usort($topSwimmers, fn($a, $b) => $b['total_xp'] - $a['total_xp']);
        $topSwimmers = array_slice($topSwimmers, 0, 10);

        return response()->json([
            'total_swimmers' => count($swimmers),
            'level_distribution' => $distribution,
            'top_swimmers' => $topSwimmers,
        ]);
    }

    private function resortTiers(int $clubId): void
    {
        $tiers = LevelTier::where('club_id', $clubId)->orderBy('xp_threshold', 'asc')->get();
        foreach ($tiers as $i => $tier) {
            $tier->update(['sort_order' => $i + 1]);
        }
    }
}
