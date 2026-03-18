<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PerformanceTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $coachUser;

    private array $queries = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Performance Club',
            'slug' => 'perf-club',
            'is_active' => true,
        ]);

        ClubFeature::create([
            'club_id' => $this->club->id,
            'coach_portal_enabled' => true,
            'evaluations_enabled' => true,
            'leaderboard_enabled' => true,
            'training_plans_enabled' => true,
        ]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@perf.com',
            'password' => 'Password123!',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $this->coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@perf.com',
            'password' => 'Password123!',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);
        $coachProfile = CoachProfile::withoutGlobalScopes()->create([
            'user_id' => $this->coachUser->id,
            'club_id' => $this->club->id,
            'specialization' => 'Freestyle',
        ]);

        $group = Group::withoutGlobalScopes()->create([
            'name' => 'Test Group',
            'club_id' => $this->club->id,
            'coach_user_id' => $this->coachUser->id,
        ]);

        // Pre-create leaderboard settings to avoid first-access INSERT queries during test
        LeaderboardSetting::forClub($this->club->id);
        LevelTier::forClub($this->club->id);

        // Create 10 swimmers with group memberships
        for ($i = 1; $i <= 10; $i++) {
            $swimmerUser = User::create([
                'name' => "Swimmer {$i}",
                'email' => "swimmer{$i}@perf.com",
                'password' => 'Password123!',
                'role' => UserRole::SWIMMER,
                'club_id' => $this->club->id,
            ]);
            $swimmer = SwimmerProfile::withoutGlobalScopes()->create([
                'user_id' => $swimmerUser->id,
                'club_id' => $this->club->id,
                'first_name' => 'Swimmer',
                'last_name' => "#{$i}",
            ]);
            GroupMembership::withoutGlobalScopes()->create([
                'group_id' => $group->id,
                'swimmer_id' => $swimmer->id,
                'club_id' => $this->club->id,
            ]);
        }

        // Create 5 sessions
        for ($i = 0; $i < 5; $i++) {
            TrainingSession::withoutGlobalScopes()->create([
                'group_id' => $group->id,
                'club_id' => $this->club->id,
                'title' => "Session {$i}",
                'date' => now()->addDays($i)->toDateString(),
                'start_time' => '09:00',
                'end_time' => '10:00',
                'status' => 'Scheduled',
                'type' => 'training',
            ]);
        }
    }

    /**
     * Count queries executed during a callback.
     * Returns [count, queries_array, duplicate_templates].
     */
    private function countQueries(callable $callback): array
    {
        $queries = [];
        $listener = function ($query) use (&$queries) {
            // Exclude telescope queries
            if (str_contains($query->sql, 'telescope_')) {
                return;
            }
            $queries[] = [
                'sql' => $query->sql,
                'time' => $query->time,
            ];
        };

        DB::listen($listener);
        $callback();

        // Detect N+1: group by SQL template (replace bindings with ?)
        $templates = [];
        foreach ($queries as $q) {
            $template = preg_replace('/= ?\?/', '= ?', $q['sql']);
            $template = preg_replace('/\d+/', '?', $template);
            $templates[$template] = ($templates[$template] ?? 0) + 1;
        }

        $duplicates = array_filter($templates, fn ($count) => $count > 2);

        return [count($queries), $queries, $duplicates];
    }

    // ── Test 1: Dashboard uses acceptable query count ──

    public function test_dashboard_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->manager, 'sanctum')
                ->getJson('/api/v1/club/dashboard')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(15, $count,
            "Dashboard fired {$count} queries (max 15). Queries:\n".
            implode("\n", array_map(fn ($q) => "  [{$q['time']}ms] {$q['sql']}", $queries))
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in dashboard: '.json_encode($duplicates)
        );
    }

    // ── Test 2: Sessions list uses acceptable query count ──

    public function test_sessions_list_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->manager, 'sanctum')
                ->getJson('/api/v1/club/sessions')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(8, $count,
            "Sessions fired {$count} queries (max 8)"
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in sessions: '.json_encode($duplicates)
        );
    }

    // ── Test 3: Analytics uses acceptable query count ──

    public function test_analytics_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->manager, 'sanctum')
                ->getJson('/api/v1/club/analytics')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(20, $count,
            "Analytics fired {$count} queries (max 20)"
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in analytics: '.json_encode($duplicates)
        );
    }

    // ── Test 4: Swimmers list uses acceptable query count ──

    public function test_swimmers_list_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->manager, 'sanctum')
                ->getJson('/api/v1/club/swimmers')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(8, $count,
            "Swimmers fired {$count} queries (max 8)"
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in swimmers: '.json_encode($duplicates)
        );
    }

    // ── Test 5: Coaches list uses acceptable query count ──

    public function test_coaches_list_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->manager, 'sanctum')
                ->getJson('/api/v1/club/coaches')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(8, $count,
            "Coaches fired {$count} queries (max 8)"
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in coaches: '.json_encode($duplicates)
        );
    }

    // ── Test 6: Coach dashboard uses acceptable query count ──

    public function test_coach_dashboard_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->coachUser, 'sanctum')
                ->getJson('/api/v1/coach/dashboard')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(15, $count,
            "Coach dashboard fired {$count} queries (max 15)"
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in coach dashboard: '.json_encode($duplicates)
        );
    }

    // ── Test 7: Coach sessions uses acceptable query count ──

    public function test_coach_sessions_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->coachUser, 'sanctum')
                ->getJson('/api/v1/coach/sessions')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(10, $count,
            "Coach sessions fired {$count} queries (max 10)"
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in coach sessions: '.json_encode($duplicates)
        );
    }

    // ── Test 8: Notifications uses acceptable query count ──

    public function test_notifications_uses_acceptable_query_count(): void
    {
        [$count, $queries, $duplicates] = $this->countQueries(function () {
            $this->actingAs($this->manager, 'sanctum')
                ->getJson('/api/v1/notifications')
                ->assertOk();
        });

        $this->assertLessThanOrEqual(6, $count,
            "Notifications fired {$count} queries (max 6)"
        );
        $this->assertEmpty($duplicates,
            'N+1 detected in notifications: '.json_encode($duplicates)
        );
    }
}
