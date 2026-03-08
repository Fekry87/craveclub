<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagementCrudTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $manager;
    private CoachProfile $coachProfile;
    private User $coachUser;
    private SwimmerProfile $swimmerProfile;
    private Group $group;
    private TrainingSession $session;
    private ClubFeature $features;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'CRUD Test Club',
            'slug' => 'crud-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        $this->features = ClubFeature::create([
            'club_id' => $this->club->id,
            'subscription_plans_enabled' => true,
        ]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@crudtest.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@crudtest.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        $this->coachProfile = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $this->coachUser->id,
            'bio' => 'Test bio',
        ]);

        $this->swimmerProfile = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'level' => 'beginner',
        ]);

        $this->group = Group::create([
            'club_id' => $this->club->id,
            'name' => 'Test Group',
            'coach_user_id' => $this->coachUser->id,
        ]);

        $this->session = TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'coach_user_id' => $this->coachUser->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'Scheduled',
        ]);
    }

    // ── Coach Management ──────────────────────────────────

    public function test_manager_can_create_coach(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/coaches', [
                'name' => 'New Coach',
                'email' => 'newcoach@crudtest.com',
                'password' => 'Password123!',
                'bio' => 'Bio text',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'newcoach@crudtest.com', 'role' => UserRole::COACH->value]);
    }

    public function test_coach_create_validates_required_fields(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/coaches', []);

        $response->assertStatus(422);
    }

    public function test_manager_can_update_coach(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/coaches/{$this->coachProfile->id}", [
                'bio' => 'Updated bio',
            ]);

        $response->assertOk();
    }

    public function test_manager_can_delete_coach(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/coaches/{$this->coachProfile->id}");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Coach deleted']);
    }

    // ── Swimmer Management ────────────────────────────────

    public function test_manager_can_create_swimmer(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/swimmers', [
                'first_name' => 'New',
                'last_name' => 'Swimmer',
                'level' => 'beginner',
            ]);

        $response->assertStatus(201);
    }

    public function test_manager_can_update_swimmer(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/swimmers/{$this->swimmerProfile->id}", [
                'first_name' => 'Updated',
            ]);

        $response->assertOk();
    }

    public function test_manager_can_delete_swimmer(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/swimmers/{$this->swimmerProfile->id}");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Swimmer deleted']);
    }

    // ── Group Management ──────────────────────────────────

    public function test_manager_can_create_group(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/groups', [
                'name' => 'New Group',
                'coach_user_id' => $this->coachUser->id,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('groups', ['name' => 'New Group']);
    }

    public function test_group_create_validates_required_fields(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/groups', []);

        $response->assertStatus(422);
    }

    public function test_manager_can_update_group(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/groups/{$this->group->id}", [
                'name' => 'Updated Group',
            ]);

        $response->assertOk();
    }

    public function test_manager_can_delete_group(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/groups/{$this->group->id}");

        $response->assertOk();
    }

    public function test_manager_can_set_group_members(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson("/api/v1/club/groups/{$this->group->id}/members", [
                'swimmer_ids' => [$this->swimmerProfile->id],
            ]);

        $response->assertOk();
    }

    // ── Session Management ────────────────────────────────

    public function test_manager_can_create_session(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/sessions', [
                'group_id' => $this->group->id,
                'date' => now()->addDays(3)->toDateString(),
                'start_time' => '14:00',
                'end_time' => '15:00',
            ]);

        $response->assertStatus(201);
    }

    public function test_session_create_validates_required_fields(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/sessions', []);

        $response->assertStatus(422);
    }

    public function test_manager_can_update_session(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/sessions/{$this->session->id}", [
                'location' => 'Updated Pool',
            ]);

        $response->assertOk();
    }

    public function test_manager_can_delete_session(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/sessions/{$this->session->id}");

        $response->assertOk();
    }

    // ── Subscription Plans ────────────────────────────────

    public function test_manager_can_create_plan(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/subscription-plans', [
                'name' => 'Monthly',
                'duration_months' => 1,
                'price' => 99.99,
                'is_active' => true,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('subscription_plans', ['name' => 'Monthly', 'club_id' => $this->club->id]);
    }

    public function test_manager_can_update_plan(): void
    {
        $plan = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Old Plan',
            'duration_months' => 1,
            'price' => 50.00,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/subscription-plans/{$plan->id}", [
                'name' => 'Updated Plan',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('subscription_plans', ['id' => $plan->id, 'name' => 'Updated Plan']);
    }

    public function test_manager_can_toggle_plan_active(): void
    {
        $plan = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Toggle Plan',
            'duration_months' => 1,
            'price' => 50.00,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/subscription-plans/{$plan->id}/toggle-active");

        $response->assertOk();
    }

    public function test_manager_can_reorder_plans(): void
    {
        $plan1 = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Plan A',
            'duration_months' => 1,
            'price' => 50.00,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $plan2 = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Plan B',
            'duration_months' => 3,
            'price' => 120.00,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/subscription-plans/reorder', [
                'ordered_ids' => [$plan2->id, $plan1->id],
            ]);

        $response->assertOk();
    }
}
