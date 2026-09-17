<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Events\SwimmerAwarded;
use App\Http\Controllers\Controller;
use App\Jobs\RecalculateSwimmerXp;
use App\Models\Group;
use App\Models\LeaderboardSetting;
use App\Models\SwimmerAward;
use App\Models\SwimmerAwardView;
use App\Models\SwimmerProfile;
use App\Services\XpCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Man of the Day / Week / Month.
 *
 * Giving: a manager may award any swimmer in the club; a coach only swimmers in
 * groups they coach. Receiving: every swimmer in the club sees each award once
 * (celebration queue) and can browse the permanent hall-of-fame feed.
 */
class SwimmerAwardController extends Controller
{
    public function __construct(private XpCalculationService $xpService) {}

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $clubId = $user->club_id;

        $validated = $request->validate([
            'swimmer_id' => [
                'required', 'integer',
                Rule::exists('swimmer_profiles', 'id')->where('club_id', $clubId)->whereNull('deleted_at'),
            ],
            'award_type' => ['required', Rule::in(SwimmerAward::TYPES)],
        ]);

        $swimmer = SwimmerProfile::where('club_id', $clubId)->findOrFail($validated['swimmer_id']);

        if ($user->role === UserRole::COACH) {
            $inOwnGroup = Group::where('coach_user_id', $user->id)
                ->whereHas('swimmers', fn ($q) => $q->where('swimmer_profiles.id', $swimmer->id))
                ->exists();

            if (! $inOwnGroup) {
                throw ValidationException::withMessages([
                    'swimmer_id' => 'You can only award swimmers in your own groups.',
                ]);
            }
        }

        $settings = LeaderboardSetting::forClub($clubId);

        $award = SwimmerAward::create([
            'club_id' => $clubId,
            'swimmer_id' => $swimmer->id,
            'award_type' => $validated['award_type'],
            'xp_value' => $settings->getAwardXpFor($validated['award_type']),
            'awarded_by' => $user->id,
        ]);

        $this->xpService->invalidateCache($swimmer->id, $clubId);
        RecalculateSwimmerXp::dispatch($swimmer->id, $clubId);

        try {
            broadcast(new SwimmerAwarded($award));
        } catch (\Throwable $e) {
            Log::warning('SwimmerAwarded broadcast failed: '.$e->getMessage());
        }

        $award->load('swimmer:id,first_name,last_name', 'awardedBy:id,name');

        return response()->json([
            'message' => 'Award given',
            'award' => $this->present($award),
        ], 201);
    }

    /**
     * Club-wide hall of fame: every award ever given, newest first.
     */
    public function recent(Request $request): JsonResponse
    {
        $awards = SwimmerAward::where('club_id', $request->user()->club_id)
            ->with('swimmer:id,first_name,last_name,user_id', 'swimmer.user:id,avatar')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(30)
            ->get()
            ->map(fn (SwimmerAward $award) => $this->present($award));

        return response()->json(['data' => $awards]);
    }

    /**
     * Awards this viewer has not dismissed yet, oldest first. Capped so a
     * long-absent member is not flooded on their first open.
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();
        $mySwimmerId = $user->swimmerProfile?->id;

        $unseen = SwimmerAward::where('club_id', $user->club_id)
            ->whereDoesntHave('views', fn ($q) => $q->where('viewer_user_id', $user->id))
            ->with('swimmer:id,first_name,last_name,user_id', 'swimmer.user:id,avatar')
            ->orderBy('created_at')
            ->orderBy('id')
            ->limit(10)
            ->get()
            ->map(fn (SwimmerAward $award) => $this->present($award) + [
                'is_mine' => $mySwimmerId !== null && $award->swimmer_id === $mySwimmerId,
            ]);

        return response()->json(['data' => $unseen]);
    }

    public function markSeen(Request $request, int $award): JsonResponse
    {
        $user = $request->user();

        // Scoped lookup: an id from another club is a 404, never a silent row.
        $model = SwimmerAward::where('club_id', $user->club_id)->findOrFail($award);

        SwimmerAwardView::firstOrCreate(
            ['award_id' => $model->id, 'viewer_user_id' => $user->id],
            ['viewed_at' => now()]
        );

        return response()->json(['status' => 'ok']);
    }

    private function present(SwimmerAward $award): array
    {
        $swimmer = $award->swimmer;

        return [
            'award_id' => $award->id,
            'swimmer_id' => $award->swimmer_id,
            'swimmer_name' => trim(($swimmer?->first_name ?? '').' '.($swimmer?->last_name ?? '')),
            'swimmer_avatar_url' => $swimmer?->user?->avatar,
            'award_type' => $award->award_type,
            'xp_value' => $award->xp_value,
            'awarded_by' => $award->relationLoaded('awardedBy') ? $award->awardedBy?->name : null,
            'awarded_at' => $award->created_at?->toIso8601String(),
        ];
    }
}
