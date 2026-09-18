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
