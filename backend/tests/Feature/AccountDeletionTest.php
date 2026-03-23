<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $swimmer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Deletion Test Club',
            'slug' => 'deletion-test-'.uniqid(),
            'is_active' => true,
        ]);

        $this->swimmer = User::create([
            'name' => 'Test Swimmer',
            'email' => 'swimmer-delete-'.uniqid().'@test.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
    }

    public function test_user_can_request_account_deletion(): void
    {
        $response = $this->actingAs($this->swimmer)
            ->postJson('/api/v1/account/delete');

        $response->assertOk()
            ->assertJsonStructure(['message', 'scheduled_purge_at', 'days_remaining'])
            ->assertJson(['days_remaining' => 30]);

        // User should be soft-deleted
        $this->assertSoftDeleted('users', ['id' => $this->swimmer->id]);

        // Deletion columns should be set
        $user = User::withTrashed()->find($this->swimmer->id);
        $this->assertNotNull($user->deletion_requested_at);
        $this->assertNotNull($user->scheduled_purge_at);
    }

    public function test_user_tokens_revoked_after_deletion_request(): void
    {
        $token = $this->swimmer->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/account/delete')
            ->assertOk();

        // All tokens should be deleted
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_duplicate_deletion_request_returns_409(): void
    {
        // Create a user that is already marked as pending deletion but NOT soft-deleted yet
        $anotherSwimmer = User::create([
            'name' => 'Another Swimmer',
            'email' => 'another-'.uniqid().'@test.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
            'deletion_requested_at' => now(),
            'scheduled_purge_at' => now()->addDays(30),
        ]);

        $response = $this->actingAs($anotherSwimmer)
            ->postJson('/api/v1/account/delete');

        $response->assertStatus(409);
    }

    public function test_login_blocked_for_pending_deletion_user(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now(),
            'scheduled_purge_at' => now()->addDays(30),
        ]);
        $this->swimmer->delete();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $this->swimmer->email,
            'password' => 'Password123!',
        ]);

        $response->assertStatus(403)
            ->assertJson(['status' => 'pending_deletion']);
    }

    public function test_user_can_reactivate_within_30_days(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now(),
            'scheduled_purge_at' => now()->addDays(30),
        ]);
        $this->swimmer->delete();

        $response = $this->postJson('/api/v1/account/reactivate', [
            'email' => $this->swimmer->email,
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'token', 'user'])
            ->assertJson(['message' => 'Account reactivated successfully.']);

        // User should be restored
        $user = User::find($this->swimmer->id);
        $this->assertNotNull($user);
        $this->assertNull($user->deletion_requested_at);
        $this->assertNull($user->scheduled_purge_at);
        $this->assertNull($user->deleted_at);
    }

    public function test_reactivation_fails_after_30_days(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now()->subDays(31),
            'scheduled_purge_at' => now()->subDay(),
        ]);
        $this->swimmer->delete();

        $response = $this->postJson('/api/v1/account/reactivate', [
            'email' => $this->swimmer->email,
            'password' => 'Password123!',
        ]);

        $response->assertStatus(410);
    }

    public function test_reactivation_fails_with_wrong_password(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now(),
            'scheduled_purge_at' => now()->addDays(30),
        ]);
        $this->swimmer->delete();

        $response = $this->postJson('/api/v1/account/reactivate', [
            'email' => $this->swimmer->email,
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401);
    }

    public function test_deletion_status_returns_pending(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now(),
            'scheduled_purge_at' => now()->addDays(25),
        ]);
        $this->swimmer->delete();

        $response = $this->getJson('/api/v1/account/deletion-status?email='.$this->swimmer->email);

        $response->assertOk()
            ->assertJson(['status' => 'pending_deletion'])
            ->assertJsonStructure(['days_remaining', 'scheduled_purge_at']);
    }

    public function test_deletion_status_returns_active_for_normal_user(): void
    {
        $response = $this->getJson('/api/v1/account/deletion-status?email='.$this->swimmer->email);

        $response->assertOk()
            ->assertJson(['status' => 'active']);
    }

    public function test_purge_command_deletes_expired_accounts(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now()->subDays(31),
            'scheduled_purge_at' => now()->subDay(),
        ]);
        $this->swimmer->delete();

        $this->artisan('accounts:purge')
            ->assertExitCode(0)
            ->expectsOutputToContain('Purged');

        // User should be permanently deleted
        $this->assertNull(User::withTrashed()->find($this->swimmer->id));
    }

    public function test_purge_command_dry_run_does_not_delete(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now()->subDays(31),
            'scheduled_purge_at' => now()->subDay(),
        ]);
        $this->swimmer->delete();

        $this->artisan('accounts:purge', ['--dry-run' => true])
            ->assertExitCode(0)
            ->expectsOutputToContain('DRY RUN');

        // User should still exist (soft-deleted)
        $this->assertNotNull(User::withTrashed()->find($this->swimmer->id));
    }

    public function test_purge_command_skips_non_expired_accounts(): void
    {
        $this->swimmer->update([
            'deletion_requested_at' => now(),
            'scheduled_purge_at' => now()->addDays(29),
        ]);
        $this->swimmer->delete();

        $this->artisan('accounts:purge')
            ->assertExitCode(0)
            ->expectsOutputToContain('No accounts to purge');

        // User should still exist
        $this->assertNotNull(User::withTrashed()->find($this->swimmer->id));
    }
}
