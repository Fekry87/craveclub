<?php
// Temporary debug file — remove after fixing 500 error
header('Content-Type: application/json');

$checks = [];

try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

    // Actually handle a request to trigger the full middleware stack
    $request = \Illuminate\Http\Request::create('/api/v1/health', 'GET');
    $response = $kernel->handle($request);

    $checks['status_code'] = $response->getStatusCode();
    $checks['response_body'] = json_decode($response->getContent(), true) ?: $response->getContent();

    $kernel->terminate($request, $response);
} catch (\Throwable $e) {
    $checks['error'] = $e->getMessage();
    $checks['error_class'] = get_class($e);
    $checks['error_file'] = $e->getFile() . ':' . $e->getLine();
    $checks['error_trace'] = array_slice(
        array_map(fn($t) => ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?') . ' ' . ($t['class'] ?? '') . ($t['type'] ?? '') . ($t['function'] ?? ''),
        $e->getTrace()
    ), 0, 15);
}

echo json_encode($checks, JSON_PRETTY_PRINT);
