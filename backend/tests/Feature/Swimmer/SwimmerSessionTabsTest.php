<?php

namespace Tests\Feature\Swimmer;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Sessions tabs are filtered and counted on the server, so what a tab shows
 * no longer depends on which pages the app happens to have loaded.
 */
class SwimmerSessionTabsTest extends TestCase
{
    use RefreshDatabase;

    private User $swimmer;

    private Group $group;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-17 12:00:00');

        $this->club = Club::create(['name' => 'Tabs Club', 'slug' => 'tabs-club', 'is_active' => true, 'max_branches' => 5]);
        $this->swimmer = User::create([
            'name' => 'Laila', 'email' => 'laila@tabs.test', 'password' => 'password',
            'role' => UserRole::SWIMMER, 'club_id' => $this->club->id,
        ]);
        $profile = SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id, 'user_id' => $this->swimmer->id, 'first_name' => 'Laila', 'last_name' => 'F',
        ]);
        $this->group = Group::create(['club_id' => $this->club->id, 'name' => 'Champions']);
        GroupMembership::withoutGlobalScopes()->create([
            'club_id' => $this->club->id, 'group_id' => $this->group->id, 'swimmer_id' => $profile->id,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeSession(string $date, string $status, string $title, string $start = '18:00'): TrainingSession
    {
        return TrainingSession::create([
            'club_id' => $this->club->id, 'group_id' => $this->group->id, 'title' => $title, 'type' => 'General',
            'status' => $status, 'date' => $date, 'start_time' => $start, 'end_time' => '19:00',
        ]);
    }

    private function tab(array $params)
    {
        return $this->actingAs($this->swimmer, 'sanctum')
            ->getJson('/api/v1/swimmer/sessions?'.http_build_query($params))
            ->assertOk();
    }

    private function titles($response): array
    {
        return array_column($response->json('data'), 'title');
    }

    public function test_completed_sessions_are_on_the_first_page_however_many_future_sessions_exist(): void
    {
        // The reported case: 22 generated future sessions pushed the finished
        // ones past page one, so the Completed tab showed 0.
        for ($d = 1; $d <= 22; $d++) {
            $this->makeSession(Carbon::parse('2026-09-17')->addDays($d)->toDateString(), 'Scheduled', "Future {$d}");
        }
        $this->makeSession('2026-09-10', 'Completed', 'Done A');
        $this->makeSession('2026-09-12', 'Completed', 'Done B');

        $completed = $this->tab(['scope' => 'completed', 'today' => '2026-09-17']);
        $this->assertSame(['Done B', 'Done A'], $this->titles($completed));
        $completed->assertJsonPath('counts.completed', 2)
            ->assertJsonPath('counts.upcoming', 22)
            ->assertJsonPath('counts.all', 24);

        $upcoming = $this->tab(['scope' => 'upcoming', 'today' => '2026-09-17']);
        $this->assertSame('Future 1', $upcoming->json('data.0.title'), 'soonest first');
        $upcoming->assertJsonPath('total', 22)->assertJsonPath('last_page', 2);
    }

    public function test_cancelled_sessions_stay_upcoming_until_their_day_passes(): void
    {
        $this->makeSession('2026-09-17', 'Cancelled', 'Cancelled today');
        $this->makeSession('2026-09-20', 'Cancelled', 'Cancelled later');
        $this->makeSession('2026-09-15', 'Cancelled', 'Cancelled before');
        $this->makeSession('2026-09-16', 'Live', 'Still live');
        $this->makeSession('2026-09-14', 'Scheduled', 'Never started');

        $this->assertEqualsCanonicalizing(
            ['Still live', 'Cancelled today', 'Cancelled later'],
            $this->titles($this->tab(['scope' => 'upcoming', 'today' => '2026-09-17'])),
        );
        $this->assertSame(['Cancelled before'], $this->titles($this->tab(['scope' => 'completed', 'today' => '2026-09-17'])));

        // A session that was never started or cancelled belongs to neither tab,
        // but All still lists it.
        $this->assertContains('Never started', $this->titles($this->tab(['scope' => 'all', 'today' => '2026-09-17'])));
    }

    public function test_all_lists_upcoming_soonest_first_then_the_past_most_recent_first(): void
    {
        $this->makeSession('2026-09-10', 'Completed', 'Past old');
        $this->makeSession('2026-09-30', 'Scheduled', 'Future far');
        $this->makeSession('2026-09-16', 'Completed', 'Past recent');
        $this->makeSession('2026-09-18', 'Scheduled', 'Future near');

        $this->assertSame(
            ['Future near', 'Future far', 'Past recent', 'Past old'],
            $this->titles($this->tab(['scope' => 'all', 'today' => '2026-09-17'])),
        );
    }

    public function test_today_uses_the_devices_date_within_a_day_of_the_server(): void
    {
        // 01:00 in Cairo is still the previous day in UTC.
        Carbon::setTestNow('2026-09-16 22:00:00');
        $this->makeSession('2026-09-17', 'Scheduled', 'Morning swim', '07:00');
        $this->makeSession('2026-09-16', 'Completed', 'Yesterday');

        $this->assertSame(['Morning swim'], $this->titles($this->tab(['scope' => 'today', 'today' => '2026-09-17'])));

        // A far-off claimed date is ignored in favour of the server's.
        $this->assertSame(['Yesterday'], $this->titles($this->tab(['scope' => 'today', 'today' => '2026-12-25'])));
    }

    public function test_requests_without_a_scope_behave_as_before(): void
    {
        $this->makeSession('2026-09-10', 'Completed', 'Old');
        $this->makeSession('2026-09-20', 'Scheduled', 'New');

        $this->assertSame(['New', 'Old'], $this->titles($this->tab([])));
    }

    public function test_invalid_parameters_are_rejected(): void
    {
        $this->actingAs($this->swimmer, 'sanctum')->getJson('/api/v1/swimmer/sessions?scope=everything')->assertStatus(422);
        $this->actingAs($this->swimmer, 'sanctum')->getJson('/api/v1/swimmer/sessions?per_page=5000')->assertStatus(422);
        $this->actingAs($this->swimmer, 'sanctum')->getJson('/api/v1/swimmer/sessions?today=17-09-2026')->assertStatus(422);
    }
}
