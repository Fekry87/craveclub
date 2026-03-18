<?php

namespace Tests\Feature\Security;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BruteForceTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset lockout counters between tests
        Cache::flush();

        $this->club = Club::create([
            'name' => 'Brute Club',
            'slug' => 'brute-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        $this->user = User::create([
            'name' => 'Brute User',
            'email' => 'brute@test.com',
            'password' => 'CorrectPassword1!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);
    }

    public function test_fifth_failed_login_returns_429(): void
    {
        $payload = [
            'email' => 'brute@test.com',
            'password' => 'WrongPassword',
        ];

        // Send 5 failed login attempts (fills the counter to 5)
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/v1/auth/login', $payload);
            $response->assertUnauthorized();
        }

        // 6th attempt should be rate-limited
        $response = $this->postJson('/api/v1/auth/login', $payload);
        $response->assertStatus(429);
    }

    public function test_successful_login_resets_attempt_counter(): void
    {
        $wrongPayload = [
            'email' => 'brute@test.com',
            'password' => 'WrongPassword',
        ];

        $correctPayload = [
            'email' => 'brute@test.com',
            'password' => 'CorrectPassword1!',
        ];

        // 3 failed attempts
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/auth/login', $wrongPayload)
                ->assertUnauthorized();
        }

        // 1 successful login — resets the counter
        $this->postJson('/api/v1/auth/login', $correctPayload)
            ->assertOk();

        // 3 more failed attempts — should NOT trigger lockout (counter was reset)
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/auth/login', $wrongPayload)
                ->assertUnauthorized();
        }

        // This 4th failed attempt after reset should still be allowed (total 4 < 5)
        $this->postJson('/api/v1/auth/login', $wrongPayload)
            ->assertUnauthorized();
    }

    public function test_lockout_message_is_informative(): void
    {
        $payload = [
            'email' => 'brute@test.com',
            'password' => 'WrongPassword',
        ];

        // Fill up the lockout counter
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', $payload);
        }

        // Verify the lockout response contains a meaningful message
        $response = $this->postJson('/api/v1/auth/login', $payload);

        $response->assertStatus(429)
            ->assertJsonStructure(['message'])
            ->assertJsonPath('message', 'Too many login attempts. Try again in 15 minutes.');
    }
}
