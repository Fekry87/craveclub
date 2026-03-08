<?php

namespace Tests\Feature\Security;

use App\Enums\SkillType;
use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\Skill;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Club $clubA;
    private Club $clubB;
    private User $managerA;

    protected function setUp(): void
    {
        parent::setUp();

        // ── Club A (the attacker's club) ──
        $this->clubA = Club::create([
            'name' => 'Club A',
            'slug' => 'club-a',
            'is_active' => true,
            'max_branches' => 5,
        ]);
        ClubFeature::create(['club_id' => $this->clubA->id]);

        $this->managerA = User::create([
            'name' => 'Manager A',
            'email' => 'managerA@test.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->clubA->id,
        ]);

        // ── Club B (the victim's club) ──
        $this->clubB = Club::create([
            'name' => 'Club B',
            'slug' => 'club-b',
            'is_active' => true,
            'max_branches' => 5,
        ]);
        ClubFeature::create(['club_id' => $this->clubB->id]);
    }

    // ── Coach isolation ───────────────────────────────────────

    public function test_club_a_cannot_read_club_b_coach(): void
    {
        $coachUser = User::create([
            'name' => 'Coach B',
            'email' => 'coachB@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->clubB->id,
        ]);
        $coach = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'user_id' => $coachUser->id,
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->getJson("/api/v1/club/coaches/{$coach->id}");

        $response->assertNotFound();
    }

    public function test_club_a_cannot_update_club_b_coach(): void
    {
        $coachUser = User::create([
            'name' => 'Coach B',
            'email' => 'coachB-update@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->clubB->id,
        ]);
        $coach = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'user_id' => $coachUser->id,
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->putJson("/api/v1/club/coaches/{$coach->id}", [
                'bio' => 'Hacked bio',
            ]);

        $response->assertNotFound();
    }

    public function test_club_a_cannot_delete_club_b_coach(): void
    {
        $coachUser = User::create([
            'name' => 'Coach B',
            'email' => 'coachB-delete@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->clubB->id,
        ]);
        $coach = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'user_id' => $coachUser->id,
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->deleteJson("/api/v1/club/coaches/{$coach->id}");

        $response->assertNotFound();
    }

    // ── Swimmer isolation ─────────────────────────────────────

    public function test_club_a_cannot_read_club_b_swimmer(): void
    {
        $swimmer = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'first_name' => 'Swimmer',
            'last_name' => 'B',
            'level' => 'Beginner',
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->getJson("/api/v1/club/swimmers/{$swimmer->id}");

        $response->assertNotFound();
    }

    // ── Group isolation ───────────────────────────────────────

    public function test_club_a_cannot_read_club_b_group(): void
    {
        // Group needs a coach_user_id — create a coach user in clubB
        $coachUserB = User::create([
            'name' => 'Coach B for Group',
            'email' => 'coachB-group@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->clubB->id,
        ]);

        $group = Group::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'name' => 'Group B',
            'coach_user_id' => $coachUserB->id,
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->getJson("/api/v1/club/groups/{$group->id}");

        $response->assertNotFound();
    }

    // ── Session isolation ─────────────────────────────────────

    public function test_club_a_cannot_read_club_b_session(): void
    {
        $coachUserB = User::create([
            'name' => 'Coach B for Session',
            'email' => 'coachB-session@test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->clubB->id,
        ]);

        $group = Group::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'name' => 'Group B Session',
            'coach_user_id' => $coachUserB->id,
        ]);

        $session = TrainingSession::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'group_id' => $group->id,
            'date' => Carbon::today()->toDateString(),
            'start_time' => '08:00',
            'end_time' => '09:30',
            'location' => 'Pool B',
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->getJson("/api/v1/club/sessions/{$session->id}");

        $response->assertNotFound();
    }

    // ── Training Plan isolation ────────────────────────────────

    public function test_club_a_cannot_read_club_b_plan(): void
    {
        $plan = TrainingPlan::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'title' => 'Plan B',
            'level' => 'Advanced',
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->getJson("/api/v1/club/plans/{$plan->id}");

        $response->assertNotFound();
    }

    // ── Skill isolation ───────────────────────────────────────

    public function test_club_a_cannot_read_club_b_skill(): void
    {
        // Skills route only has index/store/update/destroy — no show.
        // Test update as the cross-tenant vector (requires assertOwnership).
        $skill = Skill::withoutGlobalScopes()->create([
            'club_id' => $this->clubB->id,
            'name' => 'Skill B',
            'type' => SkillType::SKILL,
        ]);

        $response = $this->actingAs($this->managerA, 'sanctum')
            ->putJson("/api/v1/club/skills/{$skill->id}", [
                'name' => 'Hacked Skill',
            ]);

        $response->assertNotFound();
    }
}
