<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoachScheduleTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $manager;
    private CoachProfile $coachProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Schedule Test Club',
            'slug' => 'schedule-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create(['club_id' => $this->club->id]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@scheduletest.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);

        $coachUser = User::create([
            'name' => 'Coach',
            'email' => 'coach@scheduletest.com',
            'password' => 'password',
            'role' => UserRole::COACH,
            'club_id' => $this->club->id,
        ]);

        $this->coachProfile = CoachProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id,
            'user_id' => $coachUser->id,
        ]);
    }

    public function test_schedule_show_returns_coach_schedules(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson("/api/v1/club/coaches/{$this->coachProfile->id}/schedule");

        $response->assertOk();
    }

    public function test_schedule_update_upserts_day(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/coaches/{$this->coachProfile->id}/schedule", [
                'schedules' => [
                    [
                        'day_of_week' => 'Monday',
                        'slots' => [
                            ['time' => '09:00', 'is_available' => true, 'max_capacity' => 10],
                        ],
                    ],
                ],
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('coach_schedules', [
            'coach_id' => $this->coachProfile->id,
            'day_of_week' => 'Monday',
        ]);
    }

    public function test_schedule_update_validates_structure(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/coaches/{$this->coachProfile->id}/schedule", [
                'schedules' => 'invalid',
            ]);

        $response->assertStatus(422);
    }
}
