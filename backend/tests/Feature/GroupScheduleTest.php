<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Group type, capacity and weekly schedule, plus the rule that a coach can never
 * have two groups meeting at the same time on a shared day.
 */
class GroupScheduleTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $coach;

    private CoachProfile $coachProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create(['name' => 'Schedule Club', 'slug' => 'schedule-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id, 'coach_portal_enabled' => true]);

        $this->manager = User::create(['name' => 'Manager', 'email' => 'manager@schedule.test', 'password' => 'password', 'role' => UserRole::CLUB_MANAGER, 'club_id' => $this->club->id]);
        $this->coach = User::create(['name' => 'Coach Ali', 'email' => 'coach@schedule.test', 'password' => 'password', 'role' => UserRole::COACH, 'club_id' => $this->club->id]);
        $this->coachProfile = CoachProfile::withoutGlobalScopes()->create(['user_id' => $this->coach->id, 'club_id' => $this->club->id, 'specialization' => 'Freestyle']);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Morning Squad',
            'coach_user_id' => $this->coach->id,
            'group_type' => 'three_days',
            'capacity' => 10,
            'days_of_week' => [0, 2, 4],
            'start_time' => '17:00',
            'end_time' => '18:00',
        ], $overrides);
    }

    private function createGroup(array $overrides = [])
    {
        return $this->actingAs($this->manager, 'sanctum')->postJson('/api/v1/club/groups', $this->payload($overrides));
    }

    // ── Day count must match the type ─────────────────────────────────

    public function test_daily_group_accepts_any_day_count(): void
    {
        // "Daily" means the club's training days, not all seven: a club closed on
        // Friday still runs a daily group.
        $this->createGroup(['group_type' => 'daily', 'days_of_week' => [0, 1, 2, 3, 4, 6]])
            ->assertStatus(201)
            ->assertJsonPath('group_type', 'daily');

        $this->createGroup(['name' => 'Full week', 'group_type' => 'daily', 'days_of_week' => [0, 1, 2, 3, 4, 5, 6], 'start_time' => '19:00', 'end_time' => '20:00'])
            ->assertStatus(201);

        $this->createGroup(['name' => 'No days', 'group_type' => 'daily', 'days_of_week' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['days_of_week']);
    }

    public function test_three_day_group_requires_exactly_three_days(): void
    {
        $this->createGroup(['group_type' => 'three_days', 'days_of_week' => [0, 2]])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['days_of_week']);

        $this->createGroup(['group_type' => 'three_days', 'days_of_week' => [0, 2, 4]])
            ->assertStatus(201);
    }

    public function test_private_group_accepts_any_day_count(): void
    {
        $this->createGroup(['group_type' => 'private', 'days_of_week' => [3]])->assertStatus(201);
    }

    public function test_end_time_must_follow_start_time(): void
    {
        $this->createGroup(['start_time' => '18:00', 'end_time' => '17:00'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['end_time']);
    }

    // ── Coach conflicts ────────────────────────────────────────────────

    public function test_same_coach_same_day_non_overlapping_times_is_allowed(): void
    {
        $this->createGroup(['name' => 'A', 'start_time' => '17:00', 'end_time' => '18:00'])->assertStatus(201);
        $this->createGroup(['name' => 'B', 'start_time' => '18:00', 'end_time' => '19:00'])->assertStatus(201);
    }

    public function test_same_coach_same_day_overlapping_times_is_rejected(): void
    {
        $this->createGroup(['name' => 'A', 'start_time' => '17:00', 'end_time' => '18:00'])->assertStatus(201);

        $this->createGroup(['name' => 'B', 'start_time' => '17:30', 'end_time' => '18:30'])
            ->assertStatus(422)
            ->assertJsonPath('conflicting_group.name', 'A')
            ->assertJsonPath('conflicting_group.start_time', '17:00');

        $this->assertSame(1, Group::withoutGlobalScopes()->where('club_id', $this->club->id)->count());
    }

    public function test_same_coach_different_days_is_allowed_whatever_the_time(): void
    {
        $this->createGroup(['name' => 'A', 'days_of_week' => [0, 2, 4]])->assertStatus(201);
        $this->createGroup(['name' => 'B', 'days_of_week' => [1, 3, 5]])->assertStatus(201);
    }

    public function test_different_coaches_never_conflict(): void
    {
        $other = User::create(['name' => 'Coach Omar', 'email' => 'omar@schedule.test', 'password' => 'password', 'role' => UserRole::COACH, 'club_id' => $this->club->id]);

        $this->createGroup(['name' => 'A'])->assertStatus(201);
        $this->createGroup(['name' => 'B', 'coach_user_id' => $other->id])->assertStatus(201);
    }

    public function test_editing_a_group_does_not_conflict_with_itself(): void
    {
        $id = $this->createGroup()->json('id');

        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/groups/{$id}", ['start_time' => '17:15', 'end_time' => '18:15'])
            ->assertOk()
            ->assertJsonPath('start_time', '17:15');
    }

    public function test_editing_a_group_into_another_groups_slot_is_rejected(): void
    {
        $this->createGroup(['name' => 'A', 'start_time' => '17:00', 'end_time' => '18:00']);
        $b = $this->createGroup(['name' => 'B', 'start_time' => '19:00', 'end_time' => '20:00'])->json('id');

        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/groups/{$b}", ['start_time' => '17:30', 'end_time' => '18:30'])
            ->assertStatus(422)
            ->assertJsonPath('conflicting_group.name', 'A');
    }

    // ── Capacity ───────────────────────────────────────────────────────

    public function test_remaining_spots_decrease_as_swimmers_join(): void
    {
        $group = Group::create($this->payload(['club_id' => $this->club->id, 'capacity' => 2]));
        $this->assertSame(2, $group->remaining_spots);

        foreach (['Alice', 'Bob'] as $name) {
            $swimmer = SwimmerProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'first_name' => $name, 'last_name' => 'S', 'level' => 'beginner']);
            GroupMembership::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'group_id' => $group->id, 'swimmer_id' => $swimmer->id]);
        }

        $this->assertSame(0, $group->fresh()->remaining_spots);
        $this->assertTrue($group->fresh()->isFull());
    }

    // ── Public endpoint ────────────────────────────────────────────────

    public function test_public_groups_endpoint_groups_by_type_with_remaining_spots(): void
    {
        Group::create($this->payload(['club_id' => $this->club->id, 'name' => 'Tri', 'group_type' => 'three_days', 'capacity' => 3]));
        Group::create($this->payload(['club_id' => $this->club->id, 'name' => 'Solo', 'group_type' => 'private', 'days_of_week' => [1], 'start_time' => '09:00', 'end_time' => '10:00', 'capacity' => 1]));
        // No schedule yet: not offered to applicants
        Group::create(['club_id' => $this->club->id, 'name' => 'Unscheduled']);

        $response = $this->getJson('/api/v1/clubs/schedule-club/groups')->assertOk();

        $response->assertJsonPath('data.three_days.0.name', 'Tri')
            ->assertJsonPath('data.three_days.0.remaining_spots', 3)
            ->assertJsonPath('data.three_days.0.is_full', false)
            ->assertJsonPath('data.three_days.0.coach_name', 'Coach Ali')
            ->assertJsonPath('data.three_days.0.days_of_week_labels', ['Sun', 'Tue', 'Thu'])
            ->assertJsonPath('data.three_days.0.start_time', '17:00')
            ->assertJsonPath('data.private.0.name', 'Solo');

        $this->assertArrayNotHasKey('daily', $response->json('data'));
        $this->assertStringNotContainsString('Unscheduled', $response->getContent());
    }

    public function test_public_groups_endpoint_is_scoped_to_the_club_in_the_url(): void
    {
        $other = Club::create(['name' => 'Other Club', 'slug' => 'other-club', 'is_active' => true, 'max_branches' => 5]);
        Group::create($this->payload(['club_id' => $this->club->id, 'name' => 'Ours']));
        Group::create($this->payload(['club_id' => $other->id, 'name' => 'Theirs', 'coach_user_id' => null]));

        $ours = $this->getJson('/api/v1/clubs/schedule-club/groups')->assertOk()->getContent();
        $this->assertStringContainsString('Ours', $ours);
        $this->assertStringNotContainsString('Theirs', $ours);

        $theirs = $this->getJson('/api/v1/clubs/other-club/groups')->assertOk()->getContent();
        $this->assertStringContainsString('Theirs', $theirs);
        $this->assertStringNotContainsString('Ours', $theirs);
    }

    // ── Approval: capacity is enforced under lock, type mismatch is a warning ──

    private function registration(SubscriptionPlan $plan, ?int $groupId, string $name): Registration
    {
        $branch = Branch::withoutGlobalScopes()->firstOrCreate(
            ['club_id' => $this->club->id, 'name' => 'Main'],
            ['address' => '1 St', 'city' => 'City', 'capacity' => 50]
        );

        return Registration::create([
            'club_id' => $this->club->id,
            'full_name' => $name,
            'phone' => '05'.str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT),
            'gender' => 'male',
            'birth_date' => '2010-01-01',
            'sport_ids' => ['swimming'],
            'experience_level' => 'beginner',
            'primary_goal' => 'fitness',
            'weekly_frequency' => '3',
            'preferred_time' => 'evening',
            'payment_method' => 'cash',
            'branch_id' => $branch->id,
            'plan_id' => $plan->id,
            'coach_id' => $this->coachProfile->id,
            'group_id' => $groupId,
            'status' => 'pending',
            'total_amount' => 100,
        ]);
    }

    private function approve(Registration $registration)
    {
        return $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", ['status' => 'approved']);
    }

    public function test_the_last_seat_goes_to_one_approval_and_the_next_is_refused(): void
    {
        $plan = SubscriptionPlan::create(['club_id' => $this->club->id, 'name' => 'Tri', 'training_type' => 'three_days', 'price' => 100, 'duration_months' => 1, 'is_active' => true, 'sort_order' => 1]);
        $group = Group::create($this->payload(['club_id' => $this->club->id, 'capacity' => 1]));

        $first = $this->registration($plan, $group->id, 'First In');
        $second = $this->registration($plan, $group->id, 'Second In');

        $this->approve($first)->assertOk()
            ->assertJsonPath('swimmer.group_assigned', true)
            ->assertJsonPath('swimmer.group_name', 'Morning Squad')
            ->assertJsonPath('swimmer.type_mismatch_warning', false);

        $this->approve($second)->assertStatus(422)->assertJsonPath('group_full', true);

        // The refused approval created nothing: no account, no profile, still pending.
        $this->assertSame(1, GroupMembership::withoutGlobalScopes()->where('group_id', $group->id)->count());
        $this->assertSame(0, User::where('name', 'Second In')->count());
        $this->assertSame('pending', $second->fresh()->status);
        $this->assertSame(0, $group->fresh()->remaining_spots);
    }

    public function test_approval_warns_when_plan_and_group_types_differ_but_still_approves(): void
    {
        $plan = SubscriptionPlan::create(['club_id' => $this->club->id, 'name' => 'Daily', 'training_type' => 'daily', 'price' => 100, 'duration_months' => 1, 'is_active' => true, 'sort_order' => 1]);
        $group = Group::create($this->payload(['club_id' => $this->club->id, 'group_type' => 'three_days']));

        $this->approve($this->registration($plan, $group->id, 'Mismatch Kid'))
            ->assertOk()
            ->assertJsonPath('swimmer.group_assigned', true)
            ->assertJsonPath('swimmer.type_mismatch_warning', true)
            ->assertJsonPath('swimmer.plan_training_type', 'daily')
            ->assertJsonPath('swimmer.group_type', 'three_days');
    }

    public function test_approval_without_a_chosen_group_still_falls_back_to_the_coachs_group(): void
    {
        $plan = SubscriptionPlan::create(['club_id' => $this->club->id, 'name' => 'Tri', 'training_type' => 'three_days', 'price' => 100, 'duration_months' => 1, 'is_active' => true, 'sort_order' => 1]);
        $group = Group::create($this->payload(['club_id' => $this->club->id]));

        $this->approve($this->registration($plan, null, 'Legacy Flow'))
            ->assertOk()
            ->assertJsonPath('swimmer.group_assigned', true)
            ->assertJsonPath('swimmer.group_name', $group->name);
    }
}
