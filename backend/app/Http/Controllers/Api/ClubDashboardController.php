<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Services\XpCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ClubDashboardController extends Controller
{
    public function __construct(private XpCalculationService $xpService) {}

    /**
     * Return enabled features for the current club (sidebar rendering).
     */
    public function features(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;

        $features = Cache::remember("club_features_{$clubId}", 3600, fn() => ClubFeature::forClub($clubId));

        return response()->json($features);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $clubId = $request->user()->club_id;

        $metrics = Cache::remember("dashboard_metrics_{$clubId}", 300, function () use ($clubId) {
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
        });

        return response()->json($metrics);
    }

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
}
