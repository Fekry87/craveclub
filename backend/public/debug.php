<?php
header('Content-Type: application/json');

$checks = [];

try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

    // Test 1: Can we resolve basic services?
    $checks['db_ok'] = false;
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $checks['db_ok'] = true;
    } catch (\Throwable $e) {
        $checks['db_error'] = $e->getMessage();
    }

    // Test 2: Try the health route logic directly (bypass HTTP kernel)
    try {
        $dbOk = false;
        $dbLatency = 0;
        $start = microtime(true);
        \Illuminate\Support\Facades\DB::select('SELECT 1');
        $dbLatency = round((microtime(true) - $start) * 1000, 2);
        $dbOk = true;
        $checks['direct_health'] = ['db' => $dbOk, 'latency_ms' => $dbLatency];
    } catch (\Throwable $e) {
        $checks['direct_health_error'] = $e->getMessage();
    }

    // Test 3: Check what middleware is registered
    $router = $app->make(\Illuminate\Routing\Router::class);
    $routes = $router->getRoutes();
    $healthRoute = $routes->match(
        \Illuminate\Http\Request::create('/api/v1/health', 'GET')
    );
    $checks['health_route'] = [
        'uri' => $healthRoute->uri(),
        'middleware' => $healthRoute->gatherMiddleware(),
        'action' => $healthRoute->getActionName(),
    ];

    // Test 4: Try running through the HTTP kernel with exception catching
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    $request = \Illuminate\Http\Request::create('/api/v1/health', 'GET');

    // Override error handling to catch the real exception
    $app->singleton(
        \Illuminate\Contracts\Debug\ExceptionHandler::class,
        function () {
            return new class extends \Illuminate\Foundation\Exceptions\Handler {
                public $lastException = null;
                public function __construct() {
                    // Don't call parent — we just want to capture
                }
                public function report(\Throwable $e): void {
                    $this->lastException = $e;
                }
                public function render($request, \Throwable $e) {
                    $this->lastException = $e;
                    return response()->json([
                        'caught_error' => $e->getMessage(),
                        'caught_class' => get_class($e),
                        'caught_file' => $e->getFile() . ':' . $e->getLine(),
                        'caught_trace' => array_slice(array_map(
                            fn($t) => ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?') . ' ' . ($t['class'] ?? '') . ($t['type'] ?? '') . ($t['function'] ?? ''),
                            $e->getTrace()
                        ), 0, 10),
                    ], 500);
                }
            };
        }
    );

    $response = $kernel->handle($request);
    $checks['http_status'] = $response->getStatusCode();
    $checks['http_response'] = json_decode($response->getContent(), true) ?: substr($response->getContent(), 0, 500);

} catch (\Throwable $e) {
    $checks['fatal_error'] = $e->getMessage();
    $checks['fatal_file'] = $e->getFile() . ':' . $e->getLine();
}

echo json_encode($checks, JSON_PRETTY_PRINT);
