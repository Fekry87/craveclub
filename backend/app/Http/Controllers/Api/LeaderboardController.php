<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTierRequest;
use App\Http\Requests\UpdateLeaderboardSettingsRequest;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\SwimmerProfile;
use App\Services\AuditService;
use App\Services\XpCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
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
                'name' => $swimmer->first_name.' '.$swimmer->last_name,
                'total_xp' => $xpData['total_xp'],
                'level_name' => $level['name'],
                'level_color' => $level['color'],
            ];

            $levelName = $level['name'];
            $distribution[$levelName] = ($distribution[$levelName] ?? 0) + 1;
        }

        usort($topSwimmers, fn ($a, $b) => $b['total_xp'] - $a['total_xp']);
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
