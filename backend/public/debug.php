<?php
header('Content-Type: application/json');

$checks = [];

try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    $request = \Illuminate\Http\Request::create('/api/v1/health', 'GET');

    // Enable exception display
    config(['app.debug' => true]);

    $response = $kernel->handle($request);
    $checks['http_status'] = $response->getStatusCode();

    if ($response->getStatusCode() !== 200) {
        $checks['response_content_type'] = $response->headers->get('Content-Type');
        $body = $response->getContent();
        $json = json_decode($body, true);
        $checks['response_body'] = $json ?: substr($body, 0, 500);
    } else {
        $checks['response_body'] = json_decode($response->getContent(), true);
    }

    $kernel->terminate($request, $response);
} catch (\Throwable $e) {
    $checks['error'] = $e->getMessage();
    $checks['error_class'] = get_class($e);
    $checks['error_file'] = $e->getFile() . ':' . $e->getLine();
    $checks['trace'] = array_slice(array_map(fn($t) => ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?') . ' ' . ($t['class'] ?? '') . ($t['type'] ?? '') . ($t['function'] ?? ''), $e->getTrace()), 0, 15);
}

// Read latest log entries
$logFiles = glob('/var/www/storage/logs/*.log');
rsort($logFiles);
if (!empty($logFiles)) {
    $lines = file($logFiles[0]);
    $checks['latest_log_file'] = basename($logFiles[0]);
    $checks['log_tail'] = array_map('trim', array_slice($lines, -20));
}

echo json_encode($checks, JSON_PRETTY_PRINT);
