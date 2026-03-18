<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CorporateSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CorporateApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $manager;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@craveclubs.com',
            'password' => bcrypt('password123'),
            'role' => UserRole::PLATFORM_ADMIN,
            'club_id' => null,
        ]);

        $this->club = Club::create([
            'name' => 'Existing Club',
            'slug' => 'existing-club',
        ]);

        $this->manager = User::create([
            'name' => 'Club Manager',
            'email' => 'manager@test.com',
            'password' => bcrypt('password123'),
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────

    private function authHeader(User $user): array
    {
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => 'Bearer '.$token];
    }

    private function seedCorporateSettings(): void
    {
        CorporateSetting::set('platform_name', 'TestPlatform');
        CorporateSetting::set('primary_color', '#111111');
        CorporateSetting::set('secondary_color', '#222222');
        CorporateSetting::set('tagline', 'Test tagline');
    }

    // ── Corporate Settings ──────────────────────────────────

    public function test_admin_can_read_corporate_settings(): void
    {
        $this->seedCorporateSettings();

        $response = $this->withHeaders($this->authHeader($this->admin))
            ->getJson('/api/v1/corporate/settings');

        $response->assertOk()
            ->assertJsonFragment(['platform_name' => 'TestPlatform'])
            ->assertJsonFragment(['primary_color' => '#111111']);
    }

    public function test_admin_can_update_corporate_settings(): void
    {
        $this->seedCorporateSettings();

        $response = $this->withHeaders($this->authHeader($this->admin))
            ->putJson('/api/v1/corporate/settings', [
                'settings' => [
                    'platform_name' => 'UpdatedPlatform',
                    'tagline' => 'New tagline',
                ],
            ]);

        $response->assertOk()
            ->assertJsonFragment(['platform_name' => 'UpdatedPlatform'])
            ->assertJsonFragment(['tagline' => 'New tagline']);

        $this->assertDatabaseHas('corporate_settings', [
            'key' => 'platform_name',
            'value' => 'UpdatedPlatform',
        ]);
    }

    // ── Club Listing ────────────────────────────────────────

    public function test_admin_can_list_clubs(): void
    {
        ClubFeature::create(['club_id' => $this->club->id]);

        $response = $this->withHeaders($this->authHeader($this->admin))
            ->getJson('/api/v1/corporate/clubs');

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Existing Club');
    }

    // ── Club Creation ───────────────────────────────────────

    public function test_admin_can_create_club_with_features_and_manager(): void
    {
        $response = $this->withHeaders($this->authHeader($this->admin))
            ->postJson('/api/v1/corporate/clubs', [
                'name' => 'New Club',
                'slug' => 'new-club',
                'theme_color' => '#0ea5e9',
                'contact_email' => 'info@newclub.com',
                'manager_name' => 'New Manager',
                'manager_email' => 'mgr@newclub.com',
                'manager_password' => 'Secret123!',
                'features' => [
                    'skills_enabled' => false,
                    'leaderboard_enabled' => false,
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('club.name', 'New Club')
            ->assertJsonPath('manager.email', 'mgr@newclub.com')
            ->assertJsonPath('club.features.skills_enabled', false)
            ->assertJsonPath('club.features.leaderboard_enabled', false)
            ->assertJsonPath('club.features.training_plans_enabled', true);

        $this->assertDatabaseHas('clubs', ['slug' => 'new-club']);
        $this->assertDatabaseHas('users', [
            'email' => 'mgr@newclub.com',
            'role' => UserRole::CLUB_MANAGER->value,
        ]);
    }

    // ── Club Detail ─────────────────────────────────────────

    public function test_admin_can_view_club_detail(): void
    {
        ClubFeature::create(['club_id' => $this->club->id]);

        $response = $this->withHeaders($this->authHeader($this->admin))
            ->getJson('/api/v1/corporate/clubs/'.$this->club->id);

        $response->assertOk()
            ->assertJsonPath('name', 'Existing Club')
            ->assertJsonStructure(['features', 'users_count']);
    }

    // ── Club Feature Toggle ─────────────────────────────────

    public function test_admin_can_toggle_club_features(): void
    {
        ClubFeature::create(['club_id' => $this->club->id]);

        $response = $this->withHeaders($this->authHeader($this->admin))
            ->putJson('/api/v1/corporate/clubs/'.$this->club->id.'/features', [
                'skills_enabled' => false,
                'evaluations_enabled' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('skills_enabled', false)
            ->assertJsonPath('evaluations_enabled', false)
            ->assertJsonPath('training_plans_enabled', true);
    }

    // ── Authorization ───────────────────────────────────────

    public function test_non_admin_gets_403_on_corporate_routes(): void
    {
        $managerHeaders = $this->authHeader($this->manager);

        $this->withHeaders($managerHeaders)
            ->getJson('/api/v1/corporate/settings')
            ->assertForbidden();

        $this->withHeaders($managerHeaders)
            ->putJson('/api/v1/corporate/settings', ['settings' => []])
            ->assertForbidden();

        $this->withHeaders($managerHeaders)
            ->getJson('/api/v1/corporate/clubs')
            ->assertForbidden();

        $this->withHeaders($managerHeaders)
            ->postJson('/api/v1/corporate/clubs', [])
            ->assertForbidden();

        $this->withHeaders($managerHeaders)
            ->getJson('/api/v1/corporate/metrics')
            ->assertForbidden();
    }

    // ── Metrics ─────────────────────────────────────────────

    public function test_admin_can_get_metrics(): void
    {
        ClubFeature::create(['club_id' => $this->club->id]);

        $response = $this->withHeaders($this->authHeader($this->admin))
            ->getJson('/api/v1/corporate/metrics');

        $response->assertOk()
            ->assertJsonStructure([
                'total_clubs',
                'total_users',
                'total_managers',
                'total_coaches',
                'total_swimmers',
                'clubs_this_month',
                'feature_usage',
                'recent_clubs',
            ]);
    }
}
