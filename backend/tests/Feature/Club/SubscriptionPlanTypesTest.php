<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Plans belong to a training type (daily, two or three days a week, private);
 * the app shows one tab per type.
 */
class SubscriptionPlanTypesTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create(['name' => 'Types Club', 'slug' => 'types-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id, 'subscription_plans_enabled' => true]);
        $this->manager = User::create([
            'name' => 'Manager', 'email' => 'm@types.test', 'password' => 'password',
            'role' => UserRole::CLUB_MANAGER, 'club_id' => $this->club->id,
        ]);
    }

    private function plan(array $overrides = []): SubscriptionPlan
    {
        return SubscriptionPlan::create(array_merge([
            'club_id' => $this->club->id, 'name' => 'Monthly', 'training_type' => 'daily',
            'duration_months' => 1, 'price' => 100, 'is_active' => true, 'display_order' => 0,
        ], $overrides));
    }

    private function asManager()
    {
        return $this->actingAs($this->manager, 'sanctum');
    }

    public function test_creating_a_plan_requires_a_known_training_type(): void
    {
        $base = ['name' => 'Monthly', 'duration_months' => 1, 'price' => 100];

        $this->asManager()->postJson('/api/v1/club/subscription-plans', $base)
            ->assertStatus(422)->assertJsonValidationErrors('training_type');
        $this->asManager()->postJson('/api/v1/club/subscription-plans', $base + ['training_type' => 'weekly'])
            ->assertStatus(422)->assertJsonValidationErrors('training_type');

        $this->asManager()->postJson('/api/v1/club/subscription-plans', $base + ['training_type' => 'private'])
            ->assertCreated()->assertJsonPath('training_type', 'private');
    }

    public function test_the_type_can_be_changed_but_not_to_an_unknown_one(): void
    {
        $plan = $this->plan();

        $this->asManager()->putJson("/api/v1/club/subscription-plans/{$plan->id}", ['training_type' => 'nope'])
            ->assertStatus(422);
        $this->asManager()->putJson("/api/v1/club/subscription-plans/{$plan->id}", ['training_type' => 'two_days'])
            ->assertOk()->assertJsonPath('training_type', 'two_days');
    }

    public function test_one_popular_plan_per_training_type(): void
    {
        $daily = $this->plan(['is_popular' => true]);
        $private = $this->plan(['training_type' => 'private', 'is_popular' => true, 'display_order' => 1]);
        $dailyQuarterly = $this->plan(['name' => 'Quarterly', 'duration_months' => 3, 'display_order' => 2]);

        // Both types keep their own highlight.
        $this->assertTrue($daily->fresh()->is_popular);
        $this->assertTrue($private->fresh()->is_popular);

        $this->asManager()->putJson("/api/v1/club/subscription-plans/{$dailyQuarterly->id}", ['is_popular' => true])->assertOk();

        $this->assertFalse($daily->fresh()->is_popular, 'the other daily plan loses the highlight');
        $this->assertTrue($dailyQuarterly->fresh()->is_popular);
        $this->assertTrue($private->fresh()->is_popular, 'the private plan is untouched');

        // Moving a popular plan to another type clears that type's popular plan.
        $this->asManager()->putJson("/api/v1/club/subscription-plans/{$dailyQuarterly->id}", ['training_type' => 'private', 'is_popular' => true])->assertOk();
        $this->assertFalse($private->fresh()->is_popular);
    }

    public function test_the_app_gets_the_type_with_each_active_plan(): void
    {
        $this->plan(['training_type' => 'three_days']);
        $this->plan(['training_type' => 'private', 'is_active' => false, 'display_order' => 1]);

        $plans = $this->withHeaders(['X-Club-Slug' => $this->club->slug])
            ->getJson('/api/v1/subscription-plans')->assertOk()->json();

        $this->assertCount(1, $plans);
        $this->assertSame('three_days', $plans[0]['training_type']);
    }

    public function test_plans_without_a_type_default_to_daily(): void
    {
        $plan = SubscriptionPlan::create([
            'club_id' => $this->club->id, 'name' => 'Legacy', 'duration_months' => 1, 'price' => 100,
        ]);

        $this->assertSame('daily', $plan->fresh()->training_type);
    }

    public function test_registration_no_longer_needs_a_weekly_frequency(): void
    {
        // The plan's training type carries that answer now.
        $plan = $this->plan(['training_type' => 'three_days']);
        $branch = \App\Models\Branch::create(['club_id' => $this->club->id, 'name' => 'Main', 'address' => '1 St', 'city' => 'Cairo']);
        $coachUser = User::create(['name' => 'Coach', 'email' => 'c@types.test', 'password' => 'password', 'role' => UserRole::COACH, 'club_id' => $this->club->id]);
        $coach = \App\Models\CoachProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $coachUser->id, 'is_active' => true]);

        $this->withHeaders(['X-Club-Slug' => $this->club->slug])->postJson('/api/v1/registrations', [
            'full_name' => 'Laila Ahmed', 'phone' => '01012345678', 'gender' => 'female', 'birth_date' => '2000-01-15',
            'height_cm' => 170, 'weight_kg' => 60, 'fitness_level' => 'good', 'prior_experience' => false,
            'sport_ids' => ['1'], 'experience_level' => 'beginner', 'years_experience' => 'N/A', 'competed' => false,
            'primary_goal' => 'Get fit', 'branch_id' => $branch->id, 'plan_id' => $plan->id, 'coach_id' => $coach->id,
            'preferred_time' => 'flexible', 'payment_method' => 'cash', 'consent_given' => true,
        ])->assertCreated();
    }
}
