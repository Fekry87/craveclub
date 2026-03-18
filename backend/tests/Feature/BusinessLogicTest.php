<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\TrainingPlan;
use App\Models\TrainingPlanAssignment;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessLogicTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $manager;
    private User $coachUser;
    private CoachProfile $coachProfile;
    private Group $group;
    private SwimmerProfile $swimmer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Business Logic Club',
            'slug' => 'biz-logic',
            'is_active' => true,
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
            'coach_portal_enabled' => true,
            'evaluations_enabled' => true,
            'training_plans_enabled' => true,
            'subscription_plans_enabled' => true,
        ]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@bizlogic.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@bizlogic.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);
        $this->coachProfile = CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $this->coachUser->id,
            'club_id' => $this->club->id,
            'specialization' => 'Freestyle',
        ]);

        $this->group = Group::withoutGlobalScopes()->create([
            'name' => 'Test Group',
            'club_id' => $this->club->id,
            'coach_user_id' => $this->coachUser->id,
        ]);

        $swimmerUser = User::create([
            'name' => 'Swimmer',
            'email' => 'swimmer@bizlogic.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);
        $this->swimmer = SwimmerProfile::withoutGlobalScopes()->create([
            'user_id' => $swimmerUser->id,
            'club_id' => $this->club->id,
            'first_name' => 'Test',
            'last_name' => 'Swimmer',
        ]);
        GroupMembership::withoutGlobalScopes()->create([
            'group_id' => $this->group->id,
            'swimmer_id' => $this->swimmer->id,
            'club_id' => $this->club->id,
        ]);
    }

    // ── Test 1: Cannot start a cancelled session ──

    public function test_cannot_start_cancelled_session(): void
    {
        $session = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $this->group->id,
            'club_id' => $this->club->id,
            'title' => 'Cancelled Session',
            'date' => now()->addDay()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'Cancelled',
            'type' => 'training',
        ]);

        $response = $this->actingAs($this->coachUser, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$session->id}/start");

        // Session not found because query filters by status=Scheduled
        $response->assertStatus(404);
    }

    // ── Test 2: Cannot complete a scheduled session (must start first) ──

    public function test_cannot_complete_scheduled_session(): void
    {
        $session = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $this->group->id,
            'club_id' => $this->club->id,
            'title' => 'Scheduled Session',
            'date' => now()->addDay()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'Scheduled',
            'type' => 'training',
        ]);

        $response = $this->actingAs($this->coachUser, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$session->id}/complete");

        // Session not found because query filters by status=Live
        $response->assertStatus(404);
    }

    // ── Test 3: Cannot start a completed session ──

    public function test_cannot_start_completed_session(): void
    {
        $session = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $this->group->id,
            'club_id' => $this->club->id,
            'title' => 'Completed Session',
            'date' => now()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'Completed',
            'type' => 'training',
        ]);

        $response = $this->actingAs($this->coachUser, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$session->id}/start");

        $response->assertStatus(404);
    }

    // ── Test 4: Cannot approve already approved registration ──

    public function test_cannot_approve_already_approved_registration(): void
    {
        $branch = Branch::create([
            'club_id' => $this->club->id,
            'name' => 'Main',
            'address' => '123 St',
            'city' => 'City',
            'capacity' => 50,
        ]);

        $plan = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Monthly',
            'price' => 100,
            'duration_months' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $registration = Registration::create([
            'club_id' => $this->club->id,
            'full_name' => 'Already Approved',
            'phone' => '+1234567890',
            'gender' => 'male',
            'birth_date' => '2000-01-01',
            'sport_ids' => ['swimming'],
            'experience_level' => 'beginner',
            'primary_goal' => 'fitness',
            'weekly_frequency' => '3',
            'preferred_time' => 'morning',
            'payment_method' => 'cash',
            'branch_id' => $branch->id,
            'plan_id' => $plan->id,
            'coach_id' => $this->coachProfile->id,
            'status' => 'approved', // Already approved
            'total_amount' => 100,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ]);

        $response->assertStatus(422);
    }

    // ── Test 5: Approval does not duplicate user record ──

    public function test_approval_does_not_duplicate_user_record(): void
    {
        $branch = Branch::create([
            'club_id' => $this->club->id,
            'name' => 'Branch',
            'address' => '456 St',
            'city' => 'City',
            'capacity' => 50,
        ]);

        $plan = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Plan',
            'price' => 50,
            'duration_months' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $registration = Registration::create([
            'club_id' => $this->club->id,
            'full_name' => 'New Person',
            'phone' => '+9876543210',
            'gender' => 'female',
            'birth_date' => '1995-06-15',
            'sport_ids' => ['swimming'],
            'experience_level' => 'intermediate',
            'primary_goal' => 'competition',
            'weekly_frequency' => '5',
            'preferred_time' => 'evening',
            'payment_method' => 'cash',
            'branch_id' => $branch->id,
            'plan_id' => $plan->id,
            'coach_id' => $this->coachProfile->id,
            'status' => 'pending',
            'total_amount' => 50,
        ]);

        // Approve
        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ]);
        $response->assertOk();

        // Try to approve again — should fail
        $response2 = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", [
                'status' => 'approved',
            ]);
        $response2->assertStatus(422);

        // Verify only 1 swimmer user was created (not duplicate)
        $swimmerCount = User::where('club_id', $this->club->id)
            ->where('role', UserRole::SWIMMER)
            ->where('name', 'New Person')
            ->count();
        $this->assertEquals(1, $swimmerCount);
    }

    // ── Test 6: is_popular clears other plans ──

    public function test_is_popular_clears_other_plans(): void
    {
        $plan1 = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Plan A',
            'price' => 100,
            'duration_months' => 1,
            'is_popular' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $plan2 = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Plan B',
            'price' => 200,
            'duration_months' => 3,
            'is_popular' => false,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        // Set Plan B as popular
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/subscription-plans/{$plan2->id}", [
                'is_popular' => true,
            ]);
        $response->assertOk();

        // Verify Plan A lost popular status
        $plan1->refresh();
        $plan2->refresh();
        $this->assertFalse((bool) $plan1->is_popular);
        $this->assertTrue((bool) $plan2->is_popular);

        // Verify exactly one plan is popular
        $popularCount = SubscriptionPlan::where('club_id', $this->club->id)
            ->where('is_popular', true)
            ->count();
        $this->assertEquals(1, $popularCount);
    }

    // ── Test 7: Cannot assign two active plans to same swimmer ──

    public function test_cannot_assign_two_active_plans_to_swimmer(): void
    {
        $plan = TrainingPlan::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'coach_user_id' => $this->coachUser->id,
            'title' => 'Plan One',
            'level' => 'beginner',
            'duration_weeks' => 4,
            'sessions_per_week' => 3,
            'difficulty_level' => 'beginner',
        ]);

        // First assignment
        TrainingPlanAssignment::withoutGlobalScopes()->create([
            'training_plan_id' => $plan->id,
            'club_id' => $this->club->id,
            'assigned_by_coach_id' => $this->coachUser->id,
            'swimmer_profile_id' => $this->swimmer->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addWeeks(4)->toDateString(),
            'status' => 'active',
        ]);

        // Try second assignment
        $response = $this->actingAs($this->coachUser, 'sanctum')
            ->postJson("/api/v1/coach/training-plans/{$plan->id}/assign", [
                'assignee_type' => 'swimmer',
                'assignee_id' => $this->swimmer->id,
                'start_date' => now()->toDateString(),
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['This swimmer already has an active training plan.']);
    }

    // ── Test 8: Attendance unique constraint prevents duplicates ──

    public function test_attendance_unique_constraint_prevents_duplicates(): void
    {
        $session = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $this->group->id,
            'club_id' => $this->club->id,
            'title' => 'Attendance Test',
            'date' => now()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'Live',
            'type' => 'training',
        ]);

        // First attendance record
        Attendance::create([
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmer->id,
            'club_id' => $this->club->id,
            'present' => true,
        ]);

        // Duplicate should throw unique constraint violation
        $this->expectException(\Illuminate\Database\QueryException::class);

        Attendance::create([
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmer->id,
            'club_id' => $this->club->id,
            'present' => false,
        ]);
    }
}
