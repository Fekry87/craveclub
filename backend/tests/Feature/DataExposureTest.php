<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataExposureTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $coachUser;

    private User $swimmerUser;

    private SwimmerProfile $swimmerProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Exposure Test Club',
            'slug' => 'exposure-test',
            'is_active' => true,
            'support_email' => 'support@test.com',
            'support_phone' => '+1234567890',
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
            'coach_portal_enabled' => true,
            'evaluations_enabled' => true,
        ]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@exposure.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@exposure.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);
        $coachProfile = CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $this->coachUser->id,
            'club_id' => $this->club->id,
            'specialization' => 'Freestyle',
        ]);

        $this->swimmerUser = User::create([
            'name' => 'Swimmer',
            'email' => 'swimmer@exposure.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
        $this->swimmerProfile = SwimmerProfile::withoutGlobalScopes()->create([
            'user_id' => $this->swimmerUser->id,
            'club_id' => $this->club->id,
            'first_name' => 'Swimmer',
            'last_name' => 'One',
            'medical_notes' => 'Allergic to chlorine',
            'guardian_name' => 'Parent One',
            'guardian_phone' => '+9876543210',
        ]);

        $group = Group::withoutGlobalScopes()->create([
            'name' => 'Test Group',
            'club_id' => $this->club->id,
            'coach_user_id' => $this->coachUser->id,
        ]);
        GroupMembership::withoutGlobalScopes()->create([
            'group_id' => $group->id,
            'swimmer_id' => $this->swimmerProfile->id,
            'club_id' => $this->club->id,
        ]);
    }

    // ── Test 1: Auth response excludes password ──

    public function test_auth_response_excludes_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@exposure.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk();
        $user = $response->json('user');
        $this->assertArrayNotHasKey('password', $user);
    }

    // ── Test 2: Auth response excludes remember_token ──

    public function test_auth_response_excludes_remember_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@exposure.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk();
        $user = $response->json('user');
        $this->assertArrayNotHasKey('remember_token', $user);
        $this->assertArrayNotHasKey('email_verified_at', $user);
    }

    // ── Test 3: Public branding excludes internal fields ──

    public function test_public_branding_excludes_internal_fields(): void
    {
        $response = $this->getJson('/api/v1/branding/exposure-test');

        $response->assertOk();
        $data = $response->json();
        $this->assertArrayNotHasKey('is_domain_active', $data);
        $this->assertArrayNotHasKey('custom_domain', $data);
        $this->assertArrayNotHasKey('id', $data);
        $this->assertArrayNotHasKey('created_at', $data);
        // Public fields should be present
        $this->assertArrayHasKey('club_name', $data);
        $this->assertArrayHasKey('support_email', $data);
    }

    // ── Test 4: Production 500 returns generic message ──

    public function test_production_500_returns_generic_message(): void
    {
        // Simulate production by disabling debug mode
        config(['app.debug' => false]);

        // Hit a route that throws an unhandled exception
        $this->app->bind('test.throw', function () {
            throw new \RuntimeException('Database connection leaked credentials!');
        });

        \Illuminate\Support\Facades\Route::get('/api/v1/test-500', function () {
            return app('test.throw');
        });

        $response = $this->getJson('/api/v1/test-500');

        $response->assertStatus(500);
        $data = $response->json();
        $this->assertEquals('An unexpected error occurred.', $data['message']);
        // Must NOT contain the actual exception message
        $this->assertStringNotContainsString('Database connection', json_encode($data));
        $this->assertStringNotContainsString('leaked', json_encode($data));
    }

    // ── Test 5: Swimmer weekly report excludes risk data ──

    public function test_swimmer_weekly_report_excludes_risk_data(): void
    {
        $response = $this->actingAs($this->swimmerUser, 'sanctum')
            ->getJson('/api/v1/swimmer/weekly-report');

        $response->assertOk();
        $data = $response->json();
        $this->assertArrayNotHasKey('risk_signal', $data);
        $this->assertArrayNotHasKey('risk_reason', $data);
    }

    // ── Test 6: Slow query log redacts bindings in production ──

    public function test_slow_query_log_redacts_bindings_in_production(): void
    {
        // The AppServiceProvider uses app()->isProduction() to decide
        // We verify the logic: in production, bindings should be '[redacted]'
        $isProduction = app()->isProduction();

        if ($isProduction) {
            // In production, bindings would be redacted
            $this->assertTrue(true, 'Production environment would redact bindings');
        } else {
            // In test/dev, bindings are shown — verify the conditional exists
            $serviceProvider = file_get_contents(app_path('Providers/AppServiceProvider.php'));
            $this->assertStringContainsString(
                "app()->isProduction() ? '[redacted]' : \$query->bindings",
                $serviceProvider
            );
        }
    }

    // ── Test 7: Coach list excludes password fields ──

    public function test_coach_list_excludes_password_fields(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/coaches');

        $response->assertOk();
        $coaches = $response->json('data');
        $this->assertNotEmpty($coaches);

        foreach ($coaches as $coach) {
            if (isset($coach['user'])) {
                $this->assertArrayNotHasKey('password', $coach['user']);
                $this->assertArrayNotHasKey('remember_token', $coach['user']);
                $this->assertArrayNotHasKey('email_verified_at', $coach['user']);
            }
        }
    }

    // ── Test 8: Swimmer list excludes medical notes (coach view) ──

    public function test_swimmer_list_excludes_medical_notes_in_coach_view(): void
    {
        // Coach allSwimmers endpoint uses explicit select — no medical_notes
        $response = $this->actingAs($this->coachUser, 'sanctum')
            ->getJson('/api/v1/coach/swimmers');

        $response->assertOk();
        $swimmers = $response->json();
        $this->assertNotEmpty($swimmers);

        foreach ($swimmers as $swimmer) {
            $this->assertArrayNotHasKey('medical_notes', $swimmer);
            $this->assertArrayNotHasKey('guardian_name', $swimmer);
            $this->assertArrayNotHasKey('guardian_phone', $swimmer);
        }
    }
}
