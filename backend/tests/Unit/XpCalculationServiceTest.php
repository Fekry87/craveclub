<?php

namespace Tests\Unit;

use App\Models\Attendance;
use App\Models\Club;
use App\Models\DailyEvaluation;
use App\Models\Group;
use App\Models\LeaderboardSetting;
use App\Models\LevelTier;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use App\Enums\UserRole;
use App\Services\XpCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class XpCalculationServiceTest extends TestCase
{
    use RefreshDatabase;

    private XpCalculationService $service;
    private Club $club;
    private SwimmerProfile $swimmer;
    private LeaderboardSetting $settings;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new XpCalculationService();

        $this->club = Club::create([
            'name' => 'Test Club',
            'slug' => 'test-club',
        ]);

        $user = User::create([
            'name' => 'Test Swimmer',
            'email' => 'swimmer@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::SWIMMER,
            'club_id' => $this->club->id,
        ]);

        $this->swimmer = SwimmerProfile::create([
            'club_id' => $this->club->id,
            'user_id' => $user->id,
            'first_name' => 'Test',
            'last_name' => 'Swimmer',
        ]);

        $this->settings = LeaderboardSetting::forClub($this->club->id);
    }

    public function test_zero_xp_with_no_data(): void
    {
        $result = $this->service->computeForSwimmer(
            $this->swimmer->id,
            $this->club->id,
            $this->settings
        );

        $this->assertEquals(0, $result['total_xp']);
        $this->assertEquals(0, $result['rating_xp']);
        $this->assertEquals(0, $result['attendance_xp']);
        $this->assertEquals(0, $result['streak_xp']);
    }

    public function test_rating_xp_calculation(): void
    {
        // Create evaluations with rating 5
        DailyEvaluation::create([
            'club_id' => $this->club->id,
            'swimmer_id' => $this->swimmer->id,
            'session_id' => $this->createSession()->id,
            'coach_user_id' => $this->createCoachUser()->id,
            'rating' => 5,
        ]);

        $result = $this->service->computeForSwimmer(
            $this->swimmer->id,
            $this->club->id,
            $this->settings
        );

        $this->assertEquals($this->settings->rating_xp_5, $result['rating_xp']);
    }

    public function test_attendance_xp_calculation(): void
    {
        $session = $this->createSession();

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmer->id,
            'present' => true,
        ]);

        $result = $this->service->computeForSwimmer(
            $this->swimmer->id,
            $this->club->id,
            $this->settings
        );

        $this->assertEquals($this->settings->attendance_xp, $result['attendance_xp']);
    }

    public function test_absent_does_not_earn_attendance_xp(): void
    {
        $session = $this->createSession();

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmer->id,
            'present' => false,
        ]);

        $result = $this->service->computeForSwimmer(
            $this->swimmer->id,
            $this->club->id,
            $this->settings
        );

        $this->assertEquals(0, $result['attendance_xp']);
    }

    public function test_get_level_from_tiers(): void
    {
        $tiers = LevelTier::forClub($this->club->id)->toArray();

        // 0 XP should be first tier
        $level = $this->service->getLevelFromTiers(0, $tiers);
        $this->assertEquals(0, $level['xp_threshold']);

        // 999 XP should be < 1000 tier
        $level = $this->service->getLevelFromTiers(999, $tiers);
        $this->assertLessThanOrEqual(999, $level['xp_threshold']);

        // Very high XP should be top tier
        $level = $this->service->getLevelFromTiers(99999, $tiers);
        $topTier = end($tiers);
        $this->assertEquals($topTier['name'], $level['name']);
    }

    public function test_get_top_swimmers_returns_correct_count(): void
    {
        // Create 3 more swimmers
        for ($i = 0; $i < 3; $i++) {
            SwimmerProfile::create([
                'club_id' => $this->club->id,
                'first_name' => "Swimmer{$i}",
                'last_name' => 'Test',
            ]);
        }

        $top = $this->service->getTopSwimmers($this->club->id, 2);
        $this->assertCount(2, $top);
    }

    public function test_total_xp_is_sum_of_components(): void
    {
        $session = $this->createSession();
        $coachUser = $this->createCoachUser();

        Attendance::create([
            'club_id' => $this->club->id,
            'session_id' => $session->id,
            'swimmer_id' => $this->swimmer->id,
            'present' => true,
        ]);

        DailyEvaluation::create([
            'club_id' => $this->club->id,
            'swimmer_id' => $this->swimmer->id,
            'session_id' => $session->id,
            'coach_user_id' => $coachUser->id,
            'rating' => 3,
        ]);

        $result = $this->service->computeForSwimmer(
            $this->swimmer->id,
            $this->club->id,
            $this->settings
        );

        $this->assertEquals(
            $result['rating_xp'] + $result['attendance_xp'] + $result['streak_xp'],
            $result['total_xp']
        );
    }

    private function createSession(): TrainingSession
    {
        $group = Group::firstOrCreate([
            'club_id' => $this->club->id,
            'name' => 'Test Group',
        ]);

        return TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $group->id,
            'title' => 'Test Session',
            'date' => now()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'scheduled',
        ]);
    }

    private function createCoachUser(): User
    {
        static $counter = 0;
        $counter++;
        return User::create([
            'name' => "Coach {$counter}",
            'email' => "coach{$counter}@test.com",
            'password' => bcrypt('password'),
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);
    }
}
