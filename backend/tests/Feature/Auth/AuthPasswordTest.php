<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthPasswordTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();
        $this->club = Club::create([
            'name' => 'Auth Test Club',
            'slug' => 'auth-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);
    }

    private function makeSwimmer(string $phoneDigits = '01000000000'): User
    {
        $user = User::create([
            'name' => 'Ali Hassan',
            'email' => 'swimmer_'.$phoneDigits.'@club'.$this->club->id.'.craveclubs.local',
            'password' => 'password',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $user->id,
            'first_name' => 'Ali',
            'last_name' => 'Hassan',
        ]);

        return $user;
    }

    public function test_swimmer_can_login_with_phone_number(): void
    {
        $this->makeSwimmer('01000000000');

        // Formatted phone (spaces) instead of the internal generated email
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => '0100 000 0000',
            'password' => 'password',
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug, 'X-Platform' => 'ios']);

        $response->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']]);
    }

    public function test_swimmer_can_still_login_with_generated_email(): void
    {
        $user = $this->makeSwimmer('01000000000');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug]);

        $response->assertOk();
    }

    public function test_phone_login_with_wrong_password_fails(): void
    {
        $this->makeSwimmer('01000000000');

        $this->postJson('/api/v1/auth/login', [
            'email' => '01000000000',
            'password' => 'wrong',
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->assertStatus(401);
    }

    public function test_change_password_rejects_wrong_current(): void
    {
        $user = $this->makeSwimmer();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'nope',
                'new_password' => 'NewPass123',
                'new_password_confirmation' => 'NewPass123',
            ])->assertStatus(422);
    }

    public function test_change_password_succeeds_and_new_password_works(): void
    {
        $user = $this->makeSwimmer();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'password',
                'new_password' => 'NewPass123',
                'new_password_confirmation' => 'NewPass123',
            ])->assertOk();

        // Old password no longer works, new one does
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->assertStatus(401);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'NewPass123',
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->assertOk();
    }

    public function test_change_password_rejects_same_password(): void
    {
        $user = $this->makeSwimmer();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'password',
                'new_password' => 'password',
                'new_password_confirmation' => 'password',
            ])->assertStatus(422);
    }

    public function test_manager_can_reset_swimmer_password(): void
    {
        $swimmerUser = $this->makeSwimmer();
        $swimmer = SwimmerProfile::withoutGlobalScopes()->where('user_id', $swimmerUser->id)->first();

        $manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@auth-test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $response = $this->actingAs($manager, 'sanctum')
            ->withHeaders(['X-Club-Slug' => $this->club->slug])
            ->postJson("/api/v1/club/swimmers/{$swimmer->id}/reset-password");

        $response->assertOk()->assertJsonStructure(['credentials' => ['email', 'temp_password']]);

        $temp = $response->json('credentials.temp_password');

        // Old password dead, new temp password works
        $this->postJson('/api/v1/auth/login', [
            'email' => $swimmerUser->email,
            'password' => 'password',
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->assertStatus(401);

        $this->postJson('/api/v1/auth/login', [
            'email' => $swimmerUser->email,
            'password' => $temp,
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->assertOk();
    }

    public function test_swimmer_cannot_reset_passwords(): void
    {
        $swimmerUser = $this->makeSwimmer();
        $swimmer = SwimmerProfile::withoutGlobalScopes()->where('user_id', $swimmerUser->id)->first();

        $this->actingAs($swimmerUser, 'sanctum')
            ->withHeaders(['X-Club-Slug' => $this->club->slug])
            ->postJson("/api/v1/club/swimmers/{$swimmer->id}/reset-password")
            ->assertStatus(403);
    }
}
