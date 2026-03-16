<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SafeMigrate extends Command
{
    protected $signature = 'migrate:safe';

    protected $description = 'Run pending migrations safely with post-migration cache optimization';

    public function handle(): int
    {
        // Check for pending migrations
        $this->info('Checking for pending migrations...');

        $pendingOutput = '';
        Artisan::call('migrate:status', [], $output = new \Symfony\Component\Console\Output\BufferedOutput());
        $statusOutput = $output->fetch();

        // Count pending migrations (lines with "Pending" status)
        $pendingCount = substr_count($statusOutput, 'Pending');

        if ($pendingCount === 0) {
            $this->info('No pending migrations.');
            Log::channel('daily')->info('migrate:safe — no pending migrations');

            return self::SUCCESS;
        }

        $this->info("Found {$pendingCount} pending migration(s). Running...");

        // Run migrations
        try {
            $exitCode = Artisan::call('migrate', ['--force' => true]);

            if ($exitCode !== 0) {
                $this->error('Migration failed with exit code: ' . $exitCode);
                Log::channel('daily')->error('migrate:safe — migration failed', [
                    'exit_code' => $exitCode,
                ]);

                return self::FAILURE;
            }

            $this->info('Migrations completed successfully.');
        } catch (\Throwable $e) {
            $this->error('Migration error: ' . $e->getMessage());
            Log::channel('daily')->error('migrate:safe — migration exception', [
                'error' => $e->getMessage(),
            ]);

            return self::FAILURE;
        }

        // Rebuild caches
        $this->info('Rebuilding caches...');

        $cacheCommands = [
            'config:cache',
            'route:cache',
            'view:cache',
        ];

        foreach ($cacheCommands as $cmd) {
            try {
                Artisan::call($cmd);
                $this->line("  ✓ {$cmd}");
            } catch (\Throwable $e) {
                $this->warn("  ✗ {$cmd} — {$e->getMessage()}");
            }
        }

        Log::channel('daily')->info('migrate:safe — completed', [
            'pending_count' => $pendingCount,
        ]);

        $this->info('Done. ' . $pendingCount . ' migration(s) applied and caches rebuilt.');

        return self::SUCCESS;
    }
}
