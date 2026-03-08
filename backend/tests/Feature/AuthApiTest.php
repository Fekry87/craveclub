<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Test Club',
            'slug' => 'test-club',
        ]);

        $this->manager = User::create([
            'name' => 'Club Manager',
            'email' => 'manager@test.com',
            'password' => bcrypt('password123'),
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);
    }

    public function test_login_with_valid_credentials(): void
    {
        $response = $this->withHeaders(['Origin' => 'http://localhost:5173'])
            ->postJson('/api/v1/auth/login', [
                'email' => 'manager@test.com',
                'password' => 'password123',
            ]);

        $response->assertOk()
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_login_with_invalid_credentials(): void
    {
        $response = $this->withHeaders(['Origin' => 'http://localhost:5173'])
            ->postJson('/api/v1/auth/login', [
                'email' => 'manager@test.com',
                'password' => 'wrongpassword',
            ]);

        $response->assertUnauthorized();
    }

    public function test_me_endpoint_requires_auth(): void
    {
        $response = $this->getJson('/api/v1/auth/me');
        $response->assertUnauthorized();
    }

    public function test_me_endpoint_returns_user(): void
    {
        $response = $this->actingAs($this->manager)
            ->getJson('/api/v1/auth/me');

        $response->assertOk()
            ->assertJsonPath('user.email', 'manager@test.com');
    }

    public function test_logout(): void
    {
        $response = $this->actingAs($this->manager)
            ->withHeaders(['Origin' => 'http://localhost:5173'])
            ->postJson('/api/v1/auth/logout');

        $response->assertOk();
    }

    public function test_club_dashboard_requires_manager_role(): void
    {
        $swimmer = User::create([
            'name' => 'Swimmer',
            'email' => 'swimmer@test.com',
            'password' => bcrypt('password123'),
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        $response = $this->actingAs($swimmer)
            ->getJson('/api/v1/club/dashboard');

        $response->assertForbidden();
    }

    public function test_club_dashboard_returns_data(): void
    {
        $response = $this->actingAs($this->manager)
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
}
