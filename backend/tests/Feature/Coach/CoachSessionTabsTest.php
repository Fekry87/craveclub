<?php

namespace Tests\Feature\Coach;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The coach app's Sessions tabs are filtered and counted on the server, like
 * the swimmer's: what a tab shows must not depend on which pages the app
 * happens to have loaded.
 */
class CoachSessionTabsTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $coach;

    private Group $group;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-18 12:00:00');

        $this->club = Club::create(['name' => 'Coach Tabs Club', 'slug' => 'coach-tabs-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id, 'coach_portal_enabled' => true]);
        $this->coach = User::create([
            'name' => 'Mahmoud', 'email' => 'coach@tabs.test', 'password' => 'password',
            'role' => UserRole::COACH, 'club_id' => $this->club->id,
        ]);
        CoachProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $this->coach->id, 'is_active' => true]);
        $this->group = Group::create(['club_id' => $this->club->id, 'name' => 'Champions', 'coach_user_id' => $this->coach->id]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeSession(string $date, string $status, string $title, ?Group $group = null): TrainingSession
    {
        return TrainingSession::create([
            'club_id' => $this->club->id, 'group_id' => ($group ?? $this->group)->id, 'coach_user_id' => $this->coach->id,
            'title' => $title, 'type' => 'General', 'status' => $status,
            'date' => $date, 'start_time' => '18:00', 'end_time' => '19:00',
        ]);
    }

    private function tab(array $params)
    {
        return $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/sessions?'.http_build_query($params))
            ->assertOk();
    }

    private function titles($response): array
    {
        return array_column($response->json('data'), 'title');
    }

    public function test_completed_sessions_are_on_the_first_page_however_many_future_sessions_exist(): void
    {
        // The reported case: 20 generated future sessions filled page one, so
        // the app's Completed tab read 0 until the coach scrolled.
        for ($d = 1; $d <= 22; $d++) {
            $this->makeSession(Carbon::parse('2026-09-18')->addDays($d)->toDateString(), 'Scheduled', "Future {$d}");
        }
        $this->makeSession('2026-09-10', 'Completed', 'Done A');
        $this->makeSession('2026-09-12', 'Completed', 'Done B');

        $completed = $this->tab(['scope' => 'completed', 'today' => '2026-09-18', 'per_page' => 20]);
        $this->assertSame(['Done B', 'Done A'], $this->titles($completed));
        $completed->assertJsonPath('counts.completed', 2)
            ->assertJsonPath('counts.upcoming', 22)
            ->assertJsonPath('counts.all', 24);

        $upcoming = $this->tab(['scope' => 'upcoming', 'today' => '2026-09-18', 'per_page' => 20]);
        $this->assertSame('Future 1', $upcoming->json('data.0.title'), 'soonest first');
        $upcoming->assertJsonPath('total', 22)->assertJsonPath('last_page', 2);
    }

    public function test_all_lists_upcoming_soonest_first_then_the_past_most_recent_first(): void
    {
        $this->makeSession('2026-09-10', 'Completed', 'Past old');
        $this->makeSession('2026-09-30', 'Scheduled', 'Future far');
        $this->makeSession('2026-09-14', 'Scheduled', 'Never started');
        $this->makeSession('2026-09-19', 'Scheduled', 'Future near');

        $all = $this->tab(['scope' => 'all', 'today' => '2026-09-18']);
        $this->assertSame(['Future near', 'Future far', 'Never started', 'Past old'], $this->titles($all));

        // A past session nobody started is in neither tab, only under All.
        $all->assertJsonPath('counts.all', 4)
            ->assertJsonPath('counts.upcoming', 2)
            ->assertJsonPath('counts.completed', 1);
    }

    public function test_tabs_only_count_this_coachs_groups(): void
    {
        $other = User::create([
            'name' => 'Other', 'email' => 'other@tabs.test', 'password' => 'password',
            'role' => UserRole::COACH, 'club_id' => $this->club->id,
        ]);
        $othersGroup = Group::create(['club_id' => $this->club->id, 'name' => 'Others', 'coach_user_id' => $other->id]);
        $this->makeSession('2026-09-20', 'Scheduled', 'Not mine', $othersGroup);
        $this->makeSession('2026-09-20', 'Scheduled', 'Mine');

        $upcoming = $this->tab(['scope' => 'upcoming', 'today' => '2026-09-18']);
        $this->assertSame(['Mine'], $this->titles($upcoming));
        $upcoming->assertJsonPath('counts.all', 1);
    }

    public function test_requests_without_a_scope_behave_as_before(): void
    {
        // The portal and the app's calendar: newest first, status counts, no tab counts.
        $this->makeSession('2026-09-10', 'Completed', 'Old');
        $this->makeSession('2026-09-20', 'Scheduled', 'New');

        $response = $this->tab([]);
        $this->assertSame(['New', 'Old'], $this->titles($response));
        $response->assertJsonPath('status_counts.all', 2)->assertJsonMissingPath('counts');

        $this->assertSame(['Old'], $this->titles($this->tab(['from' => '2026-09-01', 'to' => '2026-09-15'])));
    }

    public function test_an_unknown_scope_is_rejected(): void
    {
        $this->actingAs($this->coach, 'sanctum')->getJson('/api/v1/coach/sessions?scope=everything')->assertStatus(422);
        $this->actingAs($this->coach, 'sanctum')->getJson('/api/v1/coach/sessions?today=18-09-2026')->assertStatus(422);
    }
}
