<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClubManagerApiTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Manager Club',
            'slug' => 'manager-club',
            'is_active' => true,
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
        ]);

        $this->manager = User::create([
            'name' => 'Club Manager',
            'email' => 'manager@managerclub.com',
            'password' => 'password123',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────

    private function authHeader(): array
    {
        $token = $this->manager->createToken('test')->plainTextToken;

        return ['Authorization' => 'Bearer '.$token];
    }

    // ── Dashboard ────────────────────────────────────────────

    public function test_club_dashboard_returns_expected_structure(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/club/dashboard');

        $response->assertOk()
            ->assertJsonStructure([
                'swimmers_count',
                'coaches_count',
                'groups_count',
                'upcoming_sessions',
                'attendance_rate_7d',
                'sessions_count',
                'top_swimmers',
            ]);
    }

    // ── Settings ─────────────────────────────────────────────

    public function test_club_settings_returns_club_data(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/club/settings');

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Manager Club'])
            ->assertJsonFragment(['slug' => 'manager-club']);
    }

    // ── Features ─────────────────────────────────────────────

    public function test_club_features_returns_feature_flags(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/club/features');

        $response->assertOk()
            ->assertJsonStructure(['leaderboard_enabled']);
    }

    // ── Coaches (paginated) ──────────────────────────────────

    public function test_coach_index_returns_paginated_data(): void
    {
        $coachUser = User::create([
            'name' => 'Coach Test',
            'email' => 'coachtest@managerclub.com',
            'password' => 'password123',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        CoachProfile::create([
            'club_id' => $this->club->id,
            'user_id' => $coachUser->id,
            'bio' => 'Test bio',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/club/coaches');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'last_page',
                'total',
            ]);
    }

    // ── Swimmers (paginated) ─────────────────────────────────

    public function test_swimmer_index_returns_paginated_data(): void
    {
        SwimmerProfile::create([
            'club_id' => $this->club->id,
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'level' => 'beginner',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/club/swimmers');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'last_page',
                'total',
            ]);
    }

    // ── Groups (paginated) ───────────────────────────────────

    public function test_group_index_returns_paginated_data(): void
    {
        Group::create([
            'club_id' => $this->club->id,
            'name' => 'Beginners Group',
            'coach_user_id' => $this->manager->id,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/club/groups');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'last_page',
                'total',
            ]);
    }

    // ── Sessions (paginated) ─────────────────────────────────

    public function test_session_index_returns_data(): void
    {
        $group = Group::create([
            'club_id' => $this->club->id,
            'name' => 'Session Test Group',
            'coach_user_id' => $this->manager->id,
        ]);

        TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $group->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'location' => 'Main Pool',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/v1/club/sessions');

        $response->assertOk()
            ->assertJsonStructure(['data']);
    }
}
