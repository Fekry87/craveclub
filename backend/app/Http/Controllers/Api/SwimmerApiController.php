<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesSessionTabs;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\DailyEvaluation;
use App\Models\GroupEvaluation;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\Measurement;
use App\Models\Registration;
use App\Models\SwimmerAward;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SwimmerApiController extends Controller
{
    use ScopesSessionTabs;

    /**
     * Coach-only fields on a training session.
     *
     * `summary_notes` is written by the coach after a session, with a prompt that
     * invites per-swimmer feedback ("swimmer feedback, highlights..."), and nothing
     * tells the coach the group can read it. Every swimmer-facing response strips
     * it — including the ones that only carry a session as a nested relation.
     *
     * `cancelled_by_user_id` is internal bookkeeping; swimmers get the reason.
     */
    private const COACH_ONLY_SESSION_FIELDS = ['summary_notes', 'cancelled_by_user_id'];

    private function getSwimmerProfile(Request $request): ?SwimmerProfile
    {
        return SwimmerProfile::where('user_id', $request->user()->id)->first();
    }

    public function dashboard(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (! $profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $groupIds = $profile->groups()->pluck('groups.id');

        $upcomingSessions = TrainingSession::whereIn('group_id', $groupIds)
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')->orderBy('start_time')
            ->take(5)
            ->with(['group', 'plan'])
            ->get()
            ->makeHidden(self::COACH_ONLY_SESSION_FIELDS);

        $totalAttendance = Attendance::where('swimmer_id', $profile->id)->count();
        $presentCount = Attendance::where('swimmer_id', $profile->id)->where('present', true)->count();
        $attendanceRate = $totalAttendance > 0 ? round(($presentCount / $totalAttendance) * 100, 1) : 0;

        $recentEvaluations = DailyEvaluation::where('swimmer_id', $profile->id)
            ->with('session.group')
            ->latest()
            ->take(5)
            ->get()
            ->each(fn ($eval) => $eval->session?->makeHidden(self::COACH_ONLY_SESSION_FIELDS));

        $avgRating = DailyEvaluation::where('swimmer_id', $profile->id)->avg('rating');
        $bestRating = DailyEvaluation::where('swimmer_id', $profile->id)->max('rating');

        // Group by the SESSION's date, not the evaluation's created_at, so a rating
        // for a March session lands in March even if entered later.
        $monthlyRatings = DailyEvaluation::where('swimmer_id', $profile->id)
            ->with('session:id,date')
            ->get()
            ->sortByDesc(fn ($eval) => $eval->session?->date ?? $eval->created_at)
            ->groupBy(fn ($eval) => \Carbon\Carbon::parse($eval->session?->date ?? $eval->created_at)->format('Y-m'))
            ->take(6)
            ->map(fn ($group, $month) => [
                'month' => $month,
                'avg_rating' => round($group->avg('rating'), 2),
                'count' => $group->count(),
            ])
            ->values();

        return response()->json([
            'profile' => $profile,
            'upcoming_sessions' => $upcomingSessions,
            'attendance_rate' => $attendanceRate,
            'total_sessions' => $totalAttendance,
            'sessions_attended' => $presentCount,
            'recent_evaluations' => $recentEvaluations,
            'average_rating' => $avgRating ? round($avgRating, 1) : null,
            'best_rating' => $bestRating,
            'monthly_ratings' => $monthlyRatings,
        ]);
    }

    /**
     * Rich swimmer profile: coach, group(s), branch, subscription, signup
     * preferences, XP/level/rank and headline stats — everything the
     * mobile Profile tab shows.
     */
    public function profile(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (! $profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $clubId = $profile->club_id;
        $profile->load(['branch', 'groups.coach.coachProfile']);

        $registration = $this->findRegistrationForSwimmer($request->user(), $clubId, $profile);

        // Coach: the swimmer's group coach, falling back to the coach chosen at signup
        $coachUser = $profile->groups->first(fn ($g) => $g->coach !== null)?->coach
            ?? $registration?->coach?->user;

        $groups = $profile->groups->map(fn ($g) => [
            'id' => $g->id,
            'name' => $g->name,
            'coach_name' => $g->coach?->name,
        ])->values();

        // Subscription — derived the same way as notifications:subscription-reminders
        $subscription = null;
        if ($registration && $registration->plan && $registration->plan->duration_months) {
            $start = $registration->subscription_started_at
                ? $registration->subscription_started_at->copy()->startOfDay()
                : $registration->updated_at->copy()->startOfDay();
            $end = $registration->subscription_ends_at
                ? $registration->subscription_ends_at->copy()->startOfDay()
                : $start->copy()->addMonths($registration->plan->duration_months);
            $today = now()->startOfDay();
            $daysLeft = (int) $today->diffInDays($end, false);
            $totalDays = max(1, $start->diffInDays($end));
            $elapsed = min($totalDays, max(0, $start->diffInDays($today)));

            $subscription = [
                'plan_name' => $registration->plan->name,
                'training_type' => $registration->plan->training_type,
                'duration_months' => $registration->plan->duration_months,
                // `price` is the plan's list price; `amount_paid` is what this member was
                // actually billed, taken from their own registration rather than
                // recomputed, so a later change to the plan cannot rewrite their history.
                'price' => (float) $registration->plan->price,
                'discount_percent' => (int) ($registration->plan->discount_percent ?? 0),
                'final_price' => $registration->plan->final_price,
                'amount_paid' => (float) $registration->total_amount,
                'started_at' => $start->toDateString(),
                'ends_at' => $end->toDateString(),
                'days_left' => $daysLeft,
                'progress' => round(($elapsed / $totalDays) * 100, 1),
                'status' => $daysLeft < 0 ? 'expired' : ($daysLeft <= 14 ? 'expiring' : 'active'),
            ];
        }

        $signup = $registration ? [
            'primary_goal' => $registration->primary_goal,
            'weekly_frequency' => $registration->weekly_frequency,
            'preferred_time' => $registration->preferred_time,
            'experience_level' => $registration->experience_level,
            'fitness_level' => $registration->fitness_level,
            'gender' => $registration->gender,
            'height_cm' => $registration->height_cm,
            'weight_kg' => $registration->weight_kg,
            'registered_at' => $registration->created_at?->toDateString(),
        ] : null;

        // XP / level / rank (rank from the job-maintained xp_points column)
        $settings = $this->getClubSettings($clubId);
        $levels = $this->getClubLevels($clubId);
        $xp = $this->computeSwimmerXp($profile->id, $clubId, $settings);
        $level = $this->getLevelInfo($xp['total_xp'], $levels);
        $rank = SwimmerProfile::where('club_id', $clubId)
            ->where('xp_points', '>', $xp['total_xp'])
            ->count() + 1;
        $totalSwimmers = SwimmerProfile::where('club_id', $clubId)->count();

        // Headline stats
        $totalAttendance = Attendance::where('swimmer_id', $profile->id)->count();
        $presentCount = Attendance::where('swimmer_id', $profile->id)->where('present', true)->count();
        $avgRating = DailyEvaluation::where('swimmer_id', $profile->id)->avg('rating');

        return response()->json([
            'profile' => $profile->makeHidden(['branch', 'groups']),
            'member_since' => $profile->created_at?->toDateString(),
            'branch' => $profile->branch ? [
                'id' => $profile->branch->id,
                'name' => $profile->branch->name,
                'address' => $profile->branch->address,
                'city' => $profile->branch->city,
                'phone' => $profile->branch->phone,
                'working_hours' => $profile->branch->working_hours,
            ] : null,
            'coach' => $coachUser ? $this->formatCoach($coachUser) : null,
            'groups' => $groups,
            'subscription' => $subscription,
            'signup' => $signup,
            'xp' => [
                'total_xp' => $xp['total_xp'],
                'rank' => $rank,
                'total_swimmers' => $totalSwimmers,
                'current_streak' => $this->currentAttendanceStreak($profile->id, $clubId),
                'level' => $level,
            ],
            'stats' => [
                'attendance_rate' => $totalAttendance > 0 ? round(($presentCount / $totalAttendance) * 100, 1) : 0,
                'sessions_attended' => $presentCount,
                'total_sessions' => $totalAttendance,
                'average_rating' => $avgRating ? round($avgRating, 1) : null,
                'evaluation_count' => $xp['evaluation_count'],
            ],
        ]);
    }

    private function formatCoach(User $coachUser): array
    {
        $cp = $coachUser->coachProfile;

        return [
            'id' => $coachUser->id,
            'name' => $coachUser->name,
            'phone' => $cp?->phone,
            'specialization' => $cp?->specialization,
            'experience_years' => $cp?->experience_years,
            'rating' => $cp?->rating !== null ? (float) $cp->rating : null,
        ];
    }

    /**
     * Approved registrations aren't linked to swimmer_profiles by id. Approval
     * creates the swimmer login with a deterministic phone-derived email, so
     * match on that first; fall back to full name + birth date.
     */
    private function findRegistrationForSwimmer(User $user, int $clubId, SwimmerProfile $profile): ?Registration
    {
        $base = Registration::where('club_id', $clubId)
            ->whereIn('status', ['approved', 'active'])
            ->with(['plan', 'coach.user.coachProfile'])
            ->latest('updated_at');

        if (preg_match('/^swimmer_(\d+)(?:_\d+)?@club\d+\.craveclubs\.local$/', $user->email, $m)) {
            $digits = $m[1];
            $match = (clone $base)->get()
                ->first(fn ($r) => preg_replace('/[^0-9]/', '', (string) $r->phone) === $digits);
            if ($match) {
                return $match;
            }
        }

        return (clone $base)
            ->where('full_name', $profile->full_name)
            ->when($profile->date_of_birth, fn ($q) => $q->whereDate('birth_date', $profile->date_of_birth->toDateString()))
            ->first();
    }

    /** Consecutive most-recent sessions attended (0 if the latest was missed). */
    private function currentAttendanceStreak(int $swimmerId, int $clubId): int
    {
        $records = Attendance::where('swimmer_id', $swimmerId)
            ->whereHas('session', fn ($q) => $q->where('club_id', $clubId))
            ->join('training_sessions', 'attendance.session_id', '=', 'training_sessions.id')
            ->orderBy('training_sessions.date', 'desc')
            ->select('attendance.present')
            ->get();

        $streak = 0;
        foreach ($records as $r) {
            if (! $r->present) {
                break;
            }
            $streak++;
        }

        return $streak;
    }

    /**
     * The swimmer's sessions, one tab at a time.
     *
     * `scope` does the splitting the app used to do itself over whatever pages it
     * had loaded. That broke as soon as a club generated sessions weeks ahead:
     * sorted newest first, the first page was all far-future sessions, so the
     * Completed tab read 0 until the swimmer happened to scroll, and any refresh
     * (which reloads page one) emptied it again.
     *
     * - upcoming:  today onwards (Scheduled, Live, Cancelled) plus anything Live;
     *              soonest first
     * - completed: Completed, and Cancelled sessions whose day has passed; most
     *              recent first
     * - today:     every session on the swimmer's today, by start time (Home)
     * - all:       upcoming soonest first, then the past most recent first
     * - (none):    newest first, as before, for app builds that don't send a scope
     *
     * `today` is the device's local date: the server runs on UTC, which is still
     * "yesterday" for the first hours of an Egyptian morning. It is only trusted
     * within a day of the server's date.
     *
     * Every response carries `counts` for all three tabs, so the badges are right
     * before any tab has been opened.
     */
    public function sessions(Request $request): JsonResponse
    {
        $request->validate([
            'scope' => 'nullable|in:all,upcoming,completed,today',
            'today' => 'nullable|date_format:Y-m-d',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $profile = $this->getSwimmerProfile($request);
        if (! $profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $groupIds = $profile->groups()->pluck('groups.id');
        $today = $this->deviceToday($request);
        $scope = $request->input('scope');

        $base = TrainingSession::whereIn('group_id', $groupIds);

        $query = (clone $base)->with(['group', 'plan', 'attendances' => function ($q) use ($profile) {
            $q->where('swimmer_id', $profile->id);
        }]);

        if ($scope === 'today') {
            $query->whereDate('date', $today)->orderBy('start_time');
        } elseif (! $this->applySessionTab($query, $scope, $today)) {
            $query->orderBy('date', 'desc');
        }

        $sessions = $query->paginate((int) $request->input('per_page', 15));

        // Attendance XP is a per-club setting. The session card used to print a
        // hardcoded "+25 XP", so a club set to 5 showed 25 on the card and 5 on
        // the detail page for the same session. Send the real figure with each
        // row so the card needs no second request.
        $xpPerAttendance = (int) LeaderboardSetting::forClub($profile->club_id)->attendance_xp;

        $sessions->getCollection()
            ->makeHidden(self::COACH_ONLY_SESSION_FIELDS)
            ->each->setAttribute('xp_per_attendance', $xpPerAttendance);

        $payload = $sessions->toArray();
        $payload['today'] = $today;
        $payload['counts'] = $this->sessionTabCounts($base, $today);

        return response()->json($payload);
    }

    /**
     * One session, with everything a swimmer needs on its detail page.
     *
     * Only sessions of the swimmer's own groups resolve. Anything else is a 404,
     * not a 403, so the endpoint never confirms that another group's session id
     * exists.
     *
     * Built field by field, so no COACH_ONLY_SESSION_FIELDS can slip in. The
     * club-set `notes` are the ones meant for the group.
     */
    public function sessionShow(Request $request, int $session): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (! $profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $groupIds = $profile->groups()->pluck('groups.id');

        $model = TrainingSession::whereIn('group_id', $groupIds)
            ->with(['group', 'plan', 'branch', 'coach.coachProfile', 'group.coach.coachProfile'])
            ->find($session);

        if (! $model) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $attendance = Attendance::where('session_id', $model->id)
            ->where('swimmer_id', $profile->id)
            ->first();

        $evaluation = DailyEvaluation::where('session_id', $model->id)
            ->where('swimmer_id', $profile->id)
            ->first();

        $groupEvaluation = GroupEvaluation::where('session_id', $model->id)
            ->where('group_id', $model->group_id)
            ->first();

        // القياس: the times the coach recorded for this swimmer in this session.
        $measurements = Measurement::where('session_id', $model->id)
            ->where('swimmer_id', $profile->id)
            ->with(['strokeSkill:id,name', 'distanceSkill:id,name,numeric_value'])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        // The session's own coach, or the group's coach when none was set on it.
        $coachUser = $model->coach ?? $model->group?->coach;

        $perAttendance = (int) LeaderboardSetting::forClub($model->club_id)->attendance_xp;

        $start = $model->start_time ? \Carbon\Carbon::parse($model->start_time) : null;
        $end = $model->end_time ? \Carbon\Carbon::parse($model->end_time) : null;

        return response()->json([
            'id' => $model->id,
            'title' => $model->title,
            'type' => $model->type,
            'status' => $model->status,
            'date' => $model->date?->toDateString(),
            'start_time' => $model->start_time,
            'end_time' => $model->end_time,
            'duration_minutes' => $start && $end ? (int) $start->diffInMinutes($end) : null,
            'location' => $model->location,
            'started_at' => $model->started_at,
            'completed_at' => $model->completed_at,
            'cancellation_reason' => $model->status === 'Cancelled' ? $model->cancellation_reason : null,
            'cancelled_at' => $model->cancelled_at,
            'notes' => $model->notes,
            'group' => $model->group ? ['id' => $model->group->id, 'name' => $model->group->name] : null,
            'plan' => $model->plan ? ['id' => $model->plan->id, 'title' => $model->plan->title] : null,
            'branch' => $model->branch ? [
                'id' => $model->branch->id,
                'name' => $model->branch->name,
                'address' => $model->branch->address,
                'city' => $model->branch->city,
                'phone' => $model->branch->phone,
            ] : null,
            'coach' => $coachUser ? $this->formatCoach($coachUser) : null,
            'my_attendance' => $attendance ? ['present' => (bool) $attendance->present] : null,
            'my_evaluation' => $evaluation ? [
                'rating' => (int) $evaluation->rating,
                'notes' => $evaluation->notes,
                'created_at' => $evaluation->created_at,
            ] : null,
            'group_evaluation' => $groupEvaluation ? [
                'rating' => (int) $groupEvaluation->rating,
                'notes' => $groupEvaluation->notes,
            ] : null,
            'my_measurements' => $measurements
                ->map(fn (Measurement $m) => MeasurementController::swimmerRow($m))
                ->values(),
            'xp' => [
                'per_attendance' => $perAttendance,
                // Only settled once the session is over and attendance is taken.
                'earned' => $attendance ? ($attendance->present ? $perAttendance : 0) : null,
            ],
        ]);
    }

    public function evaluations(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (! $profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $evaluations = DailyEvaluation::where('swimmer_id', $profile->id)
            ->with('session.group')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        $evaluations->getCollection()
            ->each(fn ($eval) => $eval->session?->makeHidden(self::COACH_ONLY_SESSION_FIELDS));

        return response()->json($evaluations);
    }

    // ── XP & Level helpers (DB-driven) ──

    private function getClubSettings(int $clubId): LeaderboardSetting
    {
        return LeaderboardSetting::forClub($clubId);
    }

    private function getClubLevels(int $clubId): array
    {
        return LevelTier::forClub($clubId)->map(fn ($t, $i) => [
            'level' => $i + 1,
            'name' => $t->name,
            'xp' => $t->xp_threshold,
            'color' => $t->color,
            'icon' => $t->icon,
        ])->values()->toArray();
    }

    private function getLevelInfo(int $totalXp, ?array $levels = null): array
    {
        if (! $levels) {
            $levels = LevelTier::defaults();
            $levels = array_map(fn ($t, $i) => ['level' => $i + 1, 'name' => $t['name'], 'xp' => $t['xp_threshold'], 'color' => $t['color']], $levels, array_keys($levels));
        }

        $current = $levels[0];
        $next = $levels[1] ?? null;

        for ($i = count($levels) - 1; $i >= 0; $i--) {
            if ($totalXp >= $levels[$i]['xp']) {
                $current = $levels[$i];
                $next = $levels[$i + 1] ?? null;
                break;
            }
        }

        $progress = 0;
        $xpToNext = null;
        if ($next) {
            $xpToNext = $next['xp'] - $totalXp;
            $xpInLevel = $totalXp - $current['xp'];
            $levelRange = $next['xp'] - $current['xp'];
            $progress = $levelRange > 0 ? round(($xpInLevel / $levelRange) * 100, 1) : 100;
        } else {
            $progress = 100;
        }

        return [
            'level' => $current['level'],
            'name' => $current['name'],
            'color' => $current['color'],
            'xp_to_next' => $xpToNext,
            'next_level_name' => $next['name'] ?? null,
            'next_level_xp' => $next['xp'] ?? null,
            'progress' => $progress,
        ];
    }

    private function computeSwimmerXp(int $swimmerId, int $clubId, ?LeaderboardSetting $settings = null): array
    {
        $settings = $settings ?? $this->getClubSettings($clubId);
        $ratingXpMap = $settings->getRatingXpMap();

        // Rating XP
        $evaluations = DailyEvaluation::where('swimmer_id', $swimmerId)
            ->where('club_id', $clubId)
            ->pluck('rating');

        $ratingXp = 0;
        foreach ($evaluations as $rating) {
            $ratingXp += $ratingXpMap[$rating] ?? 0;
        }

        // Attendance XP
        $attendedCount = Attendance::where('swimmer_id', $swimmerId)
            ->whereHas('session', fn ($q) => $q->where('club_id', $clubId))
            ->where('present', true)
            ->count();

        $attendanceXp = $attendedCount * $settings->attendance_xp;

        // Streak XP
        $attendanceRecords = Attendance::where('swimmer_id', $swimmerId)
            ->whereHas('session', fn ($q) => $q->where('club_id', $clubId))
            ->join('training_sessions', 'attendance.session_id', '=', 'training_sessions.id')
            ->orderBy('training_sessions.date', 'asc')
            ->select('attendance.present')
            ->get();

        $streakXp = 0;
        $streak = 0;
        foreach ($attendanceRecords as $record) {
            if ($record->present) {
                $streak++;
                if ($streak >= $settings->streak_threshold) {
                    $streakXp += $settings->streak_bonus_xp;
                }
            } else {
                $streak = 0;
            }
        }

        // Award XP (Man of the Day / Week / Month)
        $awardXp = (int) SwimmerAward::where('swimmer_id', $swimmerId)
            ->where('club_id', $clubId)
            ->sum('xp_value');

        $totalXp = $ratingXp + $attendanceXp + $streakXp + $awardXp;

        return [
            'total_xp' => $totalXp,
            'rating_xp' => $ratingXp,
            'attendance_xp' => $attendanceXp,
            'streak_xp' => $streakXp,
            'award_xp' => $awardXp,
            'evaluation_count' => count($evaluations),
            'attended_count' => $attendedCount,
        ];
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (! $profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $clubId = $profile->club_id;
        $settings = $this->getClubSettings($clubId);
        $levels = $this->getClubLevels($clubId);

        // Get all swimmers in this club
        $allSwimmers = SwimmerProfile::where('club_id', $clubId)->get();

        // Compute XP for each swimmer
        $rankings = [];
        foreach ($allSwimmers as $swimmer) {
            $xpData = $this->computeSwimmerXp($swimmer->id, $clubId, $settings);
            $levelInfo = $this->getLevelInfo($xpData['total_xp'], $levels);

            $rankings[] = [
                'swimmer_id' => $swimmer->id,
                'first_name' => $swimmer->first_name,
                'last_initial' => mb_substr($swimmer->last_name ?? '', 0, 1).'.',
                'full_name' => $swimmer->first_name.' '.$swimmer->last_name,
                'avatar_url' => $swimmer->avatar_url,
                'total_xp' => $xpData['total_xp'],
                'level' => $levelInfo['level'],
                'level_name' => $levelInfo['name'],
                'level_color' => $levelInfo['color'],
                'is_current_user' => $swimmer->id === $profile->id,
            ];
        }

        // Sort by XP descending, then by name for ties
        usort($rankings, function ($a, $b) {
            if ($b['total_xp'] !== $a['total_xp']) {
                return $b['total_xp'] - $a['total_xp'];
            }

            return strcmp($a['first_name'], $b['first_name']);
        });

        // Assign ranks
        foreach ($rankings as $i => &$r) {
            $r['rank'] = $i + 1;
        }
        unset($r);

        // Top 5
        $top5 = array_slice($rankings, 0, 5);

        // Apply privacy: remove full_name for non-current users
        $allRankings = array_map(function ($entry) {
            if (! $entry['is_current_user']) {
                unset($entry['full_name']);
            }

            return $entry;
        }, $rankings);

        foreach ($top5 as &$entry) {
            if (! $entry['is_current_user']) {
                unset($entry['full_name']);
            }
        }
        unset($entry);

        // Paginate all_rankings manually
        $perPage = (int) $request->input('per_page', 20);
        $page = (int) $request->input('page', 1);
        $total = count($allRankings);
        $paginatedRankings = array_slice(array_values($allRankings), ($page - 1) * $perPage, $perPage);

        // Current swimmer data
        $myXpData = $this->computeSwimmerXp($profile->id, $clubId, $settings);
        $myLevelInfo = $this->getLevelInfo($myXpData['total_xp'], $levels);
        $myRank = null;
        foreach ($rankings as $r) {
            if ($r['swimmer_id'] === $profile->id) {
                $myRank = $r['rank'];
                break;
            }
        }

        return response()->json([
            'top5' => $top5,
            'all_rankings' => array_values($paginatedRankings),
            'my_rank' => $myRank,
            'my_xp' => $myXpData,
            'my_level' => $myLevelInfo,
            'total_swimmers' => $total,
            'current_page' => $page,
            'per_page' => $perPage,
            'last_page' => (int) ceil($total / $perPage),
            'levels' => $levels,
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $profile = $this->getSwimmerProfile($request);
        if (! $profile) {
            return response()->json(['message' => 'Swimmer profile not found'], 404);
        }

        $totalSessions = Attendance::where('swimmer_id', $profile->id)->count();
        $present = Attendance::where('swimmer_id', $profile->id)->where('present', true)->count();
        $avgRating = DailyEvaluation::where('swimmer_id', $profile->id)->avg('rating');
        $bestRating = DailyEvaluation::where('swimmer_id', $profile->id)->max('rating');

        // Group by the SESSION's date, not the evaluation's created_at, so a rating
        // for a March session lands in March even if entered later.
        $monthlyRatings = DailyEvaluation::where('swimmer_id', $profile->id)
            ->with('session:id,date')
            ->get()
            ->sortByDesc(fn ($eval) => $eval->session?->date ?? $eval->created_at)
            ->groupBy(fn ($eval) => \Carbon\Carbon::parse($eval->session?->date ?? $eval->created_at)->format('Y-m'))
            ->take(6)
            ->map(fn ($group, $month) => [
                'month' => $month,
                'avg_rating' => round($group->avg('rating'), 2),
                'count' => $group->count(),
            ])
            ->values();

        return response()->json([
            'total_sessions' => $totalSessions,
            'sessions_attended' => $present,
            'attendance_rate' => $totalSessions > 0 ? round(($present / $totalSessions) * 100, 1) : 0,
            'average_rating' => $avgRating ? round($avgRating, 1) : null,
            'best_rating' => $bestRating,
            'monthly_ratings' => $monthlyRatings,
        ]);
    }
}
