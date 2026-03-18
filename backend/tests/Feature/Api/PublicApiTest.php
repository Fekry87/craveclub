<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\SportModule;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Test Club',
            'slug' => 'test-club',
            'is_active' => true,
        ]);

        // Ensure features exist for the club (subscription_plans needs to be enabled)
        ClubFeature::create([
            'club_id' => $this->club->id,
            'subscription_plans_enabled' => true,
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────

    private function clubHeader(): array
    {
        return ['X-Club-Slug' => $this->club->slug];
    }

    // ── Branches ─────────────────────────────────────────────

    public function test_public_branches_require_club_slug_header(): void
    {
        $response = $this->getJson('/api/v1/branches');

        $response->assertStatus(422);
    }

    public function test_public_branches_returns_data_with_valid_slug(): void
    {
        Branch::create([
            'club_id' => $this->club->id,
            'name' => 'Main Branch',
            'address' => '123 Test St',
            'city' => 'Test City',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->clubHeader())
            ->getJson('/api/v1/branches');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Main Branch']);
    }

    // ── Sports ───────────────────────────────────────────────

    public function test_public_sports_returns_data(): void
    {
        $module = SportModule::create([
            'name' => 'Swimming',
            'slug' => 'swimming',
            'is_active' => true,
        ]);

        $this->club->sportModules()->attach($module->id, ['is_active' => true]);

        $response = $this->withHeaders($this->clubHeader())
            ->getJson('/api/v1/sports');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Swimming']);
    }

    // ── Subscription Plans ───────────────────────────────────

    public function test_public_subscription_plans_returns_data(): void
    {
        SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Monthly Plan',
            'duration_months' => 1,
            'price' => 99.99,
            'is_active' => true,
            'display_order' => 1,
        ]);

        $response = $this->withHeaders($this->clubHeader())
            ->getJson('/api/v1/subscription-plans');

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Monthly Plan']);
    }

    // ── Coaches ──────────────────────────────────────────────

    public function test_public_coaches_returns_data(): void
    {
        $coachUser = User::create([
            'name' => 'Coach John',
            'email' => 'coach@testclub.com',
            'password' => 'password123',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        CoachProfile::create([
            'club_id' => $this->club->id,
            'user_id' => $coachUser->id,
            'bio' => 'Experienced coach',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->clubHeader())
            ->getJson('/api/v1/coaches');

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Coach John']);
    }

    // ── Club by Slug ─────────────────────────────────────────

    public function test_public_club_by_slug_returns_club_data(): void
    {
        $response = $this->getJson('/api/v1/clubs/'.$this->club->slug);

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Test Club'])
            ->assertJsonStructure(['id', 'name', 'slug']);
    }

    public function test_public_club_by_slug_returns_404_for_invalid_slug(): void
    {
        $response = $this->getJson('/api/v1/clubs/nonexistent-slug');

        $response->assertNotFound();
    }
}
