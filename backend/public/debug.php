<?php
// Temporary debug file — remove after fixing 500 error
header('Content-Type: application/json');

$checks = [];

// Check PHP version
$checks['php_version'] = PHP_VERSION;

// Check extensions
$checks['extensions'] = [
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'redis' => extension_loaded('redis'),
    'mbstring' => extension_loaded('mbstring'),
    'bcmath' => extension_loaded('bcmath'),
];

// Check env vars
$checks['env'] = [
    'APP_KEY' => !empty(getenv('APP_KEY')) ? 'SET (' . strlen(getenv('APP_KEY')) . ' chars)' : 'MISSING',
    'APP_ENV' => getenv('APP_ENV') ?: 'NOT SET',
    'APP_DEBUG' => getenv('APP_DEBUG') ?: 'NOT SET',
    'DB_HOST' => getenv('DB_HOST') ? 'SET' : (getenv('DATABASE_URL') ? 'DATABASE_URL SET' : 'MISSING'),
    'REDIS_URL' => getenv('REDIS_URL') ? 'SET' : 'MISSING',
];

// Check .env file
$checks['dotenv_exists'] = file_exists(__DIR__ . '/../.env');
$checks['dotenv_size'] = file_exists(__DIR__ . '/../.env') ? filesize(__DIR__ . '/../.env') : 'N/A';

// Check storage writable
$checks['storage_writable'] = is_writable(__DIR__ . '/../storage');
$checks['cache_writable'] = is_writable(__DIR__ . '/../bootstrap/cache');

// Try to bootstrap Laravel and catch the error
try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    $checks['laravel_bootstrap'] = 'OK';
} catch (\Throwable $e) {
    $checks['laravel_bootstrap'] = 'FAILED: ' . $e->getMessage();
    $checks['error_file'] = $e->getFile() . ':' . $e->getLine();
}

echo json_encode($checks, JSON_PRETTY_PRINT);
