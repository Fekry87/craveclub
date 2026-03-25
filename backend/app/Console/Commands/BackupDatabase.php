<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
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

        // ── 1. Resolve DB credentials (fallback for scheduler where vars may differ) ──
        $host = config('database.connections.mysql.host')
            ?: config('database.connections.mysql.write.host')
            ?: data_get(config('database.connections.mysql.read'), 'host.0')
            ?: env('DB_HOST')
            ?: env('MYSQLHOST');
        $port = config('database.connections.mysql.port', 3306)
            ?: env('DB_PORT', 3306)
            ?: env('MYSQLPORT', 3306);
        $database = config('database.connections.mysql.database')
            ?: env('DB_DATABASE')
            ?: env('MYSQLDATABASE');
        $username = config('database.connections.mysql.username')
            ?: env('DB_USERNAME')
            ?: env('MYSQLUSER');
        $password = config('database.connections.mysql.password')
            ?: env('DB_PASSWORD')
            ?: env('MYSQLPASSWORD', '');

        if (empty($database) || empty($username) || empty($host)) {
            $msg = "DB credentials missing — host:{$host} user:{$username} db:{$database}";
            $this->error($msg);
            $this->logToDb('failed', $msg);

            return 1;
        }

        // ── 2. Find mysqldump binary (mariadb-dump is the real binary in Alpine) ──
        $dumpBin = null;
        foreach (['/usr/bin/mariadb-dump', '/usr/bin/mysqldump', 'mariadb-dump', 'mysqldump'] as $candidate) {
            $which = trim(shell_exec("which {$candidate} 2>/dev/null") ?? '');
            if ($which !== '') {
                $dumpBin = $which;
                break;
            }
        }

        if (! $dumpBin) {
            $msg = 'Neither mysqldump nor mariadb-dump found. PATH='.getenv('PATH');
            $this->error($msg);
            $this->logToDb('failed', $msg);

            return 1;
        }

        $this->info("Using dump binary: {$dumpBin}");

        // Dump SQL first, then gzip separately — avoids pipe masking mysqldump errors
        $sqlPath = sys_get_temp_dir().'/craveclubs_'.now()->format('Y-m-d_H-i-s').'.sql';
        $errPath = sys_get_temp_dir().'/backup_stderr.log';

        $cmd = sprintf(
            'MYSQL_PWD=%s %s --host=%s --port=%s --user=%s --single-transaction --quick --lock-tables=false %s > %s 2>%s',
            escapeshellarg($password),
            escapeshellarg($dumpBin),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($sqlPath),
            escapeshellarg($errPath)
        );

        if ($this->option('dry-run')) {
            $this->info('[DRY RUN] Would run: '.preg_replace('/MYSQL_PWD=\S+/', 'MYSQL_PWD=[REDACTED]', $cmd));
            $this->info("[DRY RUN] Would upload to B2: {$b2Path}");
            $this->info('[DRY RUN] Would prune backups older than 30 days');

            return 0;
        }

        // ── 3. Run dump ───────────────────────────────────────────────
        $this->info("DB: {$username}@{$host}:{$port}/{$database}");
        exec($cmd, $output, $exitCode);
        $stderr = @file_get_contents($errPath) ?: '';
        @unlink($errPath);

        if ($exitCode !== 0 || ! file_exists($sqlPath) || filesize($sqlPath) < 100) {
            $error = "mysqldump failed (exit {$exitCode}). stderr: {$stderr}";
            $this->error($error);
            $this->alertFailure($error);
            $this->logToDb('failed', $error, null, null, now()->diffInSeconds($startTime));
            @unlink($sqlPath);

            return 1;
        }

        // Gzip the SQL file
        $this->info('SQL dump: '.round(filesize($sqlPath) / 1024, 1).' KB — compressing...');
        exec('gzip -f '.escapeshellarg($sqlPath), $gzOutput, $gzExit);
        $tmpPath = $sqlPath.'.gz';

        if ($gzExit !== 0 || ! file_exists($tmpPath)) {
            $error = "gzip failed (exit {$gzExit})";
            $this->error($error);
            $this->alertFailure($error);
            $this->logToDb('failed', $error, null, null, now()->diffInSeconds($startTime));
            @unlink($sqlPath);

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
            $error = 'B2 upload failed: '.$e->getMessage();
            $this->error($error);
            $this->alertFailure($error);
            $this->logToDb('failed', $error, $b2Path, $sizeKb, now()->diffInSeconds($startTime));
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
        $this->logToDb('success', "Backup complete in {$duration}s", $b2Path, $sizeKb, $duration);

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

    private function logToDb(string $status, string $message, ?string $filePath = null, ?float $sizeKb = null, ?int $duration = null): void
    {
        try {
            DB::table('backup_logs')->insert([
                'status' => $status,
                'message' => $message,
                'file_path' => $filePath,
                'size_kb' => $sizeKb,
                'duration_s' => $duration,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $this->warn('Could not write to backup_logs: '.$e->getMessage());
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
