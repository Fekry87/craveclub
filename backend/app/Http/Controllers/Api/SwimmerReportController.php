<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\SwimmerProfile;
use App\Services\SwimmerWeeklyReportService;
use Illuminate\Http\Request;

class SwimmerReportController extends Controller
{
    public function __construct(
        private SwimmerWeeklyReportService $reportService
    ) {}

    public function swimmerSelf(Request $request)
    {
        $week = $this->validateWeek($request);

        $swimmer = SwimmerProfile::withoutGlobalScopes()
            ->where('user_id', auth()->id())
            ->where('club_id', app('current_club_id'))
            ->firstOrFail();

        $report = $this->reportService->generate(
            $swimmer->id,
            app('current_club_id'),
            $week
        );

        // Swimmers don't see risk signals
        unset($report['risk_signal'], $report['risk_reason']);

        return response()->json($report);
    }

    public function coachSwimmer(Request $request, int $swimmerId)
    {
        $week = $this->validateWeek($request);

        $coachGroupIds = Group::withoutGlobalScopes()
            ->where('coach_user_id', auth()->id())
            ->where('club_id', app('current_club_id'))
            ->pluck('id');

        // Verify swimmer belongs to one of coach's groups
        SwimmerProfile::withoutGlobalScopes()
            ->where('id', $swimmerId)
            ->where('club_id', app('current_club_id'))
            ->whereHas('groups', function ($q) use ($coachGroupIds) {
                $q->whereIn('groups.id', $coachGroupIds);
            })
            ->firstOrFail();

        $report = $this->reportService->generate(
            $swimmerId,
            app('current_club_id'),
            $week
        );

        return response()->json($report);
    }

    public function managerSwimmer(Request $request, int $swimmerId)
    {
        $week = $this->validateWeek($request);

        SwimmerProfile::withoutGlobalScopes()
            ->where('id', $swimmerId)
            ->where('club_id', app('current_club_id'))
            ->firstOrFail();

        $report = $this->reportService->generate(
            $swimmerId,
            app('current_club_id'),
            $week
        );

        return response()->json($report);
    }

    private function validateWeek(Request $request): ?string
    {
        $week = $request->query('week');

        if ($week !== null) {
            if (! preg_match('/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/', $week)) {
                abort(422, 'Invalid week format. Use YYYY-WNN (e.g. 2025-W12).');
            }
        }

        return $week;
    }
}
