<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckQueueHealth extends Command
{
    protected $signature = 'queue:health-check';

    protected $description = 'Check queue health: pending jobs, failed jobs in last hour, alert if degraded';

    public function handle(): int
    {
        $pendingJobs = 0;
        $failedLastHour = 0;

        try {
            $pendingJobs = DB::table('jobs')->count();
        } catch (\Throwable $e) {
            $this->error("Could not query jobs table: {$e->getMessage()}");
        }

        try {
            $failedLastHour = DB::table('failed_jobs')
                ->where('failed_at', '>=', now()->subHour())
                ->count();
        } catch (\Throwable $e) {
            $this->error("Could not query failed_jobs table: {$e->getMessage()}");
        }

        $totalFailed = 0;
        try {
            $totalFailed = DB::table('failed_jobs')->count();
        } catch (\Throwable) {
            // Ignore — non-critical
        }

        // Alert if more than 5 failures in the last hour
        if ($failedLastHour > 5) {
            Log::channel('daily')->critical('QUEUE_HEALTH_DEGRADED', [
                'failed_jobs_last_hour' => $failedLastHour,
                'pending_jobs' => $pendingJobs,
                'time' => now()->toIso8601String(),
            ]);

            // Capture in Sentry if available
            if (app()->bound('sentry')) {
                app('sentry')->captureMessage("Queue health degraded: {$failedLastHour} failed jobs in last hour", \Sentry\Severity::warning());
            }

            $this->warn("ALERT: {$failedLastHour} failed jobs in the last hour!");
        }

        $this->info('Queue Health Summary:');
        $this->info("  Pending jobs:          {$pendingJobs}");
        $this->info("  Failed (last hour):    {$failedLastHour}");
        $this->info("  Failed (total):        {$totalFailed}");

        $status = $failedLastHour > 5 ? 'DEGRADED' : ($pendingJobs > 100 ? 'BACKLOGGED' : 'HEALTHY');
        $this->info("  Status:                {$status}");

        return self::SUCCESS;
    }
}
