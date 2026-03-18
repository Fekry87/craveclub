<?php

namespace Tests\Feature\Middleware;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $swimmer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Middleware Test Club',
            'slug' => 'middleware-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create(['club_id' => $this->club->id]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@middlewaretest.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->swimmer = User::create([
            'name' => 'Swimmer',
            'email' => 'swimmer@middlewaretest.com',
            'password' => 'password',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
    }

    // ── Security Headers ─────────────────────────────────

    public function test_response_has_x_content_type_options(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_response_has_x_frame_options(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_response_has_referrer_policy(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_response_has_permissions_policy(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_response_has_content_security_policy(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertHeader('Content-Security-Policy');
    }

    // ── API Version Middleware ────────────────────────────

    public function test_response_has_api_version_header(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertHeader('X-API-Version', 'v1');
    }

    public function test_response_has_api_deprecated_header(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertHeader('X-API-Deprecated', 'false');
    }

    // ── ResolveClubFromHeader ────────────────────────────

    public function test_missing_club_slug_header_returns_422(): void
    {
        $response = $this->getJson('/api/v1/branches');

        $response->assertStatus(422);
    }

    public function test_invalid_club_slug_returns_404(): void
    {
        $response = $this->getJson('/api/v1/branches', [
            'X-Club-Slug' => 'nonexistent-club-slug',
        ]);

        $response->assertStatus(404);
    }

    public function test_valid_club_slug_resolves_club(): void
    {
        $response = $this->getJson('/api/v1/branches', [
            'X-Club-Slug' => $this->club->slug,
        ]);

        $response->assertOk();
    }

    // ── Role Middleware ──────────────────────────────────

    public function test_correct_role_can_access_route(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/dashboard');

        $response->assertOk();
    }

    public function test_wrong_role_gets_403(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/club/dashboard');

        $response->assertStatus(403);
    }

    // ── RequestLogger ────────────────────────────────────

    public function test_response_has_request_id_header(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/dashboard');

        $response->assertHeader('X-Request-Id');
    }

    public function test_response_has_response_time_header(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/dashboard');

        $response->assertHeader('X-Response-Time');
    }

    public function test_response_time_header_on_public_endpoint(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertHeader('X-Response-Time');
    }

    // ── ForceProductionSettings ──────────────────────────

    public function test_testing_env_passes_through(): void
    {
        $response = $this->getJson('/api/v1/docs');

        $response->assertOk();
    }

    // ── Metrics Endpoint ────────────────────────────────

    public function test_metrics_returns_403_without_key(): void
    {
        $response = $this->getJson('/api/v1/metrics');

        $response->assertStatus(403);
    }

    public function test_metrics_returns_403_with_wrong_key(): void
    {
        config(['app.metrics_secret_key' => 'correct-key']);

        $response = $this->getJson('/api/v1/metrics', [
            'X-Metrics-Key' => 'wrong-key',
        ]);

        $response->assertStatus(403);
    }

    public function test_metrics_returns_200_with_correct_key(): void
    {
        config(['app.metrics_secret_key' => 'test-secret-key']);

        $response = $this->getJson('/api/v1/metrics', [
            'X-Metrics-Key' => 'test-secret-key',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'timestamp',
                'app' => ['version', 'environment'],
                'database' => [
                    'total_clubs',
                    'total_users',
                    'total_sessions',
                    'total_notifications',
                    'pending_jobs',
                    'failed_jobs_24h',
                ],
                'queues' => ['pending', 'failed_24h'],
            ]);
    }
}
