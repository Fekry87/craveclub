<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\DailyEvaluation;
use App\Models\TrainingPlanAssignment;
use App\Models\TrainingSession;
use Carbon\Carbon;

class SwimmerWeeklyReportService
{
    public function generate(int $swimmerId, int $clubId, ?string $week = null): array
    {
        [$weekLabel, $weekStart, $weekEnd] = $this->parseWeek($week);

        $sessions = $this->getScheduledSessions($swimmerId, $clubId, $weekStart, $weekEnd);

        $sessionIds = $sessions->pluck('id');

        $attendances = Attendance::whereIn('session_id', $sessionIds)
            ->where('swimmer_id', $swimmerId)
            ->get()
            ->keyBy('session_id');

        $evaluations = DailyEvaluation::whereIn('session_id', $sessionIds)
            ->where('swimmer_id', $swimmerId)
            ->get()
            ->keyBy('session_id');

        $sessionsScheduled = $sessions->count();
        $sessionsAttended = 0;
        $evalDetails = [];
        $ratingSum = 0;
        $ratingCount = 0;

        foreach ($sessions as $session) {
            $attendance = $attendances->get($session->id);
            $present = $attendance && $attendance->present;
            if ($present) {
                $sessionsAttended++;
            }

            $evaluation = $evaluations->get($session->id);
            $rating = $evaluation?->rating;
            $coachNotes = $evaluation?->notes;

            if ($rating !== null) {
                $ratingSum += $rating;
                $ratingCount++;
            }

            $evalDetails[] = [
                'session_id' => $session->id,
                'date' => $session->date->format('Y-m-d'),
                'session_title' => $session->title,
                'present' => $present,
                'rating' => $rating ? (int) $rating : null,
                'coach_notes' => $coachNotes,
            ];
        }

        $sessionsMissed = $sessionsScheduled - $sessionsAttended;
        $attendanceRate = $sessionsScheduled > 0
            ? round(($sessionsAttended / $sessionsScheduled) * 100, 1)
            : 0.0;
        $avgRating = $ratingCount > 0 ? round($ratingSum / $ratingCount, 1) : null;

        $currentPlanPhase = $this->getCurrentPlanPhase($swimmerId, $clubId);

        [$riskSignal, $riskReason] = $this->computeRisk(
            $sessionsScheduled, $sessionsAttended, $attendanceRate, $avgRating
        );

        return [
            'week' => $weekLabel,
            'week_start' => $weekStart->format('Y-m-d'),
            'week_end' => $weekEnd->format('Y-m-d'),
            'sessions_scheduled' => $sessionsScheduled,
            'sessions_attended' => $sessionsAttended,
            'sessions_missed' => $sessionsMissed,
            'attendance_rate' => $attendanceRate,
            'avg_rating' => $avgRating,
            'evaluations' => $evalDetails,
            'current_plan_phase' => $currentPlanPhase,
            'risk_signal' => $riskSignal,
            'risk_reason' => $riskReason,
        ];
    }

    private function parseWeek(?string $week): array
    {
        if ($week) {
            // Parse 'YYYY-WNN' format
            $parts = explode('-W', $week);
            $year = (int) $parts[0];
            $weekNum = (int) $parts[1];
            $weekStart = Carbon::now()->setISODate($year, $weekNum)->startOfWeek(Carbon::MONDAY);
        } else {
            $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        }

        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);
        $weekLabel = $week ?? $weekStart->format('o') . '-W' . str_pad($weekStart->isoWeek(), 2, '0', STR_PAD_LEFT);

        return [$weekLabel, $weekStart, $weekEnd];
    }

    private function getScheduledSessions(int $swimmerId, int $clubId, Carbon $weekStart, Carbon $weekEnd)
    {
        $sessions = TrainingSession::withoutGlobalScopes()
            ->where('club_id', $clubId)
            ->whereBetween('date', [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')])
            ->where('status', '!=', 'Cancelled')
            ->with(['group.swimmers', 'sessionSwimmers', 'sessionExclusions'])
            ->get();

        return $sessions->filter(function ($session) use ($swimmerId) {
            return $session->effectiveSwimmers->contains('id', $swimmerId);
        })->values();
    }

    private function getCurrentPlanPhase(int $swimmerId, int $clubId): ?array
    {
        $today = Carbon::today();

        // Direct swimmer assignment
        $assignment = TrainingPlanAssignment::withoutGlobalScopes()
            ->where('club_id', $clubId)
            ->where('swimmer_profile_id', $swimmerId)
            ->where('status', 'active')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->orderByDesc('created_at')
            ->with('trainingPlan')
            ->first();

        // If no direct assignment, check group assignments
        if (!$assignment) {
            $groupIds = \DB::table('group_memberships')
                ->where('swimmer_profile_id', $swimmerId)
                ->pluck('group_id');

            if ($groupIds->isNotEmpty()) {
                $assignment = TrainingPlanAssignment::withoutGlobalScopes()
                    ->where('club_id', $clubId)
                    ->whereIn('group_id', $groupIds)
                    ->whereNull('swimmer_profile_id')
                    ->where('status', 'active')
                    ->where('start_date', '<=', $today)
                    ->where('end_date', '>=', $today)
                    ->orderByDesc('created_at')
                    ->with('trainingPlan')
                    ->first();
            }
        }

        if (!$assignment || !$assignment->trainingPlan) {
            return null;
        }

        $plan = $assignment->trainingPlan;
        $phases = $plan->phases;

        if (empty($phases) || !is_array($phases)) {
            return null;
        }

        $currentWeekNumber = (int) floor($today->diffInDays($assignment->start_date) / 7) + 1;

        foreach ($phases as $index => $phase) {
            $phaseStart = $phase['week_start'] ?? null;
            $phaseEnd = $phase['week_end'] ?? null;

            if ($phaseStart !== null && $phaseEnd !== null
                && $currentWeekNumber >= $phaseStart && $currentWeekNumber <= $phaseEnd) {
                return [
                    'plan_name' => $plan->title,
                    'phase_number' => $index + 1,
                    'focus' => $phase['focus'] ?? '',
                    'week_start' => (int) $phaseStart,
                    'week_end' => (int) $phaseEnd,
                ];
            }
        }

        return null;
    }

    private function computeRisk(int $scheduled, int $attended, float $attendanceRate, ?float $avgRating): array
    {
        if ($scheduled >= 2 && $attended === 0) {
            return ['red', 'غاب عن جميع جلسات الأسبوع'];
        }

        if ($scheduled > 0 && $attendanceRate < 60.0) {
            return ['yellow', 'حضور أقل من 60% هذا الأسبوع'];
        }

        if ($avgRating !== null && $avgRating < 2.5) {
            return ['yellow', 'متوسط التقييم منخفض هذا الأسبوع'];
        }

        return ['green', null];
    }
}
