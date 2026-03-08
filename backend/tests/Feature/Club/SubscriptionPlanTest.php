<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionPlanTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Sub Plan Club',
            'slug' => 'sub-plan-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
            'subscription_plans_enabled' => true,
        ]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager-sub@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);
    }

    public function test_only_one_plan_can_be_marked_as_popular(): void
    {
        // Create plan1 as popular
        $plan1 = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Plan One',
            'duration_months' => 1,
            'price' => 100.00,
            'is_popular' => true,
            'is_active' => true,
            'display_order' => 0,
        ]);

        // Create plan2 as not popular
        $plan2 = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Plan Two',
            'duration_months' => 3,
            'price' => 250.00,
            'is_popular' => false,
            'is_active' => true,
            'display_order' => 1,
        ]);

        // Verify plan1 is popular
        $this->assertTrue($plan1->fresh()->is_popular);

        // Mark plan2 as popular via API
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/subscription-plans/{$plan2->id}", [
                'is_popular' => true,
            ]);

        $response->assertOk();

        // plan1 should no longer be popular
        $this->assertFalse($plan1->fresh()->is_popular);
        // plan2 should now be popular
        $this->assertTrue($plan2->fresh()->is_popular);
    }

    public function test_disabled_feature_returns_403_on_plan_endpoints(): void
    {
        // Create a separate club with subscription_plans disabled
        $club = Club::create([
            'name' => 'No Plans Club',
            'slug' => 'no-plans-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create([
            'club_id' => $club->id,
            'subscription_plans_enabled' => false,
        ]);

        $manager = User::create([
            'name' => 'Manager No Plans',
            'email' => 'manager-noplans@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

        $response = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/club/subscription-plans');

        $response->assertStatus(403);
        $response->assertJsonFragment(['feature' => 'subscription_plans']);
    }
}
