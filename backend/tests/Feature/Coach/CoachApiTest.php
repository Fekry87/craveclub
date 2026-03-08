<?php

namespace Tests\Feature\Coach;

use App\Enums\UserRole;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\DailyEvaluation;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoachApiTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $coach;
    private CoachProfile $coachProfile;
    private Group $group;
    private SwimmerProfile $swimmer1;
    private SwimmerProfile $swimmer2;
    private TrainingSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Coach Test Club',
            'slug' => 'coach-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
            'coach_portal_enabled' => true,
            'evaluations_enabled' => true,
        ]);

        $this->coach = User::create([
            'name' => 'Test Coach',
            'email' => 'coach@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        $this->coachProfile = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $this->coach->id,
            'bio' => 'Test bio',
            'specialization' => 'Swimming',
        ]);

        $this->group = Group::create([
            'club_id' => $this->club->id,
            'name' => 'Beginners',
            'coach_user_id' => $this->coach->id,
        ]);

        $this->swimmer1 = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'level' => 'beginner',
        ]);

        $this->swimmer2 = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'first_name' => 'Bob',
            'last_name' => 'Jones',
            'level' => 'intermediate',
        ]);

        GroupMembership::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'swimmer_id' => $this->swimmer1->id,
        ]);

        GroupMembership::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'swimmer_id' => $this->swimmer2->id,
        ]);

        $this->session = TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'coach_user_id' => $this->coach->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'Scheduled',
            'location' => 'Main Pool',
        ]);
    }

    // ── Dashboard ──────────────────────────────────────────

    public function test_coach_dashboard_returns_expected_structure(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/dashboard');

        $response->assertOk()
            ->assertJsonStructure([
                'groups',
                'today_sessions',
                'upcoming_sessions',
                'live_sessions',
                'stats' => ['total_groups', 'today_count', 'live_count', 'upcoming_count'],
            ]);
    }

    public function test_coach_dashboard_requires_coach_role(): void
    {
        $manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $response = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/coach/dashboard');

        $response->assertStatus(403);
    }

    // ── Groups CRUD ────────────────────────────────────────

    public function test_coach_groups_returns_paginated(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/groups');

        $response->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'last_page', 'total']);
    }

    public function test_coach_can_create_group(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->postJson('/api/v1/coach/groups', [
                'name' => 'Advanced Group',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('groups', ['name' => 'Advanced Group', 'coach_user_id' => $this->coach->id]);
    }

    public function test_coach_can_update_own_group(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->putJson("/api/v1/coach/groups/{$this->group->id}", [
                'name' => 'Updated Beginners',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('groups', ['id' => $this->group->id, 'name' => 'Updated Beginners']);
    }

    public function test_coach_can_delete_own_group(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->deleteJson("/api/v1/coach/groups/{$this->group->id}");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Group deleted']);
    }

    public function test_coach_cannot_update_other_coaches_group(): void
    {
        $otherCoach = User::create([
            'name' => 'Other Coach',
            'email' => 'other@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $otherCoach->id,
        ]);

        $otherGroup = Group::create([
            'club_id' => $this->club->id,
            'name' => 'Other Group',
            'coach_user_id' => $otherCoach->id,
        ]);

        $response = $this->actingAs($this->coach, 'sanctum')
            ->putJson("/api/v1/coach/groups/{$otherGroup->id}", [
                'name' => 'Hacked',
            ]);

        $response->assertStatus(404);
    }

    // ── Swimmers ───────────────────────────────────────────

    public function test_coach_all_swimmers(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/swimmers');

        $response->assertOk();
    }

    // ── Sessions CRUD ──────────────────────────────────────

    public function test_coach_can_create_session(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->postJson('/api/v1/coach/sessions', [
                'group_id' => $this->group->id,
                'date' => now()->addDays(2)->toDateString(),
                'start_time' => '14:00',
                'end_time' => '15:00',
            ]);

        $response->assertStatus(201);
    }

    public function test_coach_can_list_sessions(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/sessions');

        $response->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'status_counts']);
    }

    public function test_coach_can_show_session(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->getJson("/api/v1/coach/sessions/{$this->session->id}");

        $response->assertOk()
            ->assertJsonStructure(['effective_roster']);
    }

    public function test_coach_can_update_session(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->putJson("/api/v1/coach/sessions/{$this->session->id}", [
                'location' => 'Updated Pool',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('training_sessions', ['id' => $this->session->id, 'location' => 'Updated Pool']);
    }

    public function test_coach_can_delete_scheduled_session(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->deleteJson("/api/v1/coach/sessions/{$this->session->id}");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Session deleted']);
    }

    // ── Session Lifecycle ──────────────────────────────────

    public function test_coach_can_start_session(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/start");

        $response->assertOk();
        $this->session->refresh();
        $this->assertEquals('Live', $this->session->status);
        $this->assertNotNull($this->session->started_at);
    }

    public function test_coach_can_complete_session(): void
    {
        // Start session first
        $this->session->update(['status' => 'Live', 'started_at' => now()]);

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $this->session->id,
            'swimmer_id' => $this->swimmer1->id,
            'present' => true,
        ]);

        $response = $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/complete", [
                'attendance' => [
                    ['swimmer_id' => $this->swimmer1->id, 'present' => true],
                ],
            ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Session completed']);

        $this->session->refresh();
        $this->assertEquals('Completed', $this->session->status);
    }

    // ── Profile ────────────────────────────────────────────

    public function test_coach_profile_returns_data(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/profile');

        $response->assertOk()
            ->assertJsonStructure(['user', 'profile']);
    }

    public function test_coach_can_update_profile(): void
    {
        $response = $this->actingAs($this->coach, 'sanctum')
            ->putJson('/api/v1/coach/profile', [
                'bio' => 'Updated bio',
            ]);

        $response->assertOk();
    }

    // ── Evaluate Swimmer ───────────────────────────────────

    public function test_coach_can_evaluate_swimmer(): void
    {
        // Need a completed session first
        $completedSession = TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'coach_user_id' => $this->coach->id,
            'date' => now()->subDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'Completed',
            'completed_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/swimmers/{$this->swimmer1->id}/evaluate", [
                'rating' => 4,
                'notes' => 'Good progress',
            ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Evaluation saved']);
    }
}
