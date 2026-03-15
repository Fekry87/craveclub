<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use App\Services\ClubAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachPerformanceController extends Controller
{
    public function __construct(
        private ClubAnalyticsService $analyticsService,
    ) {}

    public function index(): JsonResponse
    {
        $clubId = app('current_club_id');

        $coaches = $this->analyticsService->getCoachPerformanceSummary($clubId);

        // Sort by avg_attendance DESC and add rank
        $sorted = collect($coaches)
            ->sortByDesc('avg_attendance')
            ->values()
            ->map(function ($coach, $index) {
                $coach['rank'] = $index + 1;
                return $coach;
            });

        return response()->json($sorted);
    }

    public function show(Request $request, int $coach): JsonResponse
    {
        $clubId = app('current_club_id');

        // Validate coach belongs to this club
        $coachProfile = CoachProfile::where('club_id', $clubId)
            ->where('user_id', $coach)
            ->first();

        if (!$coachProfile) {
            abort(404);
        }

        $detail = $this->analyticsService->getCoachDetail($clubId, $coach);

        return response()->json($detail);
    }

    public function comparison(Request $request): JsonResponse
    {
        $clubId = app('current_club_id');

        $ids = $request->input('ids', []);

        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'At least one coach ID is required.'], 422);
        }

        if (count($ids) > 5) {
            return response()->json(['message' => 'Maximum 5 coaches can be compared.'], 422);
        }

        // Validate all coaches belong to this club — get profile IDs
        $validProfiles = CoachProfile::where('club_id', $clubId)
            ->whereIn('user_id', $ids)
            ->pluck('id', 'user_id');

        $invalidIds = array_diff(array_map('intval', $ids), $validProfiles->keys()->toArray());
        if (!empty($invalidIds)) {
            abort(404);
        }

        $validProfileIds = $validProfiles->values()->toArray();

        // Get full performance summary and filter to requested coaches
        $allCoaches = $this->analyticsService->getCoachPerformanceSummary($clubId);

        $filtered = collect($allCoaches)
            ->filter(fn ($c) => in_array($c['coach_id'], $validProfileIds))
            ->values();

        return response()->json($filtered);
    }
}
