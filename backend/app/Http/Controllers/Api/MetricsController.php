<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Notification;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MetricsController extends Controller
{
    /**
     * GET /api/v1/metrics
     *
     * Protected by X-Metrics-Key header matching METRICS_SECRET_KEY env var.
     * Returns system and business metrics for monitoring dashboards.
     */
    public function index(Request $request): JsonResponse
    {
        // Authenticate via secret key header
        $expectedKey = config('app.metrics_secret_key');

        if (! $expectedKey || $request->header('X-Metrics-Key') !== $expectedKey) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Database metrics
        $totalClubs = Club::count();
        $totalUsers = User::count();
        $totalSessions = TrainingSession::count();

        $totalNotifications = 0;
        try {
            $totalNotifications = Notification::count();
        } catch (\Throwable $e) {
            // Notification table may not exist in some test environments
        }

        // Queue metrics
        $pendingJobs = 0;
        $failedJobs24h = 0;
        try {
            $pendingJobs = DB::table('jobs')->count();
            $failedJobs24h = DB::table('failed_jobs')
                ->where('failed_at', '>=', now()->subDay())
                ->count();
        } catch (\Throwable $e) {
            // Jobs tables may not exist
        }

        return response()->json([
            'timestamp' => now()->toIso8601String(),
            'app' => [
                'version' => config('app_versions.api_version', 'v1'),
                'environment' => app()->environment(),
            ],
            'database' => [
                'total_clubs' => $totalClubs,
                'total_users' => $totalUsers,
                'total_sessions' => $totalSessions,
                'total_notifications' => $totalNotifications,
                'pending_jobs' => $pendingJobs,
                'failed_jobs_24h' => $failedJobs24h,
            ],
            'queues' => [
                'pending' => $pendingJobs,
                'failed_24h' => $failedJobs24h,
            ],
            'performance' => [
                'slow_queries_last_hour' => (int) $this->getSlowQueryCount(),
            ],
        ]);
    }

    private function getSlowQueryCount(): int
    {
        try {
            return (int) Cache::store('redis')->get('slow_queries:' . now()->format('Y-m-d-H'), 0);
        } catch (\Throwable) {
            return 0;
        }
    }
}
