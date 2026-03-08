<?php

namespace Tests\Feature\Security;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordStrengthTest extends TestCase
{
    use RefreshDatabase;

    public function test_approve_registration_generates_strong_password(): void
    {
        // ── Set up club with all required relations ──
        $club = Club::create([
            'name' => 'Password Club',
            'slug' => 'password-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);
        ClubFeature::create(['club_id' => $club->id]);

        $manager = User::create([
            'name' => 'Manager',
            'email' => 'manager-pw@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

        $branch = Branch::create([
            'club_id' => $club->id,
            'name' => 'Main Branch',
            'address' => '123 Test St',
            'city' => 'TestCity',
            'is_active' => true,
        ]);

        $plan = SubscriptionPlan::create([
            'club_id' => $club->id,
            'name' => 'Monthly',
            'duration_months' => 1,
            'price' => 100.00,
            'is_active' => true,
            'display_order' => 0,
        ]);

        $coachUser = User::create([
            'name' => 'Coach PW',
            'email' => 'coach-pw@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $club->id,
        ]);
        $coach = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $club->id,
            'user_id' => $coachUser->id,
        ]);

        $registration = Registration::create([
            'club_id' => $club->id,
            'branch_id' => $branch->id,
            'coach_id' => $coach->id,
            'plan_id' => $plan->id,
            'full_name' => 'Test Swimmer',
            'phone' => '0123456789',
            'gender' => 'male',
            'birth_date' => '2010-05-15',
            'status' => 'pending',
            'sport_ids' => [1],
            'total_amount' => 100,
        ]);

        // ── Approve the registration ──
        $response = $this->actingAs($manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertOk()
            ->assertJsonStructure([
                'swimmer' => ['temp_password'],
            ]);

        $tempPassword = $response->json('swimmer.temp_password');

        // ── Assert password strength ──
        // At least 9 characters
        $this->assertGreaterThanOrEqual(9, strlen($tempPassword), 'Password must be at least 9 characters');

        // Contains at least one uppercase letter
        $this->assertMatchesRegularExpression('/[A-Z]/', $tempPassword, 'Password must contain an uppercase letter');

        // Contains at least one digit
        $this->assertMatchesRegularExpression('/[0-9]/', $tempPassword, 'Password must contain a digit');

        // Contains at least one special character
        $this->assertMatchesRegularExpression('/[!@#$]/', $tempPassword, 'Password must contain a special character');
    }
}
