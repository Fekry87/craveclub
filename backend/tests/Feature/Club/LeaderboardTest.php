<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    private function createClubWithManager(string $suffix, bool $leaderboardEnabled = true): array
    {
        $club = Club::create([
            'name' => "Club {$suffix}",
            'slug' => "club-{$suffix}",
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create([
            'club_id' => $club->id,
            'leaderboard_enabled' => $leaderboardEnabled,
        ]);

        $manager = User::create([
            'name' => "Manager {$suffix}",
            'email' => "manager-{$suffix}@test.com",
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

        return [$club, $manager];
    }

    public function test_leaderboard_settings_returns_data(): void
    {
        [$club, $manager] = $this->createClubWithManager('lb-settings');

        $response = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/club/leaderboard/settings');

        $response->assertOk();
        $response->assertJsonStructure(['settings', 'tiers']);
    }

    public function test_leaderboard_overview_returns_data(): void
    {
        [$club, $manager] = $this->createClubWithManager('lb-overview');

        $response = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/club/leaderboard/overview');

        $response->assertOk();
        $response->assertJsonStructure(['total_swimmers', 'top_swimmers']);
    }

    public function test_leaderboard_only_returns_swimmers_from_current_club(): void
    {
        // Club A with 2 swimmers
        [$clubA, $managerA] = $this->createClubWithManager('leaderboard-a');

        SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $clubA->id,
            'first_name' => 'Swimmer',
            'last_name' => 'A1',
            'level' => 'beginner',
        ]);
        SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $clubA->id,
            'first_name' => 'Swimmer',
            'last_name' => 'A2',
            'level' => 'beginner',
        ]);

        // Club B with 3 swimmers
        [$clubB, $managerB] = $this->createClubWithManager('leaderboard-b');

        SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $clubB->id,
            'first_name' => 'Swimmer',
            'last_name' => 'B1',
            'level' => 'beginner',
        ]);
        SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $clubB->id,
            'first_name' => 'Swimmer',
            'last_name' => 'B2',
            'level' => 'beginner',
        ]);
        SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $clubB->id,
            'first_name' => 'Swimmer',
            'last_name' => 'B3',
            'level' => 'beginner',
        ]);

        // Query leaderboard as managerA — should only see 2 swimmers
        $response = $this->actingAs($managerA, 'sanctum')
            ->getJson('/api/v1/club/leaderboard/overview');

        $response->assertOk();
        $response->assertJson(['total_swimmers' => 2]);
    }
}
