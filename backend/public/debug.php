<?php
header('Content-Type: application/json');

$checks = [];

// Check permissions BEFORE Laravel boots
$cacheDir = __DIR__ . '/../bootstrap/cache';
$checks['cache_dir_writable'] = is_writable($cacheDir);
$checks['cache_dir_perms'] = substr(sprintf('%o', fileperms($cacheDir)), -4);

// Check each file
foreach (glob($cacheDir . '/*') as $f) {
    $checks['files'][basename($f)] = [
        'writable' => is_writable($f),
        'perms' => substr(sprintf('%o', fileperms($f)), -4),
        'owner_uid' => fileowner($f),
    ];
}

// Check current process user
$checks['process_uid'] = posix_geteuid();
$checks['process_user'] = posix_getpwuid(posix_geteuid())['name'] ?? 'unknown';

// Try to actually write a test file to bootstrap/cache
$testFile = $cacheDir . '/_test_write_' . time();
$writeResult = @file_put_contents($testFile, 'test');
$checks['can_write_new_file'] = $writeResult !== false;
if ($writeResult !== false) @unlink($testFile);

// Try to overwrite packages.php
$pkgFile = $cacheDir . '/packages.php';
if (file_exists($pkgFile)) {
    $content = file_get_contents($pkgFile);
    $checks['can_overwrite_packages'] = @file_put_contents($pkgFile, $content) !== false;
}

// Now try to bootstrap Laravel
try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';

    // Bootstrap manually
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    $checks['laravel_bootstrapped'] = true;

    // Now try HTTP kernel
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    $request = \Illuminate\Http\Request::create('/api/v1/health', 'GET');
    $response = $kernel->handle($request);
    $checks['health_status'] = $response->getStatusCode();
    if ($response->getStatusCode() === 200) {
        $checks['health_body'] = json_decode($response->getContent(), true);
    } else {
        $checks['health_body'] = substr($response->getContent(), 0, 300);
    }
} catch (\Throwable $e) {
    $checks['error'] = $e->getMessage();
    $checks['error_file'] = $e->getFile() . ':' . $e->getLine();
}

echo json_encode($checks, JSON_PRETTY_PRINT);
