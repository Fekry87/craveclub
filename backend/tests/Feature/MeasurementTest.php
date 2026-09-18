<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\Measurement;
use App\Models\Skill;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * القياس: a coach records stroke + distance + time for a swimmer during a
 * session. Strokes and distances are the club's SWIM_TYPE / DISTANCE skills.
 */
class MeasurementTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $coach;

    private User $otherCoach;

    private Group $group;

    private Group $otherGroup;

    private SwimmerProfile $swimmer;

    private TrainingSession $session;

    private TrainingSession $otherSession;

    private Skill $freestyle;

    private Skill $fifty;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = $this->makeClub('Measure Club', 'measure-club');
        $this->manager = $this->makeUser($this->club, UserRole::CLUB_MANAGER, 'manager@measure.test');
        $this->coach = $this->makeCoach($this->club, 'coach@measure.test');
        $this->otherCoach = $this->makeCoach($this->club, 'other@measure.test');

        $this->group = Group::create(['club_id' => $this->club->id, 'name' => 'Mine', 'coach_user_id' => $this->coach->id]);
        $this->otherGroup = Group::create(['club_id' => $this->club->id, 'name' => 'Theirs', 'coach_user_id' => $this->otherCoach->id]);

        $this->swimmer = $this->makeSwimmer($this->club, 'Laila', $this->group);
        $this->session = $this->makeSession($this->club, $this->group, 'Live');
        $this->otherSession = $this->makeSession($this->club, $this->otherGroup, 'Live');

        $this->freestyle = Skill::create(['club_id' => $this->club->id, 'name' => 'Freestyle', 'type' => 'SWIM_TYPE']);
        $this->fifty = Skill::create(['club_id' => $this->club->id, 'name' => '50m', 'type' => 'DISTANCE', 'numeric_value' => 50]);
    }

    private function makeClub(string $name, string $slug): Club
    {
        $club = Club::create(['name' => $name, 'slug' => $slug, 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $club->id, 'coach_portal_enabled' => true, 'skills_enabled' => true]);

        return $club;
    }

    private function makeUser(Club $club, UserRole $role, string $email): User
    {
        return User::create(['name' => $email, 'email' => $email, 'password' => 'password', 'role' => $role, 'club_id' => $club->id]);
    }

    private function makeCoach(Club $club, string $email): User
    {
        $user = $this->makeUser($club, UserRole::COACH, $email);
        CoachProfile::withoutGlobalScopes()->create(['club_id' => $club->id, 'user_id' => $user->id, 'is_active' => true]);

        return $user;
    }

    private function makeSwimmer(Club $club, string $name, ?Group $group = null): SwimmerProfile
    {
        $swimmer = SwimmerProfile::withoutGlobalScopes()->create(['club_id' => $club->id, 'first_name' => $name, 'last_name' => 'F']);
        if ($group) {
            GroupMembership::withoutGlobalScopes()->create(['club_id' => $club->id, 'group_id' => $group->id, 'swimmer_id' => $swimmer->id]);
        }

        return $swimmer;
    }

    private function makeSession(Club $club, Group $group, string $status): TrainingSession
    {
        return TrainingSession::withoutGlobalScopes()->create([
            'club_id' => $club->id, 'group_id' => $group->id, 'type' => 'General', 'status' => $status,
            'date' => now()->toDateString(), 'start_time' => '18:00', 'end_time' => '19:00',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'swimmer_id' => $this->swimmer->id,
            'stroke_skill_id' => $this->freestyle->id,
            'distance_skill_id' => $this->fifty->id,
            'time_seconds' => 32.45,
        ], $overrides);
    }

    private function record(array $overrides = [], ?TrainingSession $session = null, ?User $as = null)
    {
        $session ??= $this->session;

        return $this->actingAs($as ?? $this->coach, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$session->id}/measurements", $this->payload($overrides));
    }

    /* ─── Recording ─── */

    public function test_a_coach_records_a_measurement_for_a_swimmer_in_their_own_session(): void
    {
        $this->record()
            ->assertStatus(201)
            ->assertJsonPath('swimmer.first_name', 'Laila')
            ->assertJsonPath('stroke_skill.name', 'Freestyle')
            ->assertJsonPath('distance_skill.numeric_value', '50.00')
            ->assertJsonPath('time_seconds', '32.45')
            ->assertJsonPath('recorded_by', $this->coach->id);

        $this->actingAs($this->coach, 'sanctum')
            ->getJson("/api/v1/coach/sessions/{$this->session->id}/measurements")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.distance_skill.name', '50m');
    }

    public function test_a_coach_cannot_touch_another_coachs_session(): void
    {
        // Same rule as every coach session route: someone else's session does not exist.
        $this->record([], $this->otherSession)->assertNotFound();
        $this->actingAs($this->coach, 'sanctum')
            ->getJson("/api/v1/coach/sessions/{$this->otherSession->id}/measurements")
            ->assertNotFound();

        $this->assertSame(0, Measurement::withoutGlobalScopes()->count());
    }

    public function test_the_swimmer_must_be_on_the_sessions_roster(): void
    {
        $outsider = $this->makeSwimmer($this->club, 'Omar', $this->otherGroup);

        $this->record(['swimmer_id' => $outsider->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['swimmer_id']);
    }

    public function test_nothing_is_recorded_before_the_session_starts(): void
    {
        $scheduled = $this->makeSession($this->club, $this->group, 'Scheduled');

        $this->record([], $scheduled)->assertStatus(422)->assertJsonValidationErrors(['session']);
    }

    public function test_the_stroke_must_be_one_of_this_clubs_swim_types(): void
    {
        $technique = Skill::create(['club_id' => $this->club->id, 'name' => 'Flip turn', 'type' => 'TECHNIQUE']);
        $elsewhere = $this->makeClub('Elsewhere', 'elsewhere');
        $foreignStroke = Skill::withoutGlobalScopes()->create(['club_id' => $elsewhere->id, 'name' => 'Butterfly', 'type' => 'SWIM_TYPE']);

        $this->record(['stroke_skill_id' => $technique->id])->assertStatus(422)->assertJsonValidationErrors(['stroke_skill_id']);
        $this->record(['stroke_skill_id' => $this->fifty->id])->assertStatus(422)->assertJsonValidationErrors(['stroke_skill_id']);
        $this->record(['stroke_skill_id' => $foreignStroke->id])->assertStatus(422)->assertJsonValidationErrors(['stroke_skill_id']);
    }

    public function test_the_distance_must_be_one_of_this_clubs_distances(): void
    {
        $elsewhere = $this->makeClub('Elsewhere', 'elsewhere');
        $foreignDistance = Skill::withoutGlobalScopes()->create(['club_id' => $elsewhere->id, 'name' => '100m', 'type' => 'DISTANCE', 'numeric_value' => 100]);

        $this->record(['distance_skill_id' => $this->freestyle->id])->assertStatus(422)->assertJsonValidationErrors(['distance_skill_id']);
        $this->record(['distance_skill_id' => $foreignDistance->id])->assertStatus(422)->assertJsonValidationErrors(['distance_skill_id']);
    }

    public function test_the_time_has_to_be_a_positive_number(): void
    {
        $this->record(['time_seconds' => 0])->assertStatus(422)->assertJsonValidationErrors(['time_seconds']);
        $this->record(['time_seconds' => 'fast'])->assertStatus(422)->assertJsonValidationErrors(['time_seconds']);
    }

    public function test_a_swimmer_can_have_several_measurements_in_one_session(): void
    {
        $this->record(['time_seconds' => 33.10])->assertStatus(201);
        $this->record(['time_seconds' => 32.45])->assertStatus(201);
        $this->record(['time_seconds' => 31.90])->assertStatus(201);

        $this->assertSame(3, Measurement::where('session_id', $this->session->id)->where('swimmer_id', $this->swimmer->id)->count());
    }

    /* ─── Deleting ─── */

    public function test_only_the_coach_who_recorded_a_measurement_can_delete_it(): void
    {
        $id = $this->record()->json('id');

        // Recorded by a colleague (say the group changed hands since).
        $colleague = $this->makeCoach($this->club, 'colleague@measure.test');
        Measurement::where('id', $id)->update(['recorded_by' => $colleague->id]);

        $this->actingAs($this->coach, 'sanctum')
            ->deleteJson("/api/v1/coach/sessions/{$this->session->id}/measurements/{$id}")
            ->assertForbidden();

        // The colleague does not coach this group any more: the session is not theirs.
        $this->actingAs($colleague, 'sanctum')
            ->deleteJson("/api/v1/coach/sessions/{$this->session->id}/measurements/{$id}")
            ->assertNotFound();

        Measurement::where('id', $id)->update(['recorded_by' => $this->coach->id]);
        $this->actingAs($this->coach, 'sanctum')
            ->deleteJson("/api/v1/coach/sessions/{$this->session->id}/measurements/{$id}")
            ->assertOk();

        $this->assertSame(0, Measurement::count());
    }

    public function test_a_measurement_is_only_deleted_through_its_own_session(): void
    {
        $id = $this->record()->json('id');
        $another = $this->makeSession($this->club, $this->group, 'Live');

        $this->actingAs($this->coach, 'sanctum')
            ->deleteJson("/api/v1/coach/sessions/{$another->id}/measurements/{$id}")
            ->assertNotFound();
    }

    /* ─── History ─── */

    public function test_the_swimmers_history_never_leaves_the_club(): void
    {
        $this->record()->assertStatus(201);

        // Another club, with a measurement of its own.
        $elsewhere = $this->makeClub('Elsewhere', 'elsewhere');
        $theirCoach = $this->makeCoach($elsewhere, 'coach@elsewhere.test');
        $theirManager = $this->makeUser($elsewhere, UserRole::CLUB_MANAGER, 'manager@elsewhere.test');
        $theirGroup = Group::withoutGlobalScopes()->create(['club_id' => $elsewhere->id, 'name' => 'G', 'coach_user_id' => $theirCoach->id]);
        $theirSwimmer = $this->makeSwimmer($elsewhere, 'Nour', $theirGroup);
        $theirSession = $this->makeSession($elsewhere, $theirGroup, 'Live');
        $theirStroke = Skill::withoutGlobalScopes()->create(['club_id' => $elsewhere->id, 'name' => 'Back', 'type' => 'SWIM_TYPE']);
        $theirDistance = Skill::withoutGlobalScopes()->create(['club_id' => $elsewhere->id, 'name' => '25m', 'type' => 'DISTANCE', 'numeric_value' => 25]);
        Measurement::withoutGlobalScopes()->create([
            'club_id' => $elsewhere->id, 'session_id' => $theirSession->id, 'swimmer_id' => $theirSwimmer->id,
            'stroke_skill_id' => $theirStroke->id, 'distance_skill_id' => $theirDistance->id,
            'time_seconds' => 20, 'recorded_by' => $theirCoach->id,
        ]);

        // Own swimmer: one row, with the session's date.
        $this->actingAs($this->coach, 'sanctum')
            ->getJson("/api/v1/coach/swimmers/{$this->swimmer->id}/measurements")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.stroke_skill.name', 'Freestyle')
            ->assertJsonPath('total', 1);

        // The other club's swimmer does not exist from here — coach or manager.
        $this->actingAs($this->coach, 'sanctum')
            ->getJson("/api/v1/coach/swimmers/{$theirSwimmer->id}/measurements")
            ->assertNotFound();
        $this->actingAs($this->manager, 'sanctum')
            ->getJson("/api/v1/club/swimmers/{$theirSwimmer->id}/measurements")
            ->assertNotFound();

        // And their manager sees only theirs.
        $this->actingAs($theirManager, 'sanctum')
            ->getJson("/api/v1/club/swimmers/{$theirSwimmer->id}/measurements")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.distance_skill.name', '25m');
    }

    public function test_a_coach_only_reads_the_history_of_swimmers_in_their_groups(): void
    {
        $theirs = $this->makeSwimmer($this->club, 'Omar', $this->otherGroup);

        $this->actingAs($this->coach, 'sanctum')
            ->getJson("/api/v1/coach/swimmers/{$theirs->id}/measurements")
            ->assertForbidden();

        $this->actingAs($this->manager, 'sanctum')
            ->getJson("/api/v1/club/swimmers/{$theirs->id}/measurements")
            ->assertOk();
    }

    /* ─── The swimmer reads their own times ─── */

    private function swimmerUser(): User
    {
        $user = $this->makeUser($this->club, UserRole::SWIMMER, 'laila@measure.test');
        $this->swimmer->update(['user_id' => $user->id]);

        return $user;
    }

    public function test_the_swimmer_sees_their_times_on_the_session_detail(): void
    {
        $user = $this->swimmerUser();
        $teammate = $this->makeSwimmer($this->club, 'Omar', $this->group);

        $this->record(['time_seconds' => 33.10])->assertStatus(201);
        $this->record(['time_seconds' => 32.45])->assertStatus(201);
        $this->record(['swimmer_id' => $teammate->id, 'time_seconds' => 40])->assertStatus(201);

        $detail = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/swimmer/sessions/{$this->session->id}")
            ->assertOk()
            ->assertJsonCount(2, 'my_measurements')
            ->assertJsonPath('my_measurements.0.time_seconds', '33.10')
            ->assertJsonPath('my_measurements.0.stroke_skill.name', 'Freestyle')
            ->assertJsonPath('my_measurements.0.distance_skill.numeric_value', '50.00');

        // Who held the stopwatch is not the swimmer's business.
        $this->assertArrayNotHasKey('recorded_by', $detail->json('my_measurements.0'));
    }

    public function test_the_swimmers_times_are_grouped_by_training_day_newest_first(): void
    {
        $user = $this->swimmerUser();
        $teammate = $this->makeSwimmer($this->club, 'Omar', $this->group);

        $earlier = $this->makeSession($this->club, $this->group, 'Completed');
        $earlier->update(['date' => now()->subDays(3)->toDateString(), 'title' => 'Speed Day']);

        $this->record(['time_seconds' => 35], $earlier)->assertStatus(201);
        $this->record(['time_seconds' => 33.10])->assertStatus(201);
        $this->record(['time_seconds' => 32.45])->assertStatus(201);
        $this->record(['swimmer_id' => $teammate->id, 'time_seconds' => 40])->assertStatus(201);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/swimmer/measurements')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('total', 2)
            ->assertJsonPath('data.0.date', now()->toDateString())
            ->assertJsonPath('data.0.count', 2)
            ->assertJsonCount(2, 'data.0.measurements')
            ->assertJsonPath('data.0.measurements.0.time_seconds', '33.10')
            ->assertJsonPath('data.1.date', now()->subDays(3)->toDateString())
            ->assertJsonPath('data.1.count', 1)
            ->assertJsonPath('data.1.measurements.0.session.title', 'Speed Day');

        // Paginated by day, never splitting one.
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/swimmer/measurements?per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('last_page', 2)
            ->assertJsonCount(2, 'data.0.measurements');
    }

    public function test_a_swimmer_without_times_gets_an_empty_list(): void
    {
        $this->actingAs($this->swimmerUser(), 'sanctum')
            ->getJson('/api/v1/swimmer/measurements')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('total', 0);
    }

    public function test_progress_averages_pace_per_50m_by_iso_week_and_stroke(): void
    {
        $user = $this->swimmerUser();
        $backstroke = Skill::create(['club_id' => $this->club->id, 'name' => 'Backstroke', 'type' => 'SWIM_TYPE']);
        $hundred = Skill::create(['club_id' => $this->club->id, 'name' => '100m', 'type' => 'DISTANCE', 'numeric_value' => 100]);

        // Monday-anchored weeks around a fixed date.
        \Carbon\Carbon::setTestNow('2026-09-18 12:00:00'); // a Friday; week starts 2026-09-14
        $thisWeek = $this->makeSession($this->club, $this->group, 'Completed');
        $lastWeek = $this->makeSession($this->club, $this->group, 'Completed');
        $lastWeek->update(['date' => '2026-09-09']); // Wednesday of the week starting 2026-09-07

        // Last week: 50m in 36.00 (pace 36) and 100m in 76.00 (pace 38) → avg 37.
        $this->record(['time_seconds' => 36], $lastWeek)->assertStatus(201);
        $this->record(['time_seconds' => 76, 'distance_skill_id' => $hundred->id], $lastWeek)->assertStatus(201);
        // This week, faster: 50m in 33.00 → avg 33. And one backstroke, kept apart.
        $this->record(['time_seconds' => 33])->assertStatus(201);
        $this->record(['time_seconds' => 45, 'stroke_skill_id' => $backstroke->id])->assertStatus(201);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/swimmer/measurements/progress?period=week')
            ->assertOk()
            ->assertJsonPath('period', 'week')
            ->assertJsonPath('points.0.start', '2026-09-07')
            ->assertJsonPath('points.1.start', '2026-09-14')
            ->assertJsonCount(2, 'points');

        $strokes = collect($response->json('strokes'))->pluck('name')->all();
        $this->assertSame(['Backstroke', 'Freestyle'], $strokes);

        $freestyleId = $this->freestyle->id;
        $week1 = collect($response->json('points.0.entries'))->firstWhere('stroke_id', $freestyleId);
        $this->assertSame(2, $week1['count']);
        $this->assertEqualsWithDelta(37.0, $week1['avg_pace'], 0.001);

        $week2Free = collect($response->json('points.1.entries'))->firstWhere('stroke_id', $freestyleId);
        $week2Back = collect($response->json('points.1.entries'))->firstWhere('stroke_id', $backstroke->id);
        $this->assertEqualsWithDelta(33.0, $week2Free['avg_pace'], 0.001);
        $this->assertEqualsWithDelta(45.0, $week2Back['avg_pace'], 0.001);

        \Carbon\Carbon::setTestNow();
    }

    public function test_progress_buckets_by_day_and_by_month(): void
    {
        $user = $this->swimmerUser();

        $sepA = $this->makeSession($this->club, $this->group, 'Completed');
        $sepA->update(['date' => '2026-09-14']);
        $sepB = $this->makeSession($this->club, $this->group, 'Completed');
        $sepB->update(['date' => '2026-09-16']);
        $aug = $this->makeSession($this->club, $this->group, 'Completed');
        $aug->update(['date' => '2026-08-20']);

        $this->record(['time_seconds' => 30], $sepA)->assertStatus(201); // 2026-09-14
        $this->record(['time_seconds' => 34], $sepB)->assertStatus(201); // 2026-09-16
        $this->record(['time_seconds' => 40], $aug)->assertStatus(201);  // 2026-08-20

        // By day: three separate points, ascending.
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/swimmer/measurements/progress?period=day')
            ->assertOk()
            ->assertJsonPath('period', 'day')
            ->assertJsonCount(3, 'points')
            ->assertJsonPath('points.0.start', '2026-08-20')
            ->assertJsonPath('points.1.start', '2026-09-14')
            ->assertJsonPath('points.2.start', '2026-09-16');

        // By month: August (one) and September (two → avg 32), anchored to the 1st.
        $month = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/swimmer/measurements/progress?period=month')
            ->assertOk()
            ->assertJsonPath('period', 'month')
            ->assertJsonCount(2, 'points')
            ->assertJsonPath('points.0.start', '2026-08-01')
            ->assertJsonPath('points.1.start', '2026-09-01');

        $sepEntry = collect($month->json('points.1.entries'))->firstWhere('stroke_id', $this->freestyle->id);
        $this->assertSame(2, $sepEntry['count']);
        $this->assertEqualsWithDelta(32.0, $sepEntry['avg_pace'], 0.001);
    }

    public function test_progress_rejects_an_unknown_period(): void
    {
        $this->actingAs($this->swimmerUser(), 'sanctum')
            ->getJson('/api/v1/swimmer/measurements/progress?period=fortnight')
            ->assertStatus(422);
    }

    public function test_progress_is_empty_without_measurements_and_rides_on_the_skills_feature(): void
    {
        $user = $this->swimmerUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/swimmer/measurements/progress')
            ->assertOk()
            ->assertJsonPath('period', 'week')
            ->assertJsonCount(0, 'points')
            ->assertJsonCount(0, 'strokes');

        ClubFeature::where('club_id', $this->club->id)->update(['skills_enabled' => false]);
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/swimmer/measurements/progress')
            ->assertForbidden();
    }

    /* ─── Options (the Skills page) ─── */

    public function test_a_distance_skill_is_created_with_its_meters_and_offered_to_the_coach(): void
    {
        $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/skills', ['name' => '100m', 'type' => 'DISTANCE', 'numeric_value' => 100])
            ->assertStatus(201)
            ->assertJsonPath('type', 'DISTANCE')
            ->assertJsonPath('numeric_value', '100.00');

        $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/skills?type=DISTANCE')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $options = $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/measurement-options')
            ->assertOk();

        $this->assertSame(['Freestyle'], array_column($options->json('strokes'), 'name'));
        $this->assertSame(['50m', '100m'], array_column($options->json('distances'), 'name'), 'shortest first');
    }

    public function test_a_distance_needs_its_meters_and_other_types_never_keep_a_number(): void
    {
        $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/skills', ['name' => 'No meters', 'type' => 'DISTANCE'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['numeric_value']);

        $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/skills', ['name' => 'Kick', 'type' => 'SKILL', 'numeric_value' => 50])
            ->assertStatus(201)
            ->assertJsonPath('numeric_value', null);

        // Editing a distance's meters, then turning an unused one into another type.
        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/skills/{$this->fifty->id}", ['numeric_value' => 55])
            ->assertOk()
            ->assertJsonPath('numeric_value', '55.00');
        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/skills/{$this->fifty->id}", ['type' => 'SKILL'])
            ->assertOk()
            ->assertJsonPath('numeric_value', null);
    }

    public function test_an_option_with_recorded_times_cannot_be_deleted_or_retyped(): void
    {
        $this->record()->assertStatus(201);

        $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/skills/{$this->fifty->id}")
            ->assertStatus(422);
        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/skills/{$this->freestyle->id}", ['type' => 'TECHNIQUE'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['type']);

        // Renaming is still fine.
        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/skills/{$this->freestyle->id}", ['name' => 'Front crawl'])
            ->assertOk();

        $this->assertNotNull(Skill::find($this->fifty->id));
    }

    public function test_measurements_ride_on_the_skills_feature(): void
    {
        ClubFeature::where('club_id', $this->club->id)->update(['skills_enabled' => false]);

        $this->actingAs($this->coach, 'sanctum')->getJson('/api/v1/coach/measurement-options')->assertForbidden();
        $this->record()->assertForbidden();
    }
}
