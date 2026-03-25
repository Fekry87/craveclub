<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PDO;

/**
 * Pure-PHP database backup — no mysqldump binary required.
 *
 * Connects via PDO, exports all tables to SQL, compresses with gzencode(),
 * uploads to Backblaze B2. Scheduled daily at 02:00 UTC via routes/console.php.
 * Retains backups for 30 days with automatic pruning.
 */
class BackupDatabase extends Command
{
    protected $signature = 'backup:database {--dry-run : Show what would happen without doing it}';

    protected $description = 'Dump MySQL database via PHP/PDO, compress, and upload to Backblaze B2';

    public function handle(): int
    {
        error_log('BackupDatabase started at '.now());

        $startTime = now();
        $filename = 'craveclubs_'.now()->format('Y-m-d_H-i-s').'.sql.gz';
        $b2Path = 'backups/daily/'.$filename;

        $this->info("Starting backup: {$filename}");

        // ── 0. Verify backup_logs table is reachable ────────────────
        try {
            DB::table('backup_logs')->insert([
                'status' => 'started',
                'message' => "Backup started: {$filename}",
                'created_at' => now(),
            ]);
            error_log('BackupDatabase: wrote started record to backup_logs');
        } catch (\Throwable $e) {
            error_log('BackupDatabase: backup_logs write FAILED: '.$e->getMessage());
            // Check if table exists
            try {
                $exists = DB::select("SHOW TABLES LIKE 'backup_logs'");
                error_log('BackupDatabase: backup_logs table exists: '.($exists ? 'YES' : 'NO'));
            } catch (\Throwable $e2) {
                error_log('BackupDatabase: SHOW TABLES failed: '.$e2->getMessage());
            }
        }

        // ── 1. Resolve DB credentials ───────────────────────────────
        // Env vars first (always strings, work on scheduler where config may be null).
        // Config values can be arrays (read/write split) so extract string carefully.
        $host = env('DB_HOST')
            ?: env('MYSQLHOST')
            ?: $this->resolveConfigString('database.connections.mysql.host')
            ?: $this->resolveConfigString('database.connections.mysql.write.host')
            ?: data_get(config('database.connections.mysql.read'), 'host.0');
        $port = env('DB_PORT')
            ?: env('MYSQLPORT')
            ?: $this->resolveConfigString('database.connections.mysql.port')
            ?: 3306;
        $database = env('DB_DATABASE')
            ?: env('MYSQLDATABASE')
            ?: config('database.connections.mysql.database');
        $username = env('DB_USERNAME')
            ?: env('MYSQLUSER')
            ?: config('database.connections.mysql.username');
        $password = env('DB_PASSWORD')
            ?: env('MYSQLPASSWORD')
            ?: config('database.connections.mysql.password')
            ?: '';

        // Ensure all values are strings (not arrays)
        $host = (string) $host;
        $port = (string) ($port ?: 3306);
        $database = (string) $database;
        $username = (string) $username;
        $password = (string) $password;

        error_log("BackupDatabase credentials: host={$host} port={$port} db={$database} user={$username}");

        if ($host === '' || $database === '' || $username === '') {
            $msg = "DB credentials missing — host:{$host} user:{$username} db:{$database}";
            $this->error($msg);
            $this->logToDb('failed', $msg);

            return 1;
        }

        $this->info("DB: {$username}@{$host}:{$port}/{$database}");

        if ($this->option('dry-run')) {
            $this->info('[DRY RUN] Would connect via PDO and export all tables');
            $this->info("[DRY RUN] Would upload to B2: {$b2Path}");
            $this->info('[DRY RUN] Would prune backups older than 30 days');

            return 0;
        }

        // ── 2. Connect via PDO ──────────────────────────────────────
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,
            ]);
        } catch (\Throwable $e) {
            $msg = "PDO connection failed: {$e->getMessage()}";
            $this->error($msg);
            $this->alertFailure($msg);
            $this->logToDb('failed', $msg);

            return 1;
        }

        // ── 3. Export database to SQL string ────────────────────────
        try {
            $sql = $this->exportDatabase($pdo, $database);
        } catch (\Throwable $e) {
            $msg = "Export failed: {$e->getMessage()}";
            $this->error($msg);
            $this->alertFailure($msg);
            $this->logToDb('failed', $msg, null, null, now()->diffInSeconds($startTime));

            return 1;
        }

        $sqlSizeKb = round(strlen($sql) / 1024, 1);
        $this->info("SQL export: {$sqlSizeKb} KB — compressing...");

        // ── 4. Compress with gzencode (pure PHP) ────────────────────
        $compressed = gzencode($sql, 9);
        unset($sql); // free memory

        if ($compressed === false) {
            $msg = 'gzencode() failed';
            $this->error($msg);
            $this->alertFailure($msg);
            $this->logToDb('failed', $msg, null, null, now()->diffInSeconds($startTime));

            return 1;
        }

        $sizeKb = round(strlen($compressed) / 1024, 1);
        $this->info("Compressed: {$sizeKb} KB");

        // ── 5. Upload to Backblaze B2 ───────────────────────────────
        try {
            Storage::disk('b2')->put($b2Path, $compressed, 'private');
        } catch (\Throwable $e) {
            $msg = 'B2 upload failed: '.$e->getMessage();
            $this->error($msg);
            $this->alertFailure($msg);
            $this->logToDb('failed', $msg, $b2Path, $sizeKb, now()->diffInSeconds($startTime));

            return 1;
        }

        unset($compressed); // free memory

        // ── 6. Prune backups older than 30 days ─────────────────────
        $this->pruneOldBackups();

        // ── 7. Log success ──────────────────────────────────────────
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

    /**
     * Export entire database to SQL using PDO queries.
     */
    private function exportDatabase(PDO $pdo, string $database): string
    {
        $lines = [];
        $lines[] = "-- CraveClubs Database Backup";
        $lines[] = '-- Generated: '.now()->toIso8601String();
        $lines[] = "-- Database: {$database}";
        $lines[] = '';
        $lines[] = 'SET FOREIGN_KEY_CHECKS=0;';
        $lines[] = "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';";
        $lines[] = 'SET NAMES utf8mb4;';
        $lines[] = '';

        // Get all tables
        $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
        $this->info('Tables: '.count($tables));

        foreach ($tables as $table) {
            $this->output->write("  {$table}...");

            // CREATE TABLE statement
            $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch();
            $lines[] = "-- Table: {$table}";
            $lines[] = "DROP TABLE IF EXISTS `{$table}`;";
            $lines[] = $createStmt['Create Table'].';';
            $lines[] = '';

            // Row count
            $count = (int) $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();

            if ($count === 0) {
                $this->output->writeln(" 0 rows");

                continue;
            }

            // Get columns for proper quoting
            $columns = $pdo->query("SHOW COLUMNS FROM `{$table}`")->fetchAll();
            $columnNames = array_map(fn ($c) => "`{$c['Field']}`", $columns);
            $columnList = implode(', ', $columnNames);

            // Export rows in chunks using unbuffered query
            $lines[] = "LOCK TABLES `{$table}` WRITE;";

            $batchSize = 500;
            $offset = 0;
            $rowsExported = 0;

            while ($offset < $count) {
                $rows = $pdo->query("SELECT * FROM `{$table}` LIMIT {$batchSize} OFFSET {$offset}")->fetchAll();

                if (empty($rows)) {
                    break;
                }

                $values = [];
                foreach ($rows as $row) {
                    $escaped = [];
                    foreach ($row as $value) {
                        if ($value === null) {
                            $escaped[] = 'NULL';
                        } else {
                            $escaped[] = $pdo->quote($value);
                        }
                    }
                    $values[] = '('.implode(',', $escaped).')';
                }

                $lines[] = "INSERT INTO `{$table}` ({$columnList}) VALUES";
                $lines[] = implode(",\n", $values).';';

                $rowsExported += count($rows);
                $offset += $batchSize;
            }

            $lines[] = 'UNLOCK TABLES;';
            $lines[] = '';

            $this->output->writeln(" {$rowsExported} rows");
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS=1;';
        $lines[] = '';

        return implode("\n", $lines);
    }

    /**
     * Config values may be a string, an array (read/write split), or null.
     * Extract a usable string value.
     */
    private function resolveConfigString(string $key): ?string
    {
        $value = config($key);

        if (is_string($value) && $value !== '') {
            return $value;
        }

        if (is_array($value)) {
            return is_string($value[0] ?? null) ? $value[0] : null;
        }

        return null;
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
        error_log("BackupDatabase [{$status}]: {$message}");

        try {
            DB::table('backup_logs')->insert([
                'status' => $status,
                'message' => $message,
                'file_path' => $filePath,
                'size_kb' => $sizeKb,
                'duration_s' => $duration,
                'created_at' => now(),
            ]);
            error_log("BackupDatabase: logToDb wrote [{$status}] successfully");
        } catch (\Throwable $e) {
            error_log("BackupDatabase: logToDb FAILED: {$e->getMessage()}");
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
