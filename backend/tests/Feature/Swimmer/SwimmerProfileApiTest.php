<?php

namespace Tests\Feature\Swimmer;

use App\Enums\UserRole;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\DailyEvaluation;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SwimmerProfileApiTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $swimmer;

    private SwimmerProfile $swimmerProfile;

    private User $coachUser;

    private Branch $branch;

    private SubscriptionPlan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Profile Test Club',
            'slug' => 'profile-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
            'leaderboard_enabled' => true,
            'evaluations_enabled' => true,
        ]);

        $this->branch = Branch::create([
            'club_id' => $this->club->id,
            'name' => 'Downtown Pool',
            'address' => '1 Pool St',
            'city' => 'Cairo',
            'phone' => '+20100000000',
            'working_hours' => '6am - 10pm',
        ]);

        $this->plan = SubscriptionPlan::create([
            'club_id' => $this->club->id,
            'name' => 'Quarterly',
            'duration_months' => 3,
            'price' => 1200,
        ]);

        $this->coachUser = User::create([
            'name' => 'Coach Ahmed',
            'email' => 'coach@profile-test.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $this->coachUser->id,
            'phone' => '+20111111111',
            'specialization' => 'Freestyle',
            'experience_years' => 8,
            'rating' => 4.5,
        ]);

        // Approval creates the login with a phone-derived email — mirror that
        $this->swimmer = User::create([
            'name' => 'Ali Hassan',
            'email' => 'swimmer_01000000000@club'.$this->club->id.'.craveclubs.local',
            'password' => 'password',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        $this->swimmerProfile = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $this->swimmer->id,
            'branch_id' => $this->branch->id,
            'first_name' => 'Ali',
            'last_name' => 'Hassan',
            'level' => 'Beginner',
            'date_of_birth' => '2012-05-01',
        ]);

        $group = Group::create([
            'club_id' => $this->club->id,
            'name' => 'Dolphins',
            'coach_user_id' => $this->coachUser->id,
        ]);

        GroupMembership::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'group_id' => $group->id,
            'swimmer_id' => $this->swimmerProfile->id,
        ]);

        $session = TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $group->id,
            'coach_user_id' => $this->coachUser->id,
            'date' => now()->subDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'Completed',
            'completed_at' => now()->subDay(),
        ]);

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmerProfile->id,
            'present' => true,
        ]);

        DailyEvaluation::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmerProfile->id,
            'rating' => 4,
        ]);

        LeaderboardSetting::forClub($this->club->id);
        LevelTier::seedForClub($this->club->id);
    }

    private function headers(): array
    {
        return ['X-Club-Slug' => $this->club->slug];
    }

    private function createApprovedRegistration(): Registration
    {
        $coachProfile = CoachProfile::withoutGlobalScopes()->where('user_id', $this->coachUser->id)->first();

        $registration = Registration::create([
            'club_id' => $this->club->id,
            'branch_id' => $this->branch->id,
            'coach_id' => $coachProfile->id,
            'plan_id' => $this->plan->id,
            'full_name' => 'Ali Hassan',
            'phone' => '0100 000 0000',
            'gender' => 'male',
            'birth_date' => '2012-05-01',
            'sport_ids' => [1],
            'primary_goal' => 'Compete regionally',
            'weekly_frequency' => '3x / week',
            'preferred_time' => 'Evening',
            'experience_level' => 'beginner',
            'payment_method' => 'cash',
            'status' => 'approved',
            'total_amount' => 1200,
        ]);

        // Approved one month ago → 3-month plan → ~2 months left
        Registration::where('id', $registration->id)->update([
            'updated_at' => now()->subMonth(),
        ]);

        return $registration->fresh();
    }

    public function test_profile_returns_coach_branch_group_subscription_and_stats(): void
    {
        $this->createApprovedRegistration();

        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->withHeaders($this->headers())
            ->getJson('/api/v1/swimmer/profile');

        $response->assertOk()
            ->assertJsonStructure([
                'profile' => ['id', 'first_name', 'last_name', 'level'],
                'member_since',
                'branch' => ['id', 'name', 'address', 'city', 'phone'],
                'coach' => ['id', 'name', 'phone', 'experience_years', 'rating'],
                'groups',
                'subscription' => ['plan_name', 'ends_at', 'days_left', 'progress', 'status'],
                'signup' => ['primary_goal', 'weekly_frequency', 'preferred_time'],
                'xp' => ['total_xp', 'rank', 'total_swimmers', 'current_streak', 'level' => ['name', 'progress']],
                'stats' => ['attendance_rate', 'sessions_attended', 'total_sessions', 'average_rating'],
            ])
            ->assertJsonPath('coach.name', 'Coach Ahmed')
            ->assertJsonPath('coach.phone', '+20111111111')
            ->assertJsonPath('branch.name', 'Downtown Pool')
            ->assertJsonPath('groups.0.name', 'Dolphins')
            ->assertJsonPath('subscription.plan_name', 'Quarterly')
            ->assertJsonPath('subscription.status', 'active')
            ->assertJsonPath('signup.primary_goal', 'Compete regionally')
            ->assertJsonPath('xp.rank', 1)
            ->assertJsonPath('xp.current_streak', 1)
            ->assertJsonPath('stats.sessions_attended', 1)
            ->assertJsonPath('stats.attendance_rate', 100);

        $daysLeft = $response->json('subscription.days_left');
        $this->assertGreaterThanOrEqual(55, $daysLeft);
        $this->assertLessThanOrEqual(65, $daysLeft);
    }

    public function test_subscription_is_expiring_within_14_days(): void
    {
        $registration = $this->createApprovedRegistration();
        Registration::where('id', $registration->id)->update([
            'updated_at' => now()->subMonths(3)->addDays(5),
        ]);

        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->withHeaders($this->headers())
            ->getJson('/api/v1/swimmer/profile');

        $response->assertOk()->assertJsonPath('subscription.status', 'expiring');
        $this->assertLessThanOrEqual(14, $response->json('subscription.days_left'));
    }

    public function test_profile_without_registration_has_null_subscription_but_group_coach(): void
    {
        $response = $this->actingAs($this->swimmer, 'sanctum')
            ->withHeaders($this->headers())
            ->getJson('/api/v1/swimmer/profile');

        $response->assertOk()
            ->assertJsonPath('subscription', null)
            ->assertJsonPath('signup', null)
            ->assertJsonPath('coach.name', 'Coach Ahmed');
    }

    public function test_profile_requires_swimmer_role(): void
    {
        $response = $this->actingAs($this->coachUser, 'sanctum')
            ->withHeaders($this->headers())
            ->getJson('/api/v1/swimmer/profile');

        $response->assertStatus(403);
    }
}
