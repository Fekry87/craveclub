<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Api\PublicRegistrationController;
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
 * The registration's group step: a coach's groups by type with spots left, a
 * chosen group on the registration, and approval that honours it.
 */
class RegistrationGroupsTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private Branch $branch;

    private SubscriptionPlan $plan;

    private CoachProfile $coach;

    private CoachProfile $otherCoach;

    private Group $daily;

    private Group $twoDays;

    private Group $otherCoachGroup;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create(['name' => 'Group Club', 'slug' => 'group-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id]);
        $this->manager = User::create(['name' => 'Manager', 'email' => 'manager@group.test', 'password' => 'password', 'role' => UserRole::CLUB_MANAGER, 'club_id' => $this->club->id]);
        $this->branch = Branch::create(['club_id' => $this->club->id, 'name' => 'Main', 'address' => '1 St', 'city' => 'Cairo', 'is_active' => true]);
        $this->plan = SubscriptionPlan::create(['club_id' => $this->club->id, 'name' => 'Monthly', 'duration_months' => 1, 'price' => 100, 'is_active' => true, 'training_type' => 'daily']);

        $this->coach = $this->makeCoach('Coach A', 'coach-a@group.test');
        $this->otherCoach = $this->makeCoach('Coach B', 'coach-b@group.test');

        $this->daily = Group::create([
            'club_id' => $this->club->id, 'name' => 'Dolphins', 'coach_user_id' => $this->coach->user_id,
            'group_type' => 'daily', 'capacity' => 2, 'days_of_week' => [0, 2, 4], 'start_time' => '17:00', 'end_time' => '18:30',
        ]);
        $this->twoDays = Group::create([
            'club_id' => $this->club->id, 'name' => 'Sharks', 'coach_user_id' => $this->coach->user_id,
            'group_type' => 'two_days', 'capacity' => null,
        ]);
        $this->otherCoachGroup = Group::create([
            'club_id' => $this->club->id, 'name' => 'Whales', 'coach_user_id' => $this->otherCoach->user_id,
            'group_type' => 'daily', 'capacity' => 10,
        ]);
    }

    private function makeCoach(string $name, string $email): CoachProfile
    {
        $user = User::create(['name' => $name, 'email' => $email, 'password' => 'password', 'role' => UserRole::COACH, 'club_id' => $this->club->id]);

        return CoachProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $user->id, 'is_active' => true]);
    }

    private function listGroups(array $params = [])
    {
        return $this->withHeaders(['X-Club-Slug' => $this->club->slug])
            ->getJson('/api/v1/groups'.($params ? '?'.http_build_query($params) : ''));
    }

    private function submit(array $overrides = [])
    {
        return $this->withHeaders(['X-Club-Slug' => $this->club->slug])
            ->postJson('/api/v1/registrations', array_merge([
                'full_name' => 'Laila Ahmed', 'phone' => '01012345678', 'email' => 'laila@example.com', 'gender' => 'female', 'birth_date' => '2000-01-15',
                'height_cm' => 170, 'weight_kg' => 60, 'fitness_level' => 'good', 'prior_experience' => false,
                'sport_ids' => ['1'], 'experience_level' => 'beginner', 'years_experience' => 'N/A', 'competed' => false,
                'primary_goal' => 'Get fit', 'branch_id' => $this->branch->id, 'plan_id' => $this->plan->id,
                'coach_id' => $this->coach->id, 'group_id' => $this->daily->id,
                'preferred_time' => 'flexible', 'payment_method' => 'cash', 'consent_given' => true,
            ], $overrides));
    }

    private function fillGroup(Group $group): void
    {
        for ($i = 0; $i < $group->capacity; $i++) {
            $u = User::create(['name' => "Member $i", 'email' => "member{$i}-{$group->id}@group.test", 'password' => 'password', 'role' => UserRole::SWIMMER, 'club_id' => $this->club->id]);
            $p = SwimmerProfile::create(['club_id' => $this->club->id, 'user_id' => $u->id, 'branch_id' => $this->branch->id, 'first_name' => 'M', 'last_name' => (string) $i, 'date_of_birth' => '2000-01-01', 'level' => 'Beginner']);
            GroupMembership::create(['club_id' => $this->club->id, 'group_id' => $group->id, 'swimmer_id' => $p->id]);
        }
    }

    public function test_it_lists_a_coachs_groups_with_type_schedule_and_spots(): void
    {
        $this->listGroups(['coach_id' => $this->coach->id])
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Dolphins')
            ->assertJsonPath('data.0.group_type', 'daily')
            ->assertJsonPath('data.0.coach_name', 'Coach A')
            ->assertJsonPath('data.0.days_of_week_labels', ['Sun', 'Tue', 'Thu'])
            ->assertJsonPath('data.0.start_time', '17:00')
            ->assertJsonPath('data.0.end_time', '18:30')
            ->assertJsonPath('data.0.capacity', 2)
            ->assertJsonPath('data.0.remaining_spots', 2)
            ->assertJsonPath('data.0.is_full', false)
            // No capacity = no limit.
            ->assertJsonPath('data.1.name', 'Sharks')
            ->assertJsonPath('data.1.capacity', null)
            ->assertJsonPath('data.1.remaining_spots', null)
            ->assertJsonPath('data.1.is_full', false);

        // Without a coach: everyone's, typed groups first in tab order.
        $this->listGroups()->assertOk()->assertJsonCount(3, 'data');

        // An unknown coach has no groups.
        $this->listGroups(['coach_id' => 999999])->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_pending_registrations_hold_spots_and_a_full_group_says_so(): void
    {
        $this->submit(['phone' => '01011111111', 'email' => 'a@example.com'])->assertCreated();

        $this->listGroups(['coach_id' => $this->coach->id])
            ->assertJsonPath('data.0.remaining_spots', 1)
            ->assertJsonPath('data.0.is_full', false);

        $this->fillGroup($this->daily);

        $this->listGroups(['coach_id' => $this->coach->id])
            ->assertJsonPath('data.0.remaining_spots', 0)
            ->assertJsonPath('data.0.is_full', true);
    }

    public function test_the_chosen_group_is_stored_and_approval_puts_the_swimmer_in_it(): void
    {
        // The coach's *first* group is Dolphins; the swimmer chose Sharks.
        $id = $this->submit(['group_id' => $this->twoDays->id])->assertCreated()->json('registration_id');
        $this->assertSame($this->twoDays->id, Registration::find($id)->group_id);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$id}/status", ['status' => 'approved'])
            ->assertOk();

        $profile = SwimmerProfile::where('user_id', $response->json('swimmer.user_id'))->firstOrFail();
        $this->assertDatabaseHas('group_memberships', ['group_id' => $this->twoDays->id, 'swimmer_id' => $profile->id]);
        $this->assertDatabaseMissing('group_memberships', ['group_id' => $this->daily->id, 'swimmer_id' => $profile->id]);
    }

    public function test_without_a_group_approval_falls_back_to_the_coachs_first_group(): void
    {
        $id = $this->submit(['group_id' => null])->assertCreated()->json('registration_id');

        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$id}/status", ['status' => 'approved'])
            ->assertOk();

        $profile = SwimmerProfile::where('user_id', $response->json('swimmer.user_id'))->firstOrFail();
        $this->assertDatabaseHas('group_memberships', ['group_id' => $this->daily->id, 'swimmer_id' => $profile->id]);
    }

    public function test_a_group_of_another_coach_or_club_is_refused(): void
    {
        $this->submit(['group_id' => $this->otherCoachGroup->id])
            ->assertStatus(422)->assertJsonValidationErrors('group_id');

        $otherClub = Club::create(['name' => 'Other', 'slug' => 'other-club', 'is_active' => true, 'max_branches' => 5]);
        $foreign = Group::create(['club_id' => $otherClub->id, 'name' => 'Foreign', 'group_type' => 'daily']);
        $this->submit(['group_id' => $foreign->id])
            ->assertStatus(422)->assertJsonValidationErrors('group_id');
    }

    public function test_a_group_that_filled_up_is_refused_at_submission_with_its_own_message(): void
    {
        $this->fillGroup($this->daily);

        $this->submit()
            ->assertStatus(422)
            ->assertJsonPath('errors.group_id.0', PublicRegistrationController::GROUP_FULL_MESSAGE);

        $this->assertDatabaseMissing('registrations', ['phone' => '01012345678']);
    }

    public function test_manager_sets_a_groups_type_schedule_and_capacity(): void
    {
        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/groups/{$this->twoDays->id}", [
                'group_type' => 'three_days', 'capacity' => 8, 'days_of_week' => [1, 3, 5], 'start_time' => '06:00', 'end_time' => '07:00',
            ])->assertOk()
            ->assertJsonPath('group_type', 'three_days')
            ->assertJsonPath('capacity', 8)
            ->assertJsonPath('days_of_week', [1, 3, 5]);

        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/groups/{$this->twoDays->id}", ['group_type' => 'weekly'])
            ->assertStatus(422)->assertJsonValidationErrors('group_type');

        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/groups/{$this->twoDays->id}", ['start_time' => '08:00', 'end_time' => '07:00'])
            ->assertStatus(422)->assertJsonValidationErrors('end_time');

        $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/groups', ['name' => 'Plain'])
            ->assertCreated()->assertJsonPath('group_type', 'daily');
    }
}
