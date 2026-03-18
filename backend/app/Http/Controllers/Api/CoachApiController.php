<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendGuardianSMSJob;
use App\Models\Attendance;
use App\Models\Club;
use App\Models\DailyEvaluation;
use App\Models\Group;
use App\Models\GroupEvaluation;
use App\Models\GroupMembership;
use App\Models\SessionExclusion;
use App\Models\SessionSwimmer;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class CoachApiController extends Controller
{
    private function coachGroupIds(Request $request): \Illuminate\Support\Collection
    {
        return Group::where('coach_user_id', $request->user()->id)->pluck('id');
    }

    // ─── DASHBOARD ────────────────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $groups = Group::where('coach_user_id', $user->id)->withCount('swimmers')->get();
        $groupIds = $groups->pluck('id');

        $todaySessions = TrainingSession::whereIn('group_id', $groupIds)
            ->where('date', now()->toDateString())
            ->with('group')
            ->get();

        $upcomingSessions = TrainingSession::whereIn('group_id', $groupIds)
            ->where('date', '>=', now()->toDateString())
            ->where('status', '!=', 'Cancelled')
            ->orderBy('date')->orderBy('start_time')
            ->take(5)
            ->with('group')
            ->get();

        $liveSessions = TrainingSession::whereIn('group_id', $groupIds)
            ->where('status', 'Live')
            ->with('group')
            ->get();

        return response()->json([
            'groups' => $groups,
            'today_sessions' => $todaySessions,
            'upcoming_sessions' => $upcomingSessions,
            'live_sessions' => $liveSessions,
            'stats' => [
                'total_groups' => $groups->count(),
                'today_count' => $todaySessions->count(),
                'live_count' => $liveSessions->count(),
                'upcoming_count' => $upcomingSessions->count(),
            ],
        ]);
    }

    // ─── GROUPS CRUD ────────────────────────────────────────────────

    public function groups(Request $request): JsonResponse
    {
        $groups = Group::where('coach_user_id', $request->user()->id)
            ->with(['swimmers', 'plans'])
            ->withCount('swimmers')
            ->paginate(20);

        return response()->json($groups);
    }

    public function groupStore(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'swimmer_ids' => 'nullable|array',
            'swimmer_ids.*' => [Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
        ]);

        $group = Group::create([
            'club_id' => $user->club_id,
            'name' => $request->name,
            'description' => $request->description,
            'coach_user_id' => $user->id,
        ]);

        if ($request->filled('swimmer_ids')) {
            foreach ($request->swimmer_ids as $swimmerId) {
                GroupMembership::create([
                    'club_id' => $user->club_id,
                    'group_id' => $group->id,
                    'swimmer_id' => $swimmerId,
                ]);
            }
        }

        return response()->json($group->load(['swimmers', 'plans'])->loadCount('swimmers'), 201);
    }

    public function groupUpdate(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $group = Group::where('coach_user_id', $user->id)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'swimmer_ids' => 'nullable|array',
            'swimmer_ids.*' => [Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
        ]);

        $group->update($request->only(['name', 'description']));

        if ($request->has('swimmer_ids')) {
            GroupMembership::where('group_id', $group->id)->delete();
            foreach ($request->swimmer_ids as $swimmerId) {
                GroupMembership::create([
                    'club_id' => $user->club_id,
                    'group_id' => $group->id,
                    'swimmer_id' => $swimmerId,
                ]);
            }
        }

        return response()->json($group->load(['swimmers', 'plans'])->loadCount('swimmers'));
    }

    public function groupDestroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $group = Group::where('coach_user_id', $user->id)->findOrFail($id);

        // Delete memberships first
        GroupMembership::where('group_id', $group->id)->delete();
        $group->delete();

        return response()->json(['message' => 'Group deleted']);
    }

    // ─── ALL SWIMMERS (for add-to-session picker) ─────────────────

    public function allSwimmers(Request $request): JsonResponse
    {
        $swimmers = SwimmerProfile::where('club_id', app('current_club_id'))
            ->select('id', 'first_name', 'last_name', 'level')
            ->orderBy('first_name')
            ->get();

        return response()->json($swimmers);
    }

    // ─── SESSION CRUD ─────────────────────────────────────────────

    public function sessionIndex(Request $request): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);

        // Always compute status counts from ALL sessions (unfiltered except group)
        $baseQuery = TrainingSession::whereIn('group_id', $groupIds);
        if ($groupId = $request->input('group_id')) {
            $baseQuery->where('group_id', $groupId);
        }
        $allForCounts = (clone $baseQuery)->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $statusCounts = [
            'Scheduled' => $allForCounts->get('Scheduled', 0),
            'Live' => $allForCounts->get('Live', 0),
            'Completed' => $allForCounts->get('Completed', 0),
            'Cancelled' => $allForCounts->get('Cancelled', 0),
        ];
        $statusCounts['all'] = array_sum($statusCounts);

        // Now apply status filter for the actual results
        $query = TrainingSession::whereIn('group_id', $groupIds)
            ->with(['group', 'plan']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($groupId = $request->input('group_id')) {
            $query->where('group_id', $groupId);
        }
        if ($from = $request->input('from')) {
            $query->where('date', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('date', '<=', $to);
        }

        $sessions = $query->orderBy('date', 'desc')
            ->orderBy('start_time')
            ->paginate($request->input('per_page', 50));

        $result = $sessions->toArray();
        $result['status_counts'] = $statusCounts;

        return response()->json($result);
    }

    public function sessionStore(Request $request): JsonResponse
    {
        $user = $request->user();
        $groupIds = $this->coachGroupIds($request);

        $request->validate([
            'group_id' => ['required', Rule::exists('groups', 'id')->where('club_id', app('current_club_id')), Rule::in($groupIds->toArray())],
            'plan_id' => ['nullable', Rule::exists('training_plans', 'id')->where('club_id', app('current_club_id'))],
            'title' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:General,Technique,Endurance,Speed,Test,Recovery,Custom',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'added_swimmer_ids' => 'nullable|array',
            'added_swimmer_ids.*' => [Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
            'excluded_swimmer_ids' => 'nullable|array',
            'excluded_swimmer_ids.*' => [Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
        ]);

        $session = TrainingSession::create([
            'club_id' => $user->club_id,
            'coach_user_id' => $user->id,
            'group_id' => $request->group_id,
            'plan_id' => $request->plan_id,
            'title' => $request->title,
            'type' => $request->type ?? 'General',
            'status' => 'Scheduled',
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'location' => $request->location,
            'notes' => $request->notes,
        ]);

        if ($request->filled('added_swimmer_ids')) {
            foreach ($request->added_swimmer_ids as $swimmerId) {
                SessionSwimmer::create([
                    'club_id' => $user->club_id,
                    'session_id' => $session->id,
                    'swimmer_id' => $swimmerId,
                ]);
            }
        }

        if ($request->filled('excluded_swimmer_ids')) {
            foreach ($request->excluded_swimmer_ids as $swimmerId) {
                SessionExclusion::create([
                    'club_id' => $user->club_id,
                    'session_id' => $session->id,
                    'swimmer_id' => $swimmerId,
                ]);
            }
        }

        return response()->json($session->load(['group', 'plan']), 201);
    }

    public function sessionShow(Request $request, int $id): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);

        $session = TrainingSession::whereIn('group_id', $groupIds)
            ->with([
                'group.swimmers', 'plan.items', 'coach',
                'attendances.swimmer', 'evaluations.swimmer', 'groupEvaluation',
                'sessionSwimmers', 'sessionExclusions',
            ])
            ->findOrFail($id);

        $sessionData = $session->toArray();
        $sessionData['effective_roster'] = $session->effective_swimmers;

        return response()->json($sessionData);
    }

    public function sessionUpdate(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $groupIds = $this->coachGroupIds($request);
        $session = TrainingSession::whereIn('group_id', $groupIds)->findOrFail($id);

        $request->validate([
            'group_id' => ['sometimes', Rule::exists('groups', 'id')->where('club_id', app('current_club_id'))],
            'plan_id' => ['nullable', Rule::exists('training_plans', 'id')->where('club_id', app('current_club_id'))],
            'title' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:General,Technique,Endurance,Speed,Test,Recovery,Custom',
            'date' => 'sometimes|date',
            'start_time' => 'sometimes',
            'end_time' => 'sometimes',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'added_swimmer_ids' => 'nullable|array',
            'added_swimmer_ids.*' => [Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
            'excluded_swimmer_ids' => 'nullable|array',
            'excluded_swimmer_ids.*' => [Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
        ]);

        $session->update($request->only([
            'group_id', 'plan_id', 'title', 'type',
            'date', 'start_time', 'end_time', 'location', 'notes',
        ]));

        if ($request->has('added_swimmer_ids')) {
            SessionSwimmer::where('session_id', $session->id)->delete();
            foreach ($request->added_swimmer_ids as $swimmerId) {
                SessionSwimmer::create([
                    'club_id' => $user->club_id,
                    'session_id' => $session->id,
                    'swimmer_id' => $swimmerId,
                ]);
            }
        }

        if ($request->has('excluded_swimmer_ids')) {
            SessionExclusion::where('session_id', $session->id)->delete();
            foreach ($request->excluded_swimmer_ids as $swimmerId) {
                SessionExclusion::create([
                    'club_id' => $user->club_id,
                    'session_id' => $session->id,
                    'swimmer_id' => $swimmerId,
                ]);
            }
        }

        return response()->json($session->load(['group', 'plan']));
    }

    public function sessionDestroy(Request $request, int $id): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);
        $session = TrainingSession::whereIn('group_id', $groupIds)
            ->where('status', 'Scheduled')
            ->findOrFail($id);

        $session->delete();

        return response()->json(['message' => 'Session deleted']);
    }

    // ─── SESSION LIFECYCLE ────────────────────────────────────────

    public function sessionStart(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $groupIds = $this->coachGroupIds($request);

        $session = TrainingSession::whereIn('group_id', $groupIds)
            ->where('status', 'Scheduled')
            ->with(['group.swimmers', 'sessionSwimmers', 'sessionExclusions'])
            ->findOrFail($id);

        $session->update([
            'status' => 'Live',
            'started_at' => now(),
        ]);

        $effectiveSwimmers = $session->effective_swimmers;
        foreach ($effectiveSwimmers as $swimmer) {
            Attendance::firstOrCreate(
                ['session_id' => $session->id, 'swimmer_id' => $swimmer->id],
                ['club_id' => $user->club_id, 'present' => false]
            );
        }

        return response()->json($session->load([
            'group.swimmers', 'plan.items',
            'attendances.swimmer', 'evaluations.swimmer', 'groupEvaluation',
            'sessionSwimmers', 'sessionExclusions',
        ]));
    }

    public function sessionComplete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $groupIds = $this->coachGroupIds($request);

        $session = TrainingSession::whereIn('group_id', $groupIds)
            ->where('status', 'Live')
            ->findOrFail($id);

        $request->validate([
            'summary_notes' => 'nullable|string',
            'attendance' => 'nullable|array',
            'attendance.*.swimmer_id' => ['required', Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
            'attendance.*.present' => 'required|boolean',
            'evaluations' => 'nullable|array',
            'evaluations.*.swimmer_id' => ['required', Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
            'evaluations.*.rating' => 'required|integer|min:1|max:5',
            'evaluations.*.notes' => 'nullable|string',
            'group_evaluation' => 'nullable|array',
            'group_evaluation.rating' => 'nullable|integer|min:1|max:5',
            'group_evaluation.notes' => 'nullable|string',
        ]);

        if ($request->has('attendance')) {
            foreach ($request->attendance as $att) {
                Attendance::updateOrCreate(
                    ['session_id' => $session->id, 'swimmer_id' => $att['swimmer_id']],
                    ['club_id' => $user->club_id, 'present' => $att['present']]
                );
            }
        }

        if ($request->has('evaluations')) {
            foreach ($request->evaluations as $eval) {
                DailyEvaluation::updateOrCreate(
                    ['session_id' => $session->id, 'swimmer_id' => $eval['swimmer_id']],
                    ['club_id' => $user->club_id, 'rating' => $eval['rating'], 'notes' => $eval['notes'] ?? null]
                );
            }
        }

        if ($request->has('group_evaluation') && $request->group_evaluation) {
            GroupEvaluation::updateOrCreate(
                ['session_id' => $session->id, 'group_id' => $session->group_id],
                [
                    'club_id' => $user->club_id,
                    'rating' => $request->group_evaluation['rating'] ?? 3,
                    'notes' => $request->group_evaluation['notes'] ?? null,
                ]
            );
        }

        $session->update([
            'status' => 'Completed',
            'completed_at' => now(),
            'summary_notes' => $request->summary_notes,
        ]);

        // ── Absence Alert Notifications ──
        if ($request->has('attendance')) {
            $clubId = app('current_club_id');
            $notificationService = app(NotificationService::class);
            $coachUserId = $session->coach_user_id ?? $request->user()->id;

            foreach ($request->attendance as $att) {
                if (! $att['present']) {
                    $swimmer = SwimmerProfile::find($att['swimmer_id']);
                    if (! $swimmer) {
                        continue;
                    }

                    // Notify coach: single absence
                    $notificationService->notify(
                        userId: $coachUserId,
                        type: 'absence_alert',
                        title: 'Swimmer Absence',
                        body: "{$swimmer->full_name} was absent from session {$session->title} on {$session->date}",
                        data: ['swimmer_id' => $swimmer->id, 'session_id' => $session->id],
                        clubId: $clubId,
                    );

                    // Notify swimmer (parent sees via shared account)
                    if ($swimmer->user_id) {
                        $notificationService->notify(
                            userId: $swimmer->user_id,
                            type: 'absence_recorded',
                            title: 'Absence Recorded',
                            body: "Your absence from session {$session->title} on ".\Carbon\Carbon::parse($session->date)->format('d/m/Y').' has been recorded',
                            data: ['session_id' => $session->id],
                            clubId: $clubId,
                        );
                    }

                    // Check consecutive absences
                    $recentAbsences = Attendance::where('attendance.swimmer_id', $swimmer->id)
                        ->where('attendance.present', false)
                        ->whereHas('session', fn ($q) => $q->where('club_id', $clubId)->where('status', 'Completed'))
                        ->join('training_sessions', 'attendance.session_id', '=', 'training_sessions.id')
                        ->orderByDesc('training_sessions.date')
                        ->take(3)
                        ->pluck('attendance.present');

                    $consecutiveCount = $recentAbsences->count();

                    // 2+ consecutive absences → notify guardian via SMS job
                    if ($consecutiveCount >= 2 && $recentAbsences->every(fn ($v) => ! $v) && $swimmer->guardian_phone) {
                        $club = Club::find($clubId);
                        SendGuardianSMSJob::dispatch(
                            guardianPhone: $swimmer->guardian_phone,
                            guardianName: $swimmer->guardian_name ?? 'Guardian',
                            swimmerName: $swimmer->full_name,
                            clubName: $club?->name ?? '',
                            swimmerId: $swimmer->id,
                            sessionId: $session->id,
                        );
                    }

                    // 3+ consecutive absences → notify manager
                    if ($consecutiveCount >= 3 && $recentAbsences->every(fn ($v) => ! $v)) {
                        $manager = User::where('club_id', $clubId)->where('role', 'CLUB_MANAGER')->first();
                        if ($manager) {
                            $notificationService->notify(
                                userId: $manager->id,
                                type: 'repeated_absence',
                                title: 'Repeated Absence',
                                body: "{$swimmer->full_name} has missed 3 consecutive sessions — needs follow-up",
                                data: ['swimmer_id' => $swimmer->id, 'session_id' => $session->id],
                                clubId: $clubId,
                            );
                        }
                    }
                }
            }
        }

        // Bust dashboard and analytics caches after session completion
        $clubId = app('current_club_id');
        Cache::forget("dashboard_metrics_{$clubId}");
        Cache::forget("analytics_coaches_{$clubId}");
        Cache::forget("analytics_attendance_trend_{$clubId}");
        Cache::forget("analytics_full_{$clubId}");

        return response()->json([
            'message' => 'Session completed',
            'session' => $session->load([
                'attendances.swimmer', 'evaluations.swimmer', 'groupEvaluation',
            ]),
        ]);
    }

    public function sessionRoster(Request $request, int $id): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);

        $session = TrainingSession::whereIn('group_id', $groupIds)
            ->with(['group.swimmers', 'sessionSwimmers', 'sessionExclusions'])
            ->findOrFail($id);

        return response()->json([
            'group_swimmers' => $session->group ? $session->group->swimmers : [],
            'added_swimmers' => $session->sessionSwimmers,
            'excluded_swimmers' => $session->sessionExclusions,
            'effective_roster' => $session->effective_swimmers,
        ]);
    }

    // ─── SESSION ATTENDANCE ──────────────────────────────────────────

    public function sessionAttendance(Request $request, int $id): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);

        $session = TrainingSession::whereIn('group_id', $groupIds)
            ->with(['group.swimmers', 'sessionSwimmers', 'sessionExclusions'])
            ->findOrFail($id);

        $effectiveSwimmers = $session->effective_swimmers;
        $attendances = Attendance::where('session_id', $session->id)->get()->keyBy('swimmer_id');
        $evaluations = DailyEvaluation::where('session_id', $session->id)->get()->keyBy('swimmer_id');

        $roster = $effectiveSwimmers->map(function ($swimmer) use ($attendances, $evaluations) {
            $att = $attendances->get($swimmer->id);
            $eval = $evaluations->get($swimmer->id);

            return [
                'swimmer_id' => $swimmer->id,
                'first_name' => $swimmer->first_name,
                'last_name' => $swimmer->last_name,
                'avatar_url' => $swimmer->avatar_url ?? null,
                'present' => $att ? (bool) $att->present : false,
                'evaluated' => $eval !== null,
                'rating' => $eval?->rating,
                'notes' => $eval?->notes,
            ];
        })->values();

        $presentCount = $roster->where('present', true)->count();

        return response()->json([
            'session' => [
                'id' => $session->id,
                'title' => $session->title,
                'date' => $session->date?->toDateString(),
                'start_time' => $session->start_time,
                'end_time' => $session->end_time,
                'status' => $session->status,
                'group_id' => $session->group_id,
                'group' => $session->group ? [
                    'id' => $session->group->id,
                    'name' => $session->group->name,
                    'description' => $session->group->description,
                ] : null,
            ],
            'roster' => $roster,
            'summary' => [
                'total' => $roster->count(),
                'present' => $presentCount,
                'absent' => $roster->count() - $presentCount,
                'evaluated' => $roster->where('evaluated', true)->count(),
            ],
        ]);
    }

    public function toggleAttendance(Request $request, int $sessionId, int $swimmerId): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);
        $clubId = app('current_club_id');

        $session = TrainingSession::whereIn('group_id', $groupIds)
            ->with(['group.swimmers', 'sessionSwimmers', 'sessionExclusions'])
            ->findOrFail($sessionId);

        if (! in_array($session->status, ['Live', 'Completed'])) {
            return response()->json(['message' => 'Cannot update attendance for a session that is not Live or Completed.'], 422);
        }

        $effectiveIds = $session->effective_swimmers->pluck('id');
        if (! $effectiveIds->contains($swimmerId)) {
            return response()->json(['message' => 'Swimmer is not in this session roster.'], 422);
        }

        $request->validate([
            'present' => 'required|boolean',
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string|max:500',
        ]);

        Attendance::updateOrCreate(
            ['session_id' => $sessionId, 'swimmer_id' => $swimmerId],
            ['club_id' => $clubId, 'present' => $request->present]
        );

        if ($request->has('rating') && $request->rating !== null) {
            DailyEvaluation::updateOrCreate(
                ['session_id' => $sessionId, 'swimmer_id' => $swimmerId],
                ['club_id' => $clubId, 'rating' => $request->rating, 'notes' => $request->notes]
            );
        }

        $swimmer = SwimmerProfile::find($swimmerId);
        $att = Attendance::where('session_id', $sessionId)->where('swimmer_id', $swimmerId)->first();
        $eval = DailyEvaluation::where('session_id', $sessionId)->where('swimmer_id', $swimmerId)->first();

        return response()->json([
            'swimmer_id' => $swimmer->id,
            'first_name' => $swimmer->first_name,
            'last_name' => $swimmer->last_name,
            'avatar_url' => $swimmer->avatar_url ?? null,
            'present' => (bool) $att->present,
            'evaluated' => $eval !== null,
            'rating' => $eval?->rating,
            'notes' => $eval?->notes,
        ]);
    }

    public function sessionCancel(Request $request, int $id): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);

        $session = TrainingSession::whereIn('group_id', $groupIds)->findOrFail($id);

        if ($session->status !== 'Scheduled') {
            return response()->json(['message' => 'Only scheduled sessions can be cancelled.'], 422);
        }

        $session->update(['status' => 'Cancelled']);

        return response()->json($session);
    }

    // ─── COACH PROFILE / SETTINGS ──────────────────────────────────

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $coachProfile = $user->coachProfile;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'profile' => $coachProfile ? [
                'bio' => $coachProfile->bio,
                'specialization' => $coachProfile->specialization,
                'phone' => $coachProfile->phone,
            ] : null,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        if ($request->has('name')) {
            $user->update(['name' => $request->name]);
        }

        $profile = $user->coachProfile;
        if ($profile) {
            $profile->update($request->only(['bio', 'specialization', 'phone']));
        } else {
            $user->coachProfile()->create([
                'club_id' => $user->club_id,
                'bio' => $request->bio,
                'specialization' => $request->specialization,
                'phone' => $request->phone,
            ]);
        }

        return response()->json(['message' => 'Profile updated']);
    }

    // ─── SWIMMER DETAIL (for coach to view & evaluate) ────────────

    public function swimmerDetail(Request $request, int $id): JsonResponse
    {
        $groupIds = $this->coachGroupIds($request);

        // Swimmer must be in one of coach's groups
        $swimmer = SwimmerProfile::with(['groups' => function ($q) use ($groupIds) {
            $q->whereIn('groups.id', $groupIds);
        }])->findOrFail($id);

        // Check swimmer belongs to at least one of coach's groups
        $swimmerGroupIds = $swimmer->groups->pluck('id');
        if ($swimmerGroupIds->intersect($groupIds)->isEmpty()) {
            abort(403, 'Swimmer not in your groups');
        }

        // Get evaluations for this swimmer from coach's sessions
        $evaluations = DailyEvaluation::where('swimmer_id', $id)
            ->whereHas('session', function ($q) use ($groupIds) {
                $q->whereIn('group_id', $groupIds);
            })
            ->with(['session' => function ($q) {
                $q->select('id', 'date', 'start_time', 'end_time', 'group_id', 'title')
                    ->with('group:id,name');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get attendance for this swimmer from coach's sessions
        $attendances = Attendance::where('swimmer_id', $id)
            ->whereHas('session', function ($q) use ($groupIds) {
                $q->whereIn('group_id', $groupIds);
            })
            ->get();

        $totalSessions = $attendances->count();
        $attended = $attendances->where('present', true)->count();
        $avgRating = $evaluations->avg('rating');

        return response()->json([
            'swimmer' => [
                'id' => $swimmer->id,
                'first_name' => $swimmer->first_name,
                'last_name' => $swimmer->last_name,
                'full_name' => $swimmer->fullName,
                'level' => $swimmer->level,
                'date_of_birth' => $swimmer->date_of_birth,
                'groups' => $swimmer->groups->map(fn ($g) => ['id' => $g->id, 'name' => $g->name]),
            ],
            'evaluations' => $evaluations,
            'stats' => [
                'total_sessions' => $totalSessions,
                'sessions_attended' => $attended,
                'attendance_rate' => $totalSessions > 0 ? round(($attended / $totalSessions) * 100) : 0,
                'average_rating' => $avgRating ? round($avgRating, 1) : null,
                'total_evaluations' => $evaluations->count(),
            ],
        ]);
    }

    public function evaluateSwimmer(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $groupIds = $this->coachGroupIds($request);

        // Verify swimmer is in coach's groups
        $swimmer = SwimmerProfile::findOrFail($id);
        $swimmerGroupIds = $swimmer->groups->pluck('id');
        if ($swimmerGroupIds->intersect($groupIds)->isEmpty()) {
            abort(403, 'Swimmer not in your groups');
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Find the latest completed session for this swimmer's group
        $latestSession = TrainingSession::whereIn('group_id', $groupIds->intersect($swimmerGroupIds))
            ->where('status', 'Completed')
            ->orderBy('date', 'desc')
            ->first();

        if (! $latestSession) {
            return response()->json(['message' => 'No completed session found to attach evaluation to'], 422);
        }

        $evaluation = DailyEvaluation::updateOrCreate(
            ['session_id' => $latestSession->id, 'swimmer_id' => $id],
            [
                'club_id' => $user->club_id,
                'rating' => $request->rating,
                'notes' => $request->notes,
            ]
        );

        return response()->json([
            'message' => 'Evaluation saved',
            'evaluation' => $evaluation->load(['session.group']),
        ]);
    }

    // ─── LEGACY DAILY TRAINING (backward compat) ──────────────────

    public function dailyTraining(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => ['required', Rule::exists('training_sessions', 'id')->where('club_id', app('current_club_id'))],
            'attendance' => 'required|array',
            'attendance.*.swimmer_id' => ['required', Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
            'attendance.*.present' => 'required|boolean',
            'evaluations' => 'nullable|array',
            'evaluations.*.swimmer_id' => ['required', Rule::exists('swimmer_profiles', 'id')->where('club_id', app('current_club_id'))],
            'evaluations.*.rating' => 'required|integer|min:1|max:5',
            'evaluations.*.notes' => 'nullable|string',
            'group_evaluation' => 'nullable|array',
            'group_evaluation.group_id' => ['required_with:group_evaluation', Rule::exists('groups', 'id')->where('club_id', app('current_club_id'))],
            'group_evaluation.rating' => 'required_with:group_evaluation|integer|min:1|max:5',
            'group_evaluation.notes' => 'nullable|string',
        ]);

        $session = TrainingSession::findOrFail($request->session_id);
        $clubId = $request->user()->club_id;

        // Verify coach owns this session via their groups
        $coachGroupIds = $this->coachGroupIds($request);
        abort_if(! $coachGroupIds->contains($session->group_id), 403, 'You do not own this session.');

        foreach ($request->attendance as $att) {
            Attendance::updateOrCreate(
                ['session_id' => $session->id, 'swimmer_id' => $att['swimmer_id']],
                ['club_id' => $clubId, 'present' => $att['present']]
            );
        }

        if ($request->has('evaluations')) {
            foreach ($request->evaluations as $eval) {
                DailyEvaluation::updateOrCreate(
                    ['session_id' => $session->id, 'swimmer_id' => $eval['swimmer_id']],
                    ['club_id' => $clubId, 'rating' => $eval['rating'], 'notes' => $eval['notes'] ?? null]
                );
            }
        }

        if ($request->has('group_evaluation') && $request->group_evaluation) {
            GroupEvaluation::updateOrCreate(
                ['session_id' => $session->id, 'group_id' => $request->group_evaluation['group_id']],
                ['club_id' => $clubId, 'rating' => $request->group_evaluation['rating'], 'notes' => $request->group_evaluation['notes'] ?? null]
            );
        }

        return response()->json([
            'message' => 'Daily training submitted',
            'session' => $session->load(['attendances.swimmer', 'evaluations.swimmer', 'groupEvaluation']),
        ]);
    }
}
