<?php

namespace Tests\Feature\Security;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\PushToken;
use App\Models\Registration;
use App\Models\SportModule;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Regression cover for the backend security audit.
 *
 * Each test names the finding it locks down so a future refactor that reopens the
 * hole fails here rather than in production.
 */
class HardeningAuditTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $swimmer;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $this->club = Club::create([
            'name' => 'Hardening Club',
            'slug' => 'hardening-club',
            'is_active' => true,
            'branding_tier' => 'shared',
        ]);

        ClubFeature::create(['club_id' => $this->club->id]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@hardening.test',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->swimmer = User::create([
            'name' => 'Swimmer',
            'email' => 'swimmer@hardening.test',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
    }

    // ── Finding 3: /auth/login must not leak deletion status without a password ──

    public function test_login_does_not_disclose_pending_deletion_without_the_password(): void
    {
        $this->actingAs($this->swimmer)->postJson('/api/v1/account/delete')->assertOk();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'swimmer@hardening.test',
            'password' => 'not-the-password',
        ]);

        $response->assertStatus(401);
        $this->assertSame('Invalid credentials', $response->json('message'));
        $response->assertJsonMissingPath('status');
        $response->assertJsonMissingPath('days_remaining');
    }

    public function test_login_still_reports_pending_deletion_to_the_account_owner(): void
    {
        $this->actingAs($this->swimmer)->postJson('/api/v1/account/delete')->assertOk();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'swimmer@hardening.test',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(403)
            ->assertJson(['status' => 'pending_deletion'])
            ->assertJsonPath('days_remaining', 30);
    }

    // ── Finding 1: the login lockout must degrade, not 500, when the cache is down ──

    public function test_login_succeeds_when_the_cache_store_is_unavailable(): void
    {
        Cache::shouldReceive('get')->andThrow(new \RuntimeException('Connection refused'));
        Cache::shouldReceive('put')->andThrow(new \RuntimeException('Connection refused'));
        Cache::shouldReceive('forget')->andThrow(new \RuntimeException('Connection refused'));

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@hardening.test',
            'password' => 'Password123!',
        ]);

        $response->assertOk()->assertJsonStructure(['token', 'user']);
    }

    // ── Finding 2: /account/reactivate is a login endpoint and must be throttled ──

    public function test_reactivate_is_throttled(): void
    {
        $this->actingAs($this->swimmer)->postJson('/api/v1/account/delete')->assertOk();

        // Ten guesses are allowed per minute, the same budget as /auth/login.
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/account/reactivate', [
                'email' => 'swimmer@hardening.test',
                'password' => "guess-{$i}",
            ])->assertStatus(401);
        }

        $this->postJson('/api/v1/account/reactivate', [
            'email' => 'swimmer@hardening.test',
            'password' => 'guess-11',
        ])->assertStatus(429);
    }

    // ── Finding 6: a club manager must not self-upgrade tier or claim a domain ──

    public function test_club_manager_cannot_escalate_branding_tier_or_claim_a_domain(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson('/api/v1/club/branding', [
                'display_name' => 'Renamed By Manager',
                'branding_tier' => 'branded',
                'custom_domain' => 'squatted.example.com',
                'is_domain_active' => true,
            ]);

        $response->assertOk();

        $club = $this->club->fresh();
        $this->assertSame('Renamed By Manager', $club->display_name, 'legitimate branding edit should still apply');
        $this->assertSame('shared', $club->branding_tier);
        $this->assertNull($club->custom_domain);
    }

    // ── Finding 5: SVG uploads are stored XSS on a same-origin asset path ──

    public function test_branding_upload_rejects_svg(): void
    {
        Storage::fake('public');

        $svg = UploadedFile::fake()->createWithContent(
            'logo.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        );

        $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/branding/upload', ['file' => $svg, 'type' => 'logo'])
            ->assertStatus(422);
    }

    // ── Finding 10: the stored extension comes from content, not the client ──

    public function test_branding_upload_ignores_the_client_supplied_extension(): void
    {
        Storage::fake('public');

        // A genuine PNG that claims to be something else on the way in.
        $file = UploadedFile::fake()->image('logo.phtml.png')->mimeType('image/png');

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/branding/upload', ['file' => $file, 'type' => 'logo']);

        $response->assertOk();
        $this->assertStringEndsWith('.png', $response->json('url'));
    }

    // ── Finding 12: the metrics secret is compared in constant time ──

    public function test_metrics_rejects_a_wrong_key(): void
    {
        config(['app.metrics_secret_key' => 'super-secret-key']);

        $this->getJson('/api/v1/metrics', ['X-Metrics-Key' => 'super-secret-keZ'])
            ->assertStatus(403);

        $this->getJson('/api/v1/metrics', ['X-Metrics-Key' => 'super-secret-key'])
            ->assertOk();
    }

    public function test_metrics_rejects_a_missing_key(): void
    {
        config(['app.metrics_secret_key' => 'super-secret-key']);

        $this->getJson('/api/v1/metrics')->assertStatus(403);
    }

    // ── Finding 7: a soft-deleted swimmer email must not break approval ──

    public function test_approval_survives_a_soft_deleted_swimmer_email(): void
    {
        $registration = $this->makeRegistration('0551112222');

        // A prior swimmer already holds the deterministic email and was soft-deleted.
        $previous = User::create([
            'name' => 'Old Swimmer',
            'email' => 'swimmer_0551112222@club'.$this->club->id.'.craveclubs.local',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
        $previous->delete();

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", ['status' => 'approved']);

        $response->assertOk();
        $this->assertNotSame($previous->email, $response->json('swimmer.email'));
    }

    // ── Finding 8: a double approval must not create two swimmers ──

    public function test_approving_an_already_approved_registration_is_rejected(): void
    {
        $registration = $this->makeRegistration('0553334444');

        $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", ['status' => 'approved'])
            ->assertOk();

        $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", ['status' => 'approved'])
            ->assertStatus(422);

        $this->assertSame(1, User::where('club_id', $this->club->id)
            ->where('email', 'like', 'swimmer_0553334444%')
            ->count());
    }

    // ── Finding 11: sport module resolution follows the applicant's choice ──

    public function test_registration_is_filed_under_the_chosen_sport_module(): void
    {
        $swimming = SportModule::create(['name' => 'Swimming', 'slug' => 'swimming', 'is_active' => true, 'sort_order' => 1]);
        $tennis = SportModule::create(['name' => 'Tennis', 'slug' => 'tennis', 'is_active' => true, 'sort_order' => 2]);

        foreach ([$swimming, $tennis] as $module) {
            DB::table('club_sport_modules')->insert([
                'club_id' => $this->club->id,
                'sport_module_id' => $module->id,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->postJson('/api/v1/registrations', array_merge($this->registrationPayload(), [
            'phone' => '0555556666',
            'sport_ids' => ['tennis'],
        ]), ['X-Club-Slug' => $this->club->slug])->assertStatus(201);

        $this->assertSame(
            $tennis->id,
            Registration::where('phone', '0555556666')->value('sport_module_id'),
        );
    }

    public function test_registration_falls_back_to_the_first_module_in_sort_order(): void
    {
        $tennis = SportModule::create(['name' => 'Tennis', 'slug' => 'tennis', 'is_active' => true, 'sort_order' => 2]);
        $swimming = SportModule::create(['name' => 'Swimming', 'slug' => 'swimming', 'is_active' => true, 'sort_order' => 1]);

        // Inserted tennis-first so an unordered query would return tennis.
        foreach ([$tennis, $swimming] as $module) {
            DB::table('club_sport_modules')->insert([
                'club_id' => $this->club->id,
                'sport_module_id' => $module->id,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->postJson('/api/v1/registrations', array_merge($this->registrationPayload(), [
            'phone' => '0557778888',
            'sport_ids' => ['something-the-club-does-not-offer'],
        ]), ['X-Club-Slug' => $this->club->slug])->assertStatus(201);

        $this->assertSame(
            $swimming->id,
            Registration::where('phone', '0557778888')->value('sport_module_id'),
        );
    }

    // ── Finding 13: cross-user push token claims are capped and audited ──

    public function test_push_token_claims_from_other_users_are_capped(): void
    {
        $service = app(NotificationService::class);

        $victims = [];
        for ($i = 0; $i < 5; $i++) {
            $victim = User::create([
                'name' => "Victim {$i}",
                'email' => "victim{$i}@hardening.test",
                'password' => 'Password123!',
                'role' => UserRole::SWIMMER,
                'club_id' => $this->club->id,
            ]);
            PushToken::create([
                'user_id' => $victim->id,
                'token' => "ExponentPushToken[victim-{$i}]",
                'platform' => 'expo',
            ]);
            $victims[] = $victim;
        }

        // A genuine handover claims one token; three is already generous.
        for ($i = 0; $i < 3; $i++) {
            $service->registerPushToken($this->manager->id, "ExponentPushToken[victim-{$i}]");
        }

        $this->expectException(ValidationException::class);
        $service->registerPushToken($this->manager->id, 'ExponentPushToken[victim-3]');
    }

    public function test_a_users_own_token_re_registration_is_never_rate_limited(): void
    {
        $service = app(NotificationService::class);

        for ($i = 0; $i < 10; $i++) {
            $token = $service->registerPushToken($this->manager->id, 'ExponentPushToken[mine]');
            $this->assertSame($this->manager->id, $token->user_id);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private function registrationPayload(): array
    {
        $branch = Branch::firstOrCreate(
            ['club_id' => $this->club->id, 'name' => 'Main'],
            ['address' => '123 St', 'city' => 'Riyadh', 'capacity' => 50],
        );

        $plan = SubscriptionPlan::firstOrCreate(
            ['club_id' => $this->club->id, 'name' => 'Monthly'],
            ['price' => 100, 'duration_months' => 1, 'is_active' => true, 'sort_order' => 1],
        );

        $coachUser = User::firstOrCreate(
            ['email' => 'coach@hardening.test'],
            [
                'name' => 'Coach',
                'password' => 'Password123!',
                'role' => UserRole::COACH,
                'club_id' => $this->club->id,
            ],
        );

        $coach = CoachProfile::withoutGlobalScopes()->firstOrCreate(
            ['user_id' => $coachUser->id],
            ['club_id' => $this->club->id, 'specialization' => 'Freestyle'],
        );

        return [
            'full_name' => 'Test Applicant',
            'phone' => '0550000000',
            'gender' => 'male',
            'birth_date' => '2000-01-15',
            'prior_experience' => true,
            'sport_ids' => ['swimming'],
            'experience_level' => 'intermediate',
            'years_experience' => '3',
            'competed' => false,
            'primary_goal' => 'fitness',
            'weekly_frequency' => '3',
            'preferred_time' => 'morning',
            'payment_method' => 'cash',
            'branch_id' => $branch->id,
            'plan_id' => $plan->id,
            'coach_id' => $coach->id,
        ];
    }

    private function makeRegistration(string $phone): Registration
    {
        $payload = $this->registrationPayload();

        return Registration::create(array_merge($payload, [
            'club_id' => $this->club->id,
            'phone' => $phone,
            'reference_code' => 'REG-'.strtoupper(\Illuminate\Support\Str::random(8)),
            'total_amount' => 100,
            'status' => 'pending',
        ]));
    }
}
