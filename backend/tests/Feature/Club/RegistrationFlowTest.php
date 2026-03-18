<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationFlowTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private Branch $branch;

    private SubscriptionPlan $plan;

    private CoachProfile $coachProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Test Club',
            'slug' => 'test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create(['club_id' => $this->club->id]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->branch = Branch::create([
            'club_id' => $this->club->id,
            'name' => 'Main Branch',
            'address' => '123 Main St',
            'city' => 'Test City',
            'is_active' => true,
        ]);

        $this->plan = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Monthly Plan',
            'duration_months' => 1,
            'price' => 100.00,
            'is_active' => true,
        ]);

        $coachUser = User::create([
            'name' => 'Coach One',
            'email' => 'coach@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        $this->coachProfile = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $coachUser->id,
        ]);
    }

    private function createPendingRegistration(): Registration
    {
        return Registration::create([
            'club_id' => $this->club->id,
            'branch_id' => $this->branch->id,
            'coach_id' => $this->coachProfile->id,
            'plan_id' => $this->plan->id,
            'full_name' => 'John Doe',
            'phone' => '01234567890',
            'gender' => 'male',
            'birth_date' => '2010-05-15',
            'sport_ids' => [1],
            'experience_level' => 'beginner',
            'status' => 'pending',
            'total_amount' => 100.00,
        ]);
    }

    public function test_approving_registration_creates_user_and_swimmer_profile(): void
    {
        $registration = $this->createPendingRegistration();

        $userCountBefore = User::count();
        $swimmerCountBefore = SwimmerProfile::withoutGlobalScopes()->count();

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertOk();
        $response->assertJsonStructure(['swimmer' => ['user_id']]);

        $this->assertEquals($userCountBefore + 1, User::count());
        $this->assertEquals($swimmerCountBefore + 1, SwimmerProfile::withoutGlobalScopes()->count());

        $registration->refresh();
        $this->assertEquals('approved', $registration->status);
    }

    public function test_rejecting_registration_sets_status_to_cancelled(): void
    {
        $registration = $this->createPendingRegistration();

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'cancelled',
            ]);

        $response->assertOk();

        $registration->refresh();
        $this->assertEquals('cancelled', $registration->status);
    }

    public function test_cannot_approve_already_approved_registration(): void
    {
        $registration = $this->createPendingRegistration();

        // First approval
        $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ])
            ->assertOk();

        // Second approval attempt
        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertStatus(422);
    }

    public function test_registration_requires_pending_status(): void
    {
        $registration = Registration::create([
            'club_id' => $this->club->id,
            'branch_id' => $this->branch->id,
            'coach_id' => $this->coachProfile->id,
            'plan_id' => $this->plan->id,
            'full_name' => 'Jane Doe',
            'phone' => '01234567899',
            'gender' => 'female',
            'birth_date' => '2012-03-10',
            'sport_ids' => [1],
            'experience_level' => 'beginner',
            'status' => 'cancelled',
            'total_amount' => 100.00,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertStatus(422);
    }
}
