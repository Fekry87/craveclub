<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Existing Club',
            'slug' => 'existing-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create(['club_id' => $this->club->id]);

        $this->admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@craveclubs.com',
            'password' => 'password',
            'role' => UserRole::PLATFORM_ADMIN,
        ]);
    }

    public function test_platform_metrics_returns_counts(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/platform/metrics');

        $response->assertOk()
            ->assertJsonStructure(['total_clubs', 'total_users', 'total_managers', 'recent_clubs']);
    }

    public function test_platform_metrics_requires_admin(): void
    {
        $manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $response = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/platform/metrics');

        $response->assertStatus(403);
    }

    public function test_platform_club_index_returns_paginated(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/platform/clubs');

        $response->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'total']);
    }

    public function test_platform_club_store_creates_club_and_manager(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/platform/clubs', [
                'name' => 'New Club',
                'slug' => 'new-club',
                'manager_name' => 'New Manager',
                'manager_email' => 'newmanager@test.com',
                'manager_password' => 'Password123!',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['club', 'manager']);

        $this->assertDatabaseHas('clubs', ['name' => 'New Club']);
        $this->assertDatabaseHas('users', ['email' => 'newmanager@test.com', 'role' => UserRole::CLUB_MANAGER->value]);
    }

    public function test_platform_club_update_modifies_club(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/platform/clubs/{$this->club->id}", [
                'name' => 'Updated Club Name',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('clubs', ['id' => $this->club->id, 'name' => 'Updated Club Name']);
    }

    public function test_platform_club_destroy_soft_deletes(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/platform/clubs/{$this->club->id}");

        $response->assertOk();
        $this->assertSoftDeleted('clubs', ['id' => $this->club->id]);
    }
}
