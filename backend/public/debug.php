<?php
header('Content-Type: application/json');

$checks = [];

// Check actual permissions on bootstrap/cache
$dir = '/var/www/bootstrap/cache';
$checks['bootstrap_cache'] = [
    'exists' => is_dir($dir),
    'writable' => is_writable($dir),
    'owner' => posix_getpwuid(fileowner($dir))['name'] ?? fileowner($dir),
    'group' => posix_getgrgid(filegroup($dir))['name'] ?? filegroup($dir),
    'perms' => substr(sprintf('%o', fileperms($dir)), -4),
];

// Check files inside bootstrap/cache
if (is_dir($dir)) {
    $files = glob($dir . '/*');
    $checks['bootstrap_cache_files'] = [];
    foreach ($files as $f) {
        $checks['bootstrap_cache_files'][basename($f)] = [
            'owner' => posix_getpwuid(fileowner($f))['name'] ?? fileowner($f),
            'perms' => substr(sprintf('%o', fileperms($f)), -4),
            'writable' => is_writable($f),
        ];
    }
}

// Check who PHP-FPM is running as
$checks['current_user'] = posix_getpwuid(posix_geteuid())['name'] ?? posix_geteuid();
$checks['current_uid'] = posix_geteuid();

// Check storage
$checks['storage_writable'] = is_writable('/var/www/storage');
$checks['storage_logs_writable'] = is_writable('/var/www/storage/logs');

// Try the actual HTTP request simulation
try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    $request = \Illuminate\Http\Request::create('/api/v1/health', 'GET');

    // Catch the error during handle
    try {
        $response = $kernel->handle($request);
        $checks['http_status'] = $response->getStatusCode();
        if ($response->getStatusCode() === 200) {
            $checks['http_body'] = json_decode($response->getContent(), true);
        }
    } catch (\Throwable $e) {
        $checks['http_error'] = $e->getMessage();
        $checks['http_error_file'] = $e->getFile() . ':' . $e->getLine();
    }
} catch (\Throwable $e) {
    $checks['bootstrap_error'] = $e->getMessage();
    $checks['bootstrap_error_file'] = $e->getFile() . ':' . $e->getLine();
}

echo json_encode($checks, JSON_PRETTY_PRINT);
