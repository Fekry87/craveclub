<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfrastructureTest extends TestCase
{
    use RefreshDatabase;

    // ── Test 1: Security headers present on API response ──

    public function test_security_headers_present_on_api_response(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy');
        $response->assertHeader('Content-Security-Policy');
    }

    // ── Test 2: CORS rejects unknown origin ──

    public function test_cors_rejects_unknown_origin(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'https://evil-site.com',
        ])->options('/api/v1/health');

        // CORS middleware should not include Access-Control-Allow-Origin for unknown origins
        $this->assertNotEquals(
            'https://evil-site.com',
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    // ── Test 3: Health check returns 200 ──

    public function test_health_check_returns_200(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertJsonStructure(['status', 'checks', 'timestamp']);
        $response->assertJsonPath('status', 'healthy');
    }

    // ── Test 4: Metrics endpoint requires secret key ──

    public function test_metrics_endpoint_requires_secret_key(): void
    {
        $response = $this->getJson('/api/v1/metrics');

        $response->assertStatus(403);
    }

    // ── Test 5: Metrics endpoint returns 200 with key ──

    public function test_metrics_endpoint_returns_200_with_key(): void
    {
        config(['app.metrics_secret_key' => 'test-metrics-key']);

        $response = $this->withHeaders([
            'X-Metrics-Key' => 'test-metrics-key',
        ])->getJson('/api/v1/metrics');

        $response->assertOk();
    }

    // ── Test 6: Maintenance mode returns JSON not HTML ──

    public function test_maintenance_mode_returns_json_not_html(): void
    {
        // Simulate maintenance mode by testing the 503 handler
        // We can't easily use artisan down in tests, so test the handler directly
        $this->app->bind('test.maintenance', function () {
            throw new \Symfony\Component\HttpKernel\Exception\HttpException(503);
        });

        \Illuminate\Support\Facades\Route::get('/api/v1/test-maintenance', function () {
            return app('test.maintenance');
        });

        $response = $this->getJson('/api/v1/test-maintenance');

        $response->assertStatus(503);
        $response->assertHeader('Content-Type', 'application/json');
        $response->assertJsonStructure(['message', 'retry_after']);
    }

    // ── Test 7: Request ID header present ──

    public function test_request_id_header_present(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertHeader('X-Request-ID');
        // UUID format check
        $requestId = $response->headers->get('X-Request-ID');
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $requestId
        );
    }

    // ── Test 8: Response time header present ──

    public function test_response_time_header_present(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertHeader('X-Response-Time');
        // Should be a number followed by "ms"
        $responseTime = $response->headers->get('X-Response-Time');
        $this->assertMatchesRegularExpression('/^\d+(\.\d+)?ms$/', $responseTime);
    }
}
