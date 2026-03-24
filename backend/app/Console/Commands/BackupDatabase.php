<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Dump MySQL database, compress with gzip, and upload to Backblaze B2.
 *
 * Scheduled daily at 02:00 UTC via routes/console.php.
 * Retains backups for 30 days with automatic pruning.
 */
class BackupDatabase extends Command
{
    protected $signature = 'backup:database {--dry-run : Show what would happen without doing it}';

    protected $description = 'Dump MySQL database, compress, and upload to Backblaze B2';

    public function handle(): int
    {
        $startTime = now();
        $filename = 'craveclubs_'.now()->format('Y-m-d_H-i-s').'.sql.gz';
        $tmpPath = sys_get_temp_dir().'/'.$filename;
        $b2Path = 'backups/daily/'.$filename;

        $this->info("Starting backup: {$filename}");

        // ── 1. Build mysqldump command ────────────────────────────────
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        if (empty($database) || empty($username)) {
            $this->error('Database credentials missing — check DB_* env vars.');

            return 1;
        }

        $cmd = sprintf(
            'MYSQL_PWD=%s mysqldump --host=%s --port=%s --user=%s --single-transaction --quick --lock-tables=false %s | gzip > %s 2>&1',
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($tmpPath)
        );

        if ($this->option('dry-run')) {
            $this->info('[DRY RUN] Would run: '.preg_replace('/MYSQL_PWD=\S+/', 'MYSQL_PWD=[REDACTED]', $cmd));
            $this->info("[DRY RUN] Would upload to B2: {$b2Path}");
            $this->info('[DRY RUN] Would prune backups older than 30 days');

            return 0;
        }

        // ── 2. Run dump ───────────────────────────────────────────────
        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0 || ! file_exists($tmpPath) || filesize($tmpPath) < 100) {
            $error = 'mysqldump failed (exit '.$exitCode.'). Output: '.implode(' ', $output);
            $this->error($error);
            $this->alertFailure($error);
            @unlink($tmpPath);

            return 1;
        }

        $sizeKb = round(filesize($tmpPath) / 1024, 1);
        $this->info("Dump complete: {$sizeKb} KB");

        // ── 3. Upload to Backblaze B2 ─────────────────────────────────
        try {
            $stream = fopen($tmpPath, 'rb');
            Storage::disk('b2')->put($b2Path, $stream, 'private');
            if (is_resource($stream)) {
                fclose($stream);
            }
        } catch (\Throwable $e) {
            $this->error('B2 upload failed: '.$e->getMessage());
            $this->alertFailure('B2 upload failed: '.$e->getMessage());
            @unlink($tmpPath);

            return 1;
        }

        // ── 4. Delete local temp file ─────────────────────────────────
        @unlink($tmpPath);

        // ── 5. Prune backups older than 30 days ───────────────────────
        $this->pruneOldBackups();

        // ── 6. Log success ────────────────────────────────────────────
        $duration = now()->diffInSeconds($startTime);

        Log::channel('daily')->info('BACKUP_SUCCESS', [
            'file' => $b2Path,
            'size_kb' => $sizeKb,
            'duration_s' => $duration,
            'database' => $database,
        ]);

        $this->info("Backup complete in {$duration}s -> {$b2Path}");

        return 0;
    }

    private function pruneOldBackups(): void
    {
        try {
            $cutoff = now()->subDays(30);
            $files = Storage::disk('b2')->files('backups/daily/');
            $deleted = 0;

            foreach ($files as $file) {
                $timestamp = Storage::disk('b2')->lastModified($file);
                if ($timestamp < $cutoff->timestamp) {
                    Storage::disk('b2')->delete($file);
                    $deleted++;
                }
            }

            if ($deleted > 0) {
                $this->info("Pruned {$deleted} old backup(s).");
            }
        } catch (\Throwable $e) {
            Log::warning('BACKUP_PRUNE_FAILED', ['error' => $e->getMessage()]);
        }
    }

    private function alertFailure(string $message): void
    {
        Log::channel('daily')->error('BACKUP_FAILED', [
            'error' => $message,
            'database' => config('database.connections.mysql.database'),
        ]);

        if (app()->bound('sentry')) {
            app('sentry')->captureMessage('Daily backup failed: '.$message, \Sentry\Severity::error());
        }
    }
}
