<?php

namespace Tests\Feature\Coach;

use App\Enums\UserRole;
use App\Models\Attendance;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Cache\Repository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Support\ThrowingCacheStore;
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

    public function test_coach_cancels_a_scheduled_session_instead_of_deleting_it(): void
    {
        $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/cancel", ['reason' => 'Pool maintenance'])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Cancelled', 'cancellation_reason' => 'Pool maintenance']);

        $this->assertDatabaseHas('training_sessions', ['id' => $this->session->id, 'deleted_at' => null]);
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

    /**
     * A coach who presses save twice — or walks back into the live screen with the
     * browser back button — must get a 200, not a 404. The old lookup filtered on
     * status = Live, so every re-submit failed against a session that was in fact
     * finished, which read as "completing the session is broken".
     */
    public function test_completing_an_already_completed_session_is_idempotent(): void
    {
        $this->session->update(['status' => 'Live', 'started_at' => now()]);

        $payload = [
            'attendance' => [['swimmer_id' => $this->swimmer1->id, 'present' => true]],
            'summary_notes' => 'first pass',
        ];

        $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/complete", $payload)
            ->assertOk()
            ->assertJsonFragment(['already_completed' => false]);

        $firstCompletedAt = $this->session->fresh()->completed_at;

        $this->travel(2)->minutes();

        $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/complete", $payload)
            ->assertOk()
            ->assertJsonFragment(['already_completed' => true]);

        $this->session->refresh();
        $this->assertEquals('Completed', $this->session->status);
        // completed_at records when the session ended, not the last save.
        $this->assertEquals(
            $firstCompletedAt->toDateTimeString(),
            $this->session->completed_at->toDateTimeString(),
        );
    }

    /**
     * Everything after the status write — cache busting, XP recalculation,
     * notifications, the broadcast — is a side effect of a completion that is
     * already committed. A failure there must never be reported to the coach as a
     * failed completion, or they retry against a session that is no longer Live.
     */
    public function test_completion_survives_an_unreachable_cache(): void
    {
        $this->session->update(['status' => 'Live', 'started_at' => now()]);

        Cache::swap(new Repository(new ThrowingCacheStore));

        $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/complete", [
                'attendance' => [['swimmer_id' => $this->swimmer1->id, 'present' => true]],
                'evaluations' => [['swimmer_id' => $this->swimmer1->id, 'rating' => 4, 'notes' => 'good']],
                'group_evaluation' => ['rating' => 4, 'notes' => 'solid'],
                'summary_notes' => 'went well',
            ])
            ->assertOk();

        $this->session->refresh();
        $this->assertEquals('Completed', $this->session->status);
    }

    public function test_completing_a_session_that_was_never_started_explains_why(): void
    {
        $this->actingAs($this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/complete", [
                'attendance' => [['swimmer_id' => $this->swimmer1->id, 'present' => true]],
            ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'This session has not been started yet.']);

        $this->assertEquals('Scheduled', $this->session->fresh()->status);
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
