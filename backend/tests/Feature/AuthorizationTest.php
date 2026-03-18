<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $manager;
    private User $coachUserA;
    private User $coachUserB;
    private User $swimmer;
    private SwimmerProfile $swimmerProfile;
    private SwimmerProfile $swimmerProfileB;
    private Group $groupA;
    private Group $groupB;
    private TrainingSession $sessionA;
    private TrainingSession $sessionB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Auth Test Club',
            'slug' => 'auth-test',
            'is_active' => true,
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
            'coach_portal_enabled' => true,
            'evaluations_enabled' => true,
        ]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@authtest.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->coachUserA = User::create([
            'name' => 'Coach A',
            'email' => 'coach-a@authtest.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);
        CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $this->coachUserA->id,
            'club_id' => $this->club->id,
            'specialization' => 'Freestyle',
        ]);

        $this->coachUserB = User::create([
            'name' => 'Coach B',
            'email' => 'coach-b@authtest.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);
        CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $this->coachUserB->id,
            'club_id' => $this->club->id,
            'specialization' => 'Backstroke',
        ]);

        $swimmerUser = User::create([
            'name' => 'Swimmer',
            'email' => 'swimmer@authtest.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
        $this->swimmer = $swimmerUser;
        $this->swimmerProfile = SwimmerProfile::withoutGlobalScopes()->create([
            'user_id' => $swimmerUser->id,
            'club_id' => $this->club->id,
            'first_name' => 'Swimmer',
            'last_name' => 'One',
        ]);

        // Swimmer B — in Coach B's group only
        $swimmerUserB = User::create([
            'name' => 'Swimmer B',
            'email' => 'swimmer-b@authtest.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
        $this->swimmerProfileB = SwimmerProfile::withoutGlobalScopes()->create([
            'user_id' => $swimmerUserB->id,
            'club_id' => $this->club->id,
            'first_name' => 'Swimmer',
            'last_name' => 'B',
        ]);

        // Group A belongs to Coach A, with Swimmer One
        $this->groupA = Group::withoutGlobalScopes()->create([
            'name' => 'Group A',
            'club_id' => $this->club->id,
            'coach_user_id' => $this->coachUserA->id,
        ]);
        GroupMembership::withoutGlobalScopes()->create([
            'group_id' => $this->groupA->id,
            'swimmer_id' => $this->swimmerProfile->id,
            'club_id' => $this->club->id,
        ]);

        // Group B belongs to Coach B, with Swimmer B
        $this->groupB = Group::withoutGlobalScopes()->create([
            'name' => 'Group B',
            'club_id' => $this->club->id,
            'coach_user_id' => $this->coachUserB->id,
        ]);
        GroupMembership::withoutGlobalScopes()->create([
            'group_id' => $this->groupB->id,
            'swimmer_id' => $this->swimmerProfileB->id,
            'club_id' => $this->club->id,
        ]);

        $this->sessionA = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $this->groupA->id,
            'club_id' => $this->club->id,
            'title' => 'Session A',
            'date' => now()->addDay()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'Live',
            'type' => 'training',
        ]);

        $this->sessionB = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $this->groupB->id,
            'club_id' => $this->club->id,
            'title' => 'Session B',
            'date' => now()->addDay()->toDateString(),
            'start_time' => '11:00',
            'end_time' => '12:00',
            'status' => 'Live',
            'type' => 'training',
        ]);
    }

    // ── Test 1: Coach cannot access manager dashboard ──

    public function test_coach_cannot_access_manager_dashboard(): void
    {
        $response = $this->actingAs($this->coachUserA, 'sanctum')
            ->getJson('/api/v1/club/dashboard');

        $response->assertStatus(403);
    }

    // ── Test 2: Coach cannot access club analytics ──

    public function test_coach_cannot_access_club_analytics(): void
    {
        $response = $this->actingAs($this->coachUserA, 'sanctum')
            ->getJson('/api/v1/club/analytics');

        $response->assertStatus(403);
    }

    // ── Test 3: Swimmer cannot access coach endpoints ──

    public function test_swimmer_cannot_access_coach_endpoints(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/coach/sessions');

        $response->assertStatus(403);
    }

    // ── Test 4: Coach cannot complete other coach's session ──

    public function test_coach_cannot_complete_other_coach_session(): void
    {
        $response = $this->actingAs($this->coachUserA, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->sessionB->id}/complete", [
                'summary_notes' => 'Trying to complete another coach session',
            ]);

        $response->assertStatus(404);
    }

    // ── Test 5: Coach cannot evaluate swimmer outside own group ──

    public function test_coach_cannot_evaluate_swimmer_outside_group(): void
    {
        // Coach A tries to evaluate Swimmer B (who is in Coach B's group)
        $response = $this->actingAs($this->coachUserA, 'sanctum')
            ->postJson("/api/v1/coach/swimmers/{$this->swimmerProfileB->id}/evaluate", [
                'rating' => 5,
                'notes' => 'Should not be allowed',
            ]);

        $response->assertStatus(403);
    }

    // ── Test 6: Unauthenticated request returns 401 ──

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/v1/club/dashboard');

        $response->assertStatus(401);
    }

    // ── Test 7: Invalid token returns 401 ──

    public function test_invalid_token_returns_401(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer totally-invalid-token-12345',
        ])->getJson('/api/v1/club/dashboard');

        $response->assertStatus(401);
    }

    // ── Test 8: Expired token returns 401 ──

    public function test_expired_token_returns_401(): void
    {
        // Create a token and manually backdate it
        $token = $this->manager->createToken('auth-club', ['*'], now()->subDay());
        $plainToken = $token->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$plainToken}",
        ])->getJson('/api/v1/club/dashboard');

        $response->assertStatus(401);
    }
}
