<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ValidationTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private Club $otherClub;

    private User $manager;

    private CoachProfile $coach;

    private Branch $branch;

    private SubscriptionPlan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Validation Club',
            'slug' => 'validation-club',
            'is_active' => true,
        ]);
        ClubFeature::create(['club_id' => $this->club->id]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@validation.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@validation.com',
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
            'address' => '123 Main St',
            'city' => 'Test City',
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

        $this->otherClub = Club::create([
            'name' => 'Other Club',
            'slug' => 'other-club',
            'is_active' => true,
        ]);
    }

    private function validRegistration(array $overrides = []): array
    {
        return array_merge([
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
        ], $overrides);
    }

    private function clubHeader(): array
    {
        return ['X-Club-Slug' => $this->club->slug];
    }

    // ── Test 1: Registration rejects invalid email ──

    public function test_registration_rejects_invalid_email(): void
    {
        $response = $this->postJson('/api/v1/registrations',
            $this->validRegistration(['guardian_email' => 'not-an-email']),
            $this->clubHeader()
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guardian_email']);
    }

    // ── Test 2: Registration rejects future DOB ──

    public function test_registration_rejects_future_dob(): void
    {
        $response = $this->postJson('/api/v1/registrations',
            $this->validRegistration(['birth_date' => '2030-01-01']),
            $this->clubHeader()
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['birth_date']);
    }

    // ── Test 3: Registration rejects other club plan ──

    public function test_registration_rejects_other_club_plan(): void
    {
        $otherPlan = SubscriptionPlan::create([
            'club_id' => $this->otherClub->id,
            'name' => 'Other Plan',
            'price' => 50,
            'duration_months' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->postJson('/api/v1/registrations',
            $this->validRegistration(['plan_id' => $otherPlan->id]),
            $this->clubHeader()
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['plan_id']);
    }

    // ── Test 4: File upload rejects PHP file ──

    public function test_file_upload_rejects_php_file(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/branding/upload', [
                'file' => UploadedFile::fake()->create('shell.php', 100, 'application/x-php'),
                'type' => 'logo',
            ]);

        $response->assertStatus(422);
    }

    // ── Test 5: File upload rejects oversized file ──

    public function test_file_upload_rejects_oversized_file(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/branding/upload', [
                'file' => UploadedFile::fake()->image('logo.png')->size(5000), // 5MB > 2MB limit
                'type' => 'logo',
            ]);

        $response->assertStatus(422);
    }

    // ── Test 6: Branding rejects invalid hex color ──

    public function test_branding_rejects_invalid_hex_color(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson('/api/v1/club/branding', [
                'primary_color' => 'not-a-color',
            ]);

        $response->assertStatus(422);
    }

    // ── Test 7: Mass assignment cannot change club_id ──

    public function test_mass_assignment_cannot_change_club_id(): void
    {
        // Coach update endpoint — try to inject club_id
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/coaches/{$this->coach->id}", [
                'specialization' => 'Backstroke',
                'club_id' => 9999, // attempt to change club
            ]);

        $response->assertOk();

        // Verify club_id was NOT changed
        $this->coach->refresh();
        $this->assertEquals($this->club->id, $this->coach->club_id);
    }

    // ── Test 8: Mass assignment cannot change role ──

    public function test_mass_assignment_cannot_change_role(): void
    {
        // Try to escalate a swimmer to CLUB_MANAGER via update
        $swimmerUser = User::create([
            'name' => 'Swimmer',
            'email' => 'swimmer@validation.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        // The swimmer update endpoint only accepts specific fields
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/swimmers/{$swimmerUser->id}", [
                'first_name' => 'Updated',
                'role' => 'PLATFORM_ADMIN', // attempt privilege escalation
            ]);

        // Verify role was NOT changed
        $swimmerUser->refresh();
        $this->assertEquals(UserRole::SWIMMER, $swimmerUser->role);
    }
}
