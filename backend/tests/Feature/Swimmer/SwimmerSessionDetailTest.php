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
use App\Models\GroupEvaluation;
use App\Models\GroupMembership;
use App\Models\LeaderboardSetting;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The session detail page a swimmer opens from a session card.
 */
class SwimmerSessionDetailTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $swimmer;

    private SwimmerProfile $profile;

    private User $coach;

    private Group $group;

    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Detail Club',
            'slug' => 'detail-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        // The evaluations feed is feature-gated; the leak test reads it.
        ClubFeature::create([
            'club_id' => $this->club->id,
            'evaluations_enabled' => true,
        ]);

        $this->branch = Branch::create([
            'club_id' => $this->club->id,
            'name' => 'Main Pool',
            'address' => '1 Pool St',
            'city' => 'Cairo',
            'phone' => '+20100000000',
        ]);

        $this->coach = User::create([
            'name' => 'Coach Ahmed',
            'email' => 'coach@detail.test',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $this->coach->id,
            'phone' => '+20111111111',
            'specialization' => 'Freestyle',
        ]);

        $this->swimmer = User::create([
            'name' => 'Laila',
            'email' => 'swimmer_01000000000@club'.$this->club->id.'.craveclubs.local',
            'password' => 'password',
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        $this->profile = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $this->swimmer->id,
            'first_name' => 'Laila',
            'last_name' => 'Fekry',
        ]);

        $this->group = Group::create([
            'club_id' => $this->club->id,
            'name' => 'The Champions Team',
            'coach_user_id' => $this->coach->id,
        ]);

        GroupMembership::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'swimmer_id' => $this->profile->id,
        ]);

        LeaderboardSetting::forClub($this->club->id)->update(['attendance_xp' => 25]);
    }

    private function makeSession(array $overrides = []): TrainingSession
    {
        return TrainingSession::create(array_merge([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'branch_id' => $this->branch->id,
            'title' => 'Speed Day',
            'type' => 'Speed',
            'status' => 'Scheduled',
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '20:00',
            'location' => 'Main Pool',
            'notes' => 'Bring fins and a kickboard.',
            'summary_notes' => 'Ali struggled with turns.',
        ], $overrides));
    }

    private function show(TrainingSession|int $session)
    {
        $id = $session instanceof TrainingSession ? $session->id : $session;

        return $this->actingAs($this->swimmer, 'sanctum')
            ->getJson("/api/v1/swimmer/sessions/{$id}", ['X-Club-Slug' => $this->club->slug]);
    }

    public function test_returns_the_full_session_with_the_club_notes(): void
    {
        $this->show($this->makeSession())
            ->assertOk()
            ->assertJsonPath('title', 'Speed Day')
            ->assertJsonPath('notes', 'Bring fins and a kickboard.')
            ->assertJsonPath('duration_minutes', 120)
            ->assertJsonPath('group.name', 'The Champions Team')
            ->assertJsonPath('branch.name', 'Main Pool')
            ->assertJsonPath('branch.address', '1 Pool St')
            ->assertJsonPath('xp.per_attendance', 25);
    }

    public function test_coach_falls_back_to_the_group_coach(): void
    {
        // The session itself names no coach — the group's coach is shown instead.
        $this->show($this->makeSession(['coach_user_id' => null]))
            ->assertOk()
            ->assertJsonPath('coach.name', 'Coach Ahmed')
            ->assertJsonPath('coach.phone', '+20111111111');
    }

    public function test_coach_summary_notes_are_not_exposed_to_swimmers(): void
    {
        // Coaches write these with per-swimmer feedback in mind; the group must
        // not be able to read them.
        $body = $this->show($this->makeSession())->assertOk()->json();

        $this->assertArrayNotHasKey('summary_notes', $body);
        $this->assertStringNotContainsString('struggled', json_encode($body));
    }

    public function test_no_swimmer_response_leaks_coach_summary_notes(): void
    {
        // The detail page hiding them is worthless if the list, the dashboard or
        // the evaluations feed still send them, so check every swimmer route
        // that carries a session, directly or nested under an evaluation.
        $session = $this->makeSession(['date' => now()->addDay()->toDateString()]);

        DailyEvaluation::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->profile->id,
            'rating' => 4,
        ]);

        foreach (['/api/v1/swimmer/sessions', '/api/v1/swimmer/dashboard', '/api/v1/swimmer/evaluations'] as $url) {
            $body = $this->actingAs($this->swimmer, 'sanctum')
                ->getJson($url, ['X-Club-Slug' => $this->club->slug])
                ->assertOk()
                ->getContent();

            $this->assertStringContainsString('Speed Day', $body, "{$url} should include the session");
            $this->assertStringNotContainsString('summary_notes', $body, "{$url} leaks the field");
            $this->assertStringNotContainsString('struggled', $body, "{$url} leaks the coach's note");
        }
    }

    public function test_a_completed_session_carries_my_attendance_evaluation_and_xp(): void
    {
        $session = $this->makeSession(['status' => 'Completed', 'completed_at' => now()]);

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->profile->id,
            'present' => true,
        ]);

        DailyEvaluation::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->profile->id,
            'rating' => 5,
            'notes' => 'Great kick.',
        ]);

        GroupEvaluation::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'group_id' => $this->group->id,
            'rating' => 4,
            'notes' => 'Solid team effort.',
        ]);

        $this->show($session)
            ->assertOk()
            ->assertJsonPath('my_attendance.present', true)
            ->assertJsonPath('my_evaluation.rating', 5)
            ->assertJsonPath('my_evaluation.notes', 'Great kick.')
            ->assertJsonPath('group_evaluation.notes', 'Solid team effort.')
            ->assertJsonPath('xp.earned', 25);
    }

    public function test_an_absent_swimmer_earns_no_xp(): void
    {
        $session = $this->makeSession(['status' => 'Completed']);

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->profile->id,
            'present' => false,
        ]);

        $this->show($session)
            ->assertOk()
            ->assertJsonPath('my_attendance.present', false)
            ->assertJsonPath('xp.earned', 0);
    }

    public function test_an_upcoming_session_has_nothing_settled_yet(): void
    {
        $this->show($this->makeSession())
            ->assertOk()
            ->assertJsonPath('my_attendance', null)
            ->assertJsonPath('my_evaluation', null)
            ->assertJsonPath('xp.earned', null);
    }

    public function test_another_groups_session_is_not_found(): void
    {
        $otherGroup = Group::create([
            'club_id' => $this->club->id,
            'name' => 'Other Team',
        ]);

        $this->show($this->makeSession(['group_id' => $otherGroup->id]))->assertStatus(404);
    }

    public function test_a_missing_session_is_not_found(): void
    {
        $this->show(999999)->assertStatus(404);
    }
}
