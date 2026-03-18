<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchTest extends TestCase
{
    use RefreshDatabase;

    private function createClubWithManager(int $maxBranches): array
    {
        $club = Club::create([
            'name' => 'Branch Test Club',
            'slug' => 'branch-test-'.uniqid(),
            'is_active' => true,
            'max_branches' => $maxBranches,
        ]);

        ClubFeature::create(['club_id' => $club->id]);

        $manager = User::create([
            'name' => 'Manager',
            'email' => 'manager-branch-'.uniqid().'@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

        return [$club, $manager];
    }

    public function test_cannot_create_branch_beyond_max_limit(): void
    {
        [$club, $manager] = $this->createClubWithManager(1);

        // Create the first branch (should succeed)
        Branch::create([
            'club_id' => $club->id,
            'name' => 'Branch One',
            'address' => '123 First St',
            'city' => 'Test City',
            'is_active' => true,
        ]);

        // Try to create a second branch (should fail — limit is 1)
        $response = $this->actingAs($manager, 'sanctum')
            ->postJson('/api/v1/club/branches', [
                'name' => 'Branch Two',
                'address' => '456 Second St',
                'city' => 'Test City',
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['limit' => 1]);
    }

    public function test_can_create_branch_within_limit(): void
    {
        [$club, $manager] = $this->createClubWithManager(5);

        $response = $this->actingAs($manager, 'sanctum')
            ->postJson('/api/v1/club/branches', [
                'name' => 'Branch One',
                'address' => '123 First St',
                'city' => 'Test City',
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['name' => 'Branch One']);
    }
}
