<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeatureGuardTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Feature Club',
            'slug' => 'feature-club',
        ]);

        $this->manager = User::create([
            'name' => 'Club Manager',
            'email' => 'manager@featureclub.com',
            'password' => bcrypt('password123'),
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@craveclubs.com',
            'password' => bcrypt('password123'),
            'role' => UserRole::PLATFORM_ADMIN,
            'club_id' => null,
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────

    private function authHeader(User $user): array
    {
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => 'Bearer '.$token];
    }

    // ── Tests ───────────────────────────────────────────────

    public function test_manager_can_access_enabled_feature(): void
    {
        // training_plans is true by default
        ClubFeature::create(['club_id' => $this->club->id]);

        $response = $this->withHeaders($this->authHeader($this->manager))
            ->getJson('/api/v1/club/plans');

        $response->assertOk();
    }

    public function test_manager_cannot_access_disabled_feature(): void
    {
        ClubFeature::create([
            'club_id' => $this->club->id,
            'skills_enabled' => false,
        ]);

        $response = $this->withHeaders($this->authHeader($this->manager))
            ->getJson('/api/v1/club/skills');

        $response->assertForbidden();
    }

    public function test_platform_admin_bypasses_feature_guard(): void
    {
        // Admin has no club_id so the feature guard should pass through.
        // We test a club-manager route that is feature-gated, but since
        // admin lacks the CLUB_MANAGER role, this specific route would 403
        // due to role middleware. Instead, we test the FeatureGuard
        // middleware directly through a route that an admin CAN access.
        //
        // The corporate routes do not use feature guard, but the key
        // behaviour to verify is that the FeatureGuard middleware itself
        // passes when club_id is null. We test this by directly invoking
        // the middleware.

        $request = \Illuminate\Http\Request::create('/test', 'GET');
        $request->setUserResolver(fn () => $this->admin);

        $middleware = new \App\Http\Middleware\FeatureGuard;

        $response = $middleware->handle($request, function ($req) {
            return response()->json(['ok' => true]);
        }, 'skills');

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_feature_guard_returns_proper_error_message(): void
    {
        ClubFeature::create([
            'club_id' => $this->club->id,
            'skills_enabled' => false,
        ]);

        $response = $this->withHeaders($this->authHeader($this->manager))
            ->getJson('/api/v1/club/skills');

        $response->assertForbidden()
            ->assertJsonPath('message', 'This feature is not enabled for your club.')
            ->assertJsonPath('feature', 'skills');
    }
}
