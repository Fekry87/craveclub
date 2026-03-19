<?php
header('Content-Type: application/json');

try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

    $checks = [];
    $checks['app_debug'] = config('app.debug');
    $checks['app_env'] = config('app.env');
    $checks['app_key_set'] = !empty(config('app.key'));
    $checks['db_connection'] = config('database.default');
    $checks['db_host'] = config('database.connections.mysql.host');
    $checks['cache_driver'] = config('cache.default');
    $checks['log_channel'] = config('logging.default');

    // Check if there's a cached config
    $checks['config_cached'] = file_exists($app->getCachedConfigPath());

    // Try DB connection
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $checks['db_connected'] = true;
    } catch (\Throwable $e) {
        $checks['db_connected'] = false;
        $checks['db_error'] = $e->getMessage();
    }

    // Read last 30 lines of Laravel log
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $lines = file($logFile);
        $checks['log_last_lines'] = array_slice($lines, -30);
    } else {
        // Try daily log
        $dailyLog = storage_path('logs/laravel-' . date('Y-m-d') . '.log');
        if (file_exists($dailyLog)) {
            $lines = file($dailyLog);
            $checks['log_last_lines'] = array_slice($lines, -30);
        } else {
            $checks['log_files'] = glob(storage_path('logs/*.log'));
        }
    }

    echo json_encode($checks, JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => $e->getFile() . ':' . $e->getLine(),
        'trace' => array_slice(array_map(fn($t) => ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?'), $e->getTrace()), 0, 10),
    ], JSON_PRETTY_PRINT);
}
