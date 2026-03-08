<?php

namespace Tests\Feature\Swimmer;

use App\Enums\UserRole;
use App\Models\Attendance;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\DailyEvaluation;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SwimmerApiTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $swimmer;
    private SwimmerProfile $swimmerProfile;
    private Group $group;
    private ClubFeature $features;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Swimmer Test Club',
            'slug' => 'swimmer-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        $this->features = ClubFeature::create([
            'club_id' => $this->club->id,
            'leaderboard_enabled' => true,
            'evaluations_enabled' => true,
        ]);

        $this->swimmer = User::create([
            'name' => 'Test Swimmer',
            'email' => 'swimmer@test.com',
            'password' => 'password',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        $this->swimmerProfile = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $this->swimmer->id,
            'first_name' => 'Test',
            'last_name' => 'Swimmer',
            'level' => 'beginner',
        ]);

        $coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        $this->group = Group::create([
            'club_id' => $this->club->id,
            'name' => 'Test Group',
            'coach_user_id' => $coachUser->id,
        ]);

        GroupMembership::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'swimmer_id' => $this->swimmerProfile->id,
        ]);

        $session = TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'coach_user_id' => $coachUser->id,
            'date' => now()->subDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'Completed',
            'completed_at' => now()->subDay(),
        ]);

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmerProfile->id,
            'present' => true,
        ]);

        DailyEvaluation::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmerProfile->id,
            'rating' => 4,
        ]);

        // Leaderboard data
        LeaderboardSetting::forClub($this->club->id);
        LevelTier::seedForClub($this->club->id);
    }

    public function test_swimmer_dashboard_returns_expected_structure(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/dashboard');

        $response->assertOk()
            ->assertJsonStructure([
                'profile',
                'upcoming_sessions',
                'attendance_rate',
                'total_sessions',
                'sessions_attended',
                'recent_evaluations',
                'average_rating',
            ]);
    }

    public function test_swimmer_dashboard_requires_swimmer_role(): void
    {
        $manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $response = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/swimmer/dashboard');

        $response->assertStatus(403);
    }

    public function test_swimmer_sessions_returns_data(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/sessions');

        $response->assertOk()
            ->assertJsonStructure(['data', 'current_page']);
    }

    public function test_swimmer_stats_returns_computed_values(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'total_sessions',
                'sessions_attended',
                'attendance_rate',
                'average_rating',
                'best_rating',
                'monthly_ratings',
            ]);
    }

    public function test_swimmer_evaluations_returns_data(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/evaluations');

        $response->assertOk()
            ->assertJsonStructure(['data', 'current_page']);
    }

    public function test_swimmer_evaluations_requires_feature_flag(): void
    {
        $this->features->update(['evaluations_enabled' => false]);

        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/evaluations');

        $response->assertStatus(403);
    }

    public function test_swimmer_leaderboard_returns_data(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/leaderboard');

        $response->assertOk()
            ->assertJsonStructure([
                'top5',
                'all_rankings',
                'my_rank',
                'my_xp',
                'my_level',
                'levels',
            ]);
    }

    public function test_swimmer_leaderboard_requires_feature_flag(): void
    {
        $this->features->update(['leaderboard_enabled' => false]);

        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/leaderboard');

        $response->assertStatus(403);
    }
}
