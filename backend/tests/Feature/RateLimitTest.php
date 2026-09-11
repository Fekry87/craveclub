<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\PushToken;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private CoachProfile $coach;

    private Branch $branch;

    private SubscriptionPlan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Rate Limit Club',
            'slug' => 'rate-limit',
            'is_active' => true,
        ]);

        ClubFeature::create(['club_id' => $this->club->id]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@ratelimit.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@ratelimit.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);
        $this->coach = CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $coachUser->id,
            'club_id' => $this->club->id,
            'specialization' => 'Freestyle',
        ]);

        $this->branch = Branch::create([
            'club_id' => $this->club->id,
            'name' => 'Main',
            'address' => '123 St',
            'city' => 'City',
            'capacity' => 50,
        ]);

        $this->plan = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Monthly',
            'price' => 100,
            'duration_months' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    private function validRegistration(): array
    {
        return [
            'full_name' => 'Test Swimmer',
            'phone' => '+1234567890',
            'gender' => 'male',
            'birth_date' => '2000-01-15',
            'height_cm' => 175,
            'weight_kg' => 70,
            'fitness_level' => 'good',
            'prior_experience' => true,
            'sport_ids' => ['swimming'],
            'experience_level' => 'intermediate',
            'years_experience' => '3',
            'competed' => false,
            'primary_goal' => 'fitness',
            'weekly_frequency' => '3',
            'preferred_time' => 'morning',
            'payment_method' => 'cash',
            'branch_id' => $this->branch->id,
            'plan_id' => $this->plan->id,
            'coach_id' => $this->coach->id,
        ];
    }

    // ── Test 1: Login throttle after 10 attempts ──

    public function test_login_throttle_after_10_attempts(): void
    {
        // The app-level lockout kicks in after 5 failed attempts
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'wrong@test.com',
                'password' => 'wrong',
            ]);
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'wrong@test.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(429);
    }

    // ── Test 2: Registration throttle by phone after 5 attempts ──

    public function test_registration_throttle_by_phone_after_5_attempts(): void
    {
        Cache::flush();

        $headers = ['X-Club-Slug' => $this->club->slug];

        // Send 5 attempts with same phone
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/registrations', $this->validRegistration(), $headers);
        }

        // 6th attempt should be throttled
        $response = $this->postJson('/api/v1/registrations', $this->validRegistration(), $headers);

        $response->assertStatus(429);
        $this->assertStringContainsString('Too many registration attempts', $response->json('message'));
    }

    // ── Test 2b: Reformatting the phone does not mint a fresh rate-limit bucket ──

    public function test_registration_throttle_ignores_phone_formatting(): void
    {
        Cache::flush();

        $headers = ['X-Club-Slug' => $this->club->slug];

        // Exhaust the quota with one spelling of the number...
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/registrations', array_merge(
                $this->validRegistration(),
                ['phone' => '0551234567'],
            ), $headers);
        }

        // ...then try the same number spaced, dashed and with a country prefix.
        foreach (['+966 55 123 4567 ', '055-123-4567', ' 0551234567'] as $variant) {
            $response = $this->postJson('/api/v1/registrations', array_merge(
                $this->validRegistration(),
                ['phone' => $variant],
            ), $headers);

            $response->assertStatus(429);
        }
    }

    // ── Test 2c: Validation failures do not burn the applicant's quota ──

    public function test_invalid_registration_payload_does_not_consume_quota(): void
    {
        Cache::flush();

        $headers = ['X-Club-Slug' => $this->club->slug];
        $phone = '0559998888';

        // Five malformed submissions — typos, not attacks.
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/registrations', array_merge(
                $this->validRegistration(),
                ['phone' => $phone, 'gender' => 'not-a-gender'],
            ), $headers)->assertStatus(422);
        }

        // The corrected submission must still go through.
        $response = $this->postJson('/api/v1/registrations', array_merge(
            $this->validRegistration(),
            ['phone' => $phone],
        ), $headers);

        $response->assertStatus(201);
    }

    // ── Test 3: Branding upload throttle after 20 uploads ──

    public function test_branding_upload_throttle_after_20_uploads(): void
    {
        Storage::fake('public');

        // Simulate 20 prior uploads via cache
        Cache::put("branding_uploads_{$this->club->id}", 20, now()->addHour());

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/branding/upload', [
                'file' => UploadedFile::fake()->image('logo.png', 100, 100),
                'type' => 'logo',
            ]);

        $response->assertStatus(429);
        $this->assertStringContainsString('Upload limit', $response->json('message'));
    }

    // ── Test 4: Push token limit after 5 devices ──

    public function test_push_token_limit_after_5_devices(): void
    {
        // Create 5 existing tokens
        for ($i = 0; $i < 5; $i++) {
            PushToken::create([
                'user_id' => $this->manager->id,
                'token' => "ExponentPushToken[existing-{$i}]",
                'platform' => 'expo',
            ]);
        }

        // 6th token should be rejected
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/notifications/push-token', [
                'token' => 'ExponentPushToken[new-device]',
                'platform' => 'expo',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Maximum device limit', $response->json('message'));
    }

    // ── Test 5: Analytics cached (no excessive queries) ──

    public function test_analytics_endpoint_is_cached(): void
    {
        Cache::flush();

        // First request populates cache
        $response1 = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/analytics');
        $response1->assertOk();

        // Verify cache was set
        $cacheKey = "analytics_full_{$this->club->id}";
        $this->assertNotNull(Cache::get($cacheKey));

        // Second request serves from cache (same data)
        $response2 = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/analytics');
        $response2->assertOk();
        $this->assertEquals($response1->json(), $response2->json());
    }

    // ── Test 6: Throttle response is JSON not HTML ──

    public function test_throttle_response_is_json_not_html(): void
    {
        // Use the login lockout (5 attempts triggers app-level 429)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'nope@test.com',
                'password' => 'wrong',
            ]);
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nope@test.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(429);
        $response->assertHeader('Content-Type', 'application/json');
        $this->assertArrayHasKey('message', $response->json());
    }

    // ── Test 7: Throttle includes retry-after context ──

    public function test_throttle_includes_retry_information(): void
    {
        // Use the login lockout
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'retry@test.com',
                'password' => 'wrong',
            ]);
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'retry@test.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(429);
        // Message should mention trying again
        $this->assertStringContainsString('Try again', $response->json('message'));
    }

    // ── Test 8: Rate limit resets after window ──

    public function test_rate_limit_resets_after_window(): void
    {
        Cache::flush();

        $headers = ['X-Club-Slug' => $this->club->slug];
        $phone = '+9999999999';
        $reg = array_merge($this->validRegistration(), ['phone' => $phone]);

        // Fill up rate limit. The key hashes the DIGITS of the number, not the raw
        // string, so that reformatting it cannot mint a fresh bucket.
        $key = 'registration_attempt_'.hash('sha256', '9999999999');
        Cache::put($key, 5, now()->addHour());

        // Should be blocked
        $response = $this->postJson('/api/v1/registrations', $reg, $headers);
        $response->assertStatus(429);

        // Clear cache (simulating TTL expiry)
        Cache::forget($key);

        // Should succeed again (or at least not be 429)
        $response2 = $this->postJson('/api/v1/registrations', $reg, $headers);
        $this->assertNotEquals(429, $response2->status());
    }
}
