<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Registration;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateBusinessReport extends Command
{
    protected $signature = 'report:business';

    protected $description = 'Generate weekly business metrics report and log to business_report.log';

    public function handle(): int
    {
        $weekStart = now()->startOfWeek();
        $weekEnd = now()->endOfWeek();

        $this->info('Generating business report for week of ' . $weekStart->toDateString());

        $metrics = [];

        // New registrations this week
        $metrics['new_registrations'] = Registration::whereBetween('created_at', [$weekStart, $weekEnd])->count();

        // Approved registrations this week
        $metrics['approved_registrations'] = Registration::where('status', 'approved')
            ->whereBetween('updated_at', [$weekStart, $weekEnd])
            ->count();

        // Total active swimmers
        $metrics['total_active_swimmers'] = SwimmerProfile::count();

        // Sessions completed this week
        $metrics['sessions_completed'] = TrainingSession::where('status', 'Completed')
            ->whereBetween('updated_at', [$weekStart, $weekEnd])
            ->count();

        // Average attendance rate this week
        $attendanceStats = DB::table('attendance')
            ->join('training_sessions', 'attendance.session_id', '=', 'training_sessions.id')
            ->where('training_sessions.status', 'Completed')
            ->whereBetween('training_sessions.date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->selectRaw('COUNT(*) as total, SUM(CASE WHEN attendance.present = 1 THEN 1 ELSE 0 END) as present')
            ->first();

        $metrics['average_attendance_rate'] = $attendanceStats && $attendanceStats->total > 0
            ? round(($attendanceStats->present / $attendanceStats->total) * 100, 1) . '%'
            : 'N/A';

        // Push notifications sent this week
        try {
            $metrics['notifications_sent'] = Notification::whereBetween('created_at', [$weekStart, $weekEnd])->count();
        } catch (\Throwable $e) {
            $metrics['notifications_sent'] = 0;
        }

        // Failed jobs this week
        try {
            $metrics['failed_jobs'] = DB::table('failed_jobs')
                ->where('failed_at', '>=', $weekStart)
                ->count();
        } catch (\Throwable $e) {
            $metrics['failed_jobs'] = 0;
        }

        // Log the report
        Log::build([
            'driver' => 'single',
            'path' => storage_path('logs/business_report.log'),
        ])->info('WEEKLY_BUSINESS_REPORT', [
            'week_of' => $weekStart->toDateString(),
            'generated_at' => now()->toIso8601String(),
            'metrics' => $metrics,
        ]);

        // Also output to console
        $this->table(
            ['Metric', 'Value'],
            collect($metrics)->map(fn ($v, $k) => [str_replace('_', ' ', ucfirst($k)), $v])->values()->toArray()
        );

        $this->info('Report logged to storage/logs/business_report.log');

        return self::SUCCESS;
    }
}
