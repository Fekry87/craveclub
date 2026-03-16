<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_returns_healthy(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()
            ->assertJsonFragment(['status' => 'healthy']);
    }

    public function test_health_includes_required_fields(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'checks' => [
                    'database' => ['status', 'latency_ms'],
                    'queue' => ['status', 'pending_jobs', 'failed_last_hour'],
                    'disk' => ['status', 'free_gb'],
                ],
                'timestamp',
            ]);
    }

    public function test_health_has_request_id_header(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertHeader('X-Request-ID');
    }
}
