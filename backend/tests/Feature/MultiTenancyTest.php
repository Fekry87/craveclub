<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class MultiTenancyTest extends TestCase
{
    use RefreshDatabase;

    private Club $clubA;
    private Club $clubB;
    private User $managerA;
    private User $managerB;
    private User $coachUserA;
    private CoachProfile $coachProfileA;
    private SwimmerProfile $swimmerA;
    private SwimmerProfile $swimmerB;
    private TrainingSession $sessionA;
    private TrainingSession $sessionB;

    protected function setUp(): void
    {
        parent::setUp();

        // ── Club A ──
        $this->clubA = Club::create([
            'name' => 'Club Alpha',
            'slug' => 'club-alpha',
            'is_active' => true,
        ]);
        ClubFeature::create(['club_id' => $this->clubA->id]);

        $this->managerA = User::create([
            'name' => 'Manager A',
            'email' => 'manager-a@test.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->clubA->id,
        ]);

        $coachUserA = User::create([
            'name' => 'Coach A',
            'email' => 'coach-a@test.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->clubA->id,
        ]);
        $this->coachUserA = $coachUserA;
        $this->coachProfileA = CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $coachUserA->id,
            'club_id' => $this->clubA->id,
            'specialization' => 'Freestyle',
        ]);

        $swimmerUserA = User::create([
            'name' => 'Swimmer A',
            'email' => 'swimmer-a@test.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->clubA->id,
        ]);
        $this->swimmerA = SwimmerProfile::withoutGlobalScopes()->create([
            'user_id' => $swimmerUserA->id,
            'club_id' => $this->clubA->id,
            'first_name' => 'Swimmer',
            'last_name' => 'A',
        ]);

        $groupA = Group::withoutGlobalScopes()->create([
            'name' => 'Group Alpha',
            'club_id' => $this->clubA->id,
            'coach_user_id' => $coachUserA->id,
        ]);

        $this->sessionA = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $groupA->id,
            'club_id' => $this->clubA->id,
            'title' => 'Session A',
            'date' => now()->addDay()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'Scheduled',
            'type' => 'training',
        ]);

        // ── Club B ──
        $this->clubB = Club::create([
            'name' => 'Club Beta',
            'slug' => 'club-beta',
            'is_active' => true,
        ]);
        ClubFeature::create(['club_id' => $this->clubB->id]);

        $this->managerB = User::create([
            'name' => 'Manager B',
            'email' => 'manager-b@test.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->clubB->id,
        ]);

        $coachUserB = User::create([
            'name' => 'Coach B',
            'email' => 'coach-b@test.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->clubB->id,
        ]);
        CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $coachUserB->id,
            'club_id' => $this->clubB->id,
            'specialization' => 'Backstroke',
        ]);

        $swimmerUserB = User::create([
            'name' => 'Swimmer B',
            'email' => 'swimmer-b@test.com',
            'password' => 'Password123!',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->clubB->id,
        ]);
        $this->swimmerB = SwimmerProfile::withoutGlobalScopes()->create([
            'user_id' => $swimmerUserB->id,
            'club_id' => $this->clubB->id,
            'first_name' => 'Swimmer',
            'last_name' => 'B',
        ]);

        $groupB = Group::withoutGlobalScopes()->create([
            'name' => 'Group Beta',
            'club_id' => $this->clubB->id,
            'coach_user_id' => $coachUserB->id,
        ]);

        $this->sessionB = TrainingSession::withoutGlobalScopes()->create([
            'group_id' => $groupB->id,
            'club_id' => $this->clubB->id,
            'title' => 'Session B',
            'date' => now()->addDay()->toDateString(),
            'start_time' => '11:00',
            'end_time' => '12:00',
            'status' => 'Scheduled',
            'type' => 'training',
        ]);
    }

    // ── Helpers ──

    private function actAsManager(User $manager): self
    {
        return $this->actingAs($manager, 'sanctum');
    }

    // ── Test 1: Manager cannot read other club's swimmer ──

    public function test_manager_cannot_read_other_club_swimmer(): void
    {
        $response = $this->actAsManager($this->managerA)
            ->getJson("/api/v1/club/swimmers/{$this->swimmerB->id}");

        $response->assertStatus(404);
    }

    // ── Test 2: Manager cannot update other club's swimmer ──

    public function test_manager_cannot_update_other_club_swimmer(): void
    {
        $response = $this->actAsManager($this->managerA)
            ->putJson("/api/v1/club/swimmers/{$this->swimmerB->id}", [
                'first_name' => 'Hacked',
            ]);

        $response->assertStatus(404);
    }

    // ── Test 3: Manager cannot delete other club's swimmer ──

    public function test_manager_cannot_delete_other_club_swimmer(): void
    {
        $response = $this->actAsManager($this->managerA)
            ->deleteJson("/api/v1/club/swimmers/{$this->swimmerB->id}");

        $response->assertStatus(404);
    }

    // ── Test 4: Manager cannot read other club's session ──

    public function test_manager_cannot_read_other_club_session(): void
    {
        $response = $this->actAsManager($this->managerA)
            ->getJson("/api/v1/club/sessions/{$this->sessionB->id}");

        $response->assertStatus(404);
    }

    // ── Test 5: Coach cannot read other club's session ──

    public function test_coach_cannot_read_other_club_session(): void
    {
        $response = $this->actingAs($this->coachUserA, 'sanctum')
            ->getJson("/api/v1/coach/sessions/{$this->sessionB->id}");

        $response->assertStatus(404);
    }

    // ── Test 6: Registration rejects other club's plan ──

    public function test_registration_rejects_other_club_plan(): void
    {
        $planB = SubscriptionPlan::create([
            'club_id' => $this->clubB->id,
            'name' => 'Beta Plan',
            'price' => 100,
            'duration_months' => 3,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $branchA = Branch::create([
            'club_id' => $this->clubA->id,
            'name' => 'Alpha Branch',
            'address' => '123 Alpha St',
            'city' => 'Alpha City',
            'capacity' => 50,
        ]);

        $response = $this->postJson('/api/v1/registrations', [
            'full_name' => 'Test Swimmer',
            'phone' => '+1234567890',
            'gender' => 'male',
            'birth_date' => '2000-01-01',
            'height_cm' => 175,
            'weight_kg' => 70,
            'fitness_level' => 'intermediate',
            'sport_ids' => [1],
            'experience_level' => 'intermediate',
            'primary_goal' => 'fitness',
            'weekly_frequency' => 3,
            'preferred_time' => 'morning',
            'payment_method' => 'cash',
            'branch_id' => $branchA->id,
            'plan_id' => $planB->id,
            'coach_id' => $this->coachProfileA->id,
        ], ['X-Club-Slug' => $this->clubA->slug]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['plan_id']);
    }

    // ── Test 7: Analytics only returns own club data ──

    public function test_analytics_only_returns_own_club_data(): void
    {
        // Club A has 1 swimmer, Club B has 1 swimmer
        $response = $this->actAsManager($this->managerA)
            ->getJson('/api/v1/club/dashboard');

        $response->assertOk();
        $data = $response->json();

        // Dashboard swimmer count should only count Club A swimmers
        $this->assertArrayHasKey('swimmers_count', $data);
        $this->assertEquals(1, $data['swimmers_count']);
    }

    // ── Test 8: Cache isolation between clubs ──

    public function test_cache_isolation_between_clubs(): void
    {
        Cache::flush();

        // Load dashboard for Club A
        $responseA = $this->actAsManager($this->managerA)
            ->getJson('/api/v1/club/dashboard');
        $responseA->assertOk();
        $dataA = $responseA->json();

        // Load dashboard for Club B
        $responseB = $this->actAsManager($this->managerB)
            ->getJson('/api/v1/club/dashboard');
        $responseB->assertOk();
        $dataB = $responseB->json();

        // Each club should see only their own data (1 swimmer each)
        $this->assertEquals(1, $dataA['swimmers_count']);
        $this->assertEquals(1, $dataB['swimmers_count']);

        // Verify cache keys are separate
        $this->assertNotNull(Cache::get("dashboard_metrics_{$this->clubA->id}"));
        $this->assertNotNull(Cache::get("dashboard_metrics_{$this->clubB->id}"));
    }
}
