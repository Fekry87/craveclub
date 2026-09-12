<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\SwimmerProfile;
use App\Models\User;
use App\Support\SwimmerLogin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Two accounts can share a phone number: approval appends `_1`, `_2` … when the
 * same phone registers again. Phone login reaches only the first one, so a reset
 * on any other has to tell the manager to relay the email instead.
 */
class SwimmerLoginResolutionTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();
        $this->club = Club::create([
            'name' => 'Dup Club',
            'slug' => 'dup-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);
    }

    private function makeSwimmer(string $email, string $password = 'password'): SwimmerProfile
    {
        $user = User::create([
            'name' => 'Ali Hassan',
            'email' => $email,
            'password' => $password,
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        return SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $user->id,
            'first_name' => 'Ali',
            'last_name' => 'Hassan',
        ]);
    }

    private function managerToken(): string
    {
        User::create([
            'name' => 'Manager',
            'email' => 'manager@dup.test',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        return $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@dup.test',
            'password' => 'password',
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->json('token');
    }

    public function test_phone_resolves_to_the_oldest_account(): void
    {
        $first = $this->makeSwimmer(SwimmerLogin::email($this->club->id, '01000000000'));
        $this->makeSwimmer(SwimmerLogin::email($this->club->id, '01000000000', 1));

        $resolved = SwimmerLogin::resolve($this->club->id, '0100 000 0000');

        $this->assertSame($first->user_id, $resolved?->id);
    }

    public function test_phone_digits_are_recovered_from_a_generated_address(): void
    {
        $this->assertSame(
            '01000000000',
            SwimmerLogin::phoneFromEmail(SwimmerLogin::email($this->club->id, '01000000000', 2)),
        );
        $this->assertNull(SwimmerLogin::phoneFromEmail('coach@club.com'));
    }

    public function test_reset_reports_phone_login_for_the_only_account(): void
    {
        $swimmer = $this->makeSwimmer(SwimmerLogin::email($this->club->id, '01000000000'));

        $response = $this->postJson("/api/v1/club/swimmers/{$swimmer->id}/reset-password", [], [
            'Authorization' => 'Bearer '.$this->managerToken(),
            'X-Club-Slug' => $this->club->slug,
        ]);

        $response->assertOk()
            ->assertJsonPath('credentials.phone_login_works', true)
            ->assertJsonPath('credentials.phone', '01000000000');
    }

    public function test_reset_warns_when_the_phone_belongs_to_an_older_account(): void
    {
        $this->makeSwimmer(SwimmerLogin::email($this->club->id, '01000000000'));
        $duplicate = $this->makeSwimmer(SwimmerLogin::email($this->club->id, '01000000000', 1));

        $response = $this->postJson("/api/v1/club/swimmers/{$duplicate->id}/reset-password", [], [
            'Authorization' => 'Bearer '.$this->managerToken(),
            'X-Club-Slug' => $this->club->slug,
        ]);

        $response->assertOk()
            ->assertJsonPath('credentials.phone_login_works', false)
            ->assertJsonPath('credentials.phone', null);

        // The password really was set — it just cannot be reached by phone.
        $temp = $response->json('credentials.temp_password');

        $this->postJson('/api/v1/auth/login', [
            'email' => $response->json('credentials.email'),
            'password' => $temp,
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'email' => '01000000000',
            'password' => $temp,
            'club_slug' => $this->club->slug,
        ], ['X-Club-Slug' => $this->club->slug])->assertStatus(401);
    }

    public function test_underscore_in_the_pattern_does_not_match_a_different_phone(): void
    {
        $this->makeSwimmer(SwimmerLogin::email($this->club->id, '010000000001'));

        $this->assertNull(SwimmerLogin::resolve($this->club->id, '01000000000'));
    }
}
