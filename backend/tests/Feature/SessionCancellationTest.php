<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\Notification;
use App\Models\SessionExclusion;
use App\Models\SessionSwimmer;
use App\Models\SwimmerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sessions are cancelled with a reason, never deleted, and everyone on the
 * roster is told.
 */
class SessionCancellationTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $coach;

    private User $manager;

    private Group $group;

    /** @var array<string, User> */
    private array $swimmers = [];

    private TrainingSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create(['name' => 'Cancel Club', 'slug' => 'cancel-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id, 'coach_portal' => true]);

        $this->coach = $this->user('Coach Omar', 'coach@cancel.test', UserRole::COACH);
        CoachProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $this->coach->id]);
        $this->manager = $this->user('Manager Mona', 'manager@cancel.test', UserRole::CLUB_MANAGER);

        $this->group = Group::create(['club_id' => $this->club->id, 'name' => 'Sharks', 'coach_user_id' => $this->coach->id]);

        foreach (['member', 'excluded', 'extra'] as $key) {
            $this->swimmers[$key] = $this->user(ucfirst($key), "{$key}@cancel.test", UserRole::SWIMMER);
        }

        $this->session = TrainingSession::create([
            'club_id' => $this->club->id,
            'group_id' => $this->group->id,
            'coach_user_id' => $this->coach->id,
            'title' => 'Speed Day',
            'type' => 'Speed',
            'status' => 'Scheduled',
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '19:30',
        ]);

        $member = $this->profile($this->swimmers['member']);
        $excluded = $this->profile($this->swimmers['excluded']);
        $extra = $this->profile($this->swimmers['extra']);
        foreach ([$member, $excluded] as $profile) {
            GroupMembership::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'group_id' => $this->group->id, 'swimmer_id' => $profile->id]);
        }
        SessionExclusion::create(['club_id' => $this->club->id, 'session_id' => $this->session->id, 'swimmer_id' => $excluded->id]);
        SessionSwimmer::create(['club_id' => $this->club->id, 'session_id' => $this->session->id, 'swimmer_id' => $extra->id]);
    }

    private function user(string $name, string $email, UserRole $role): User
    {
        return User::create(['name' => $name, 'email' => $email, 'password' => 'password', 'role' => $role, 'club_id' => $this->club->id]);
    }

    private function profile(User $user): SwimmerProfile
    {
        return SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $this->club->id, 'user_id' => $user->id, 'first_name' => $user->name, 'last_name' => 'Test',
        ]);
    }

    private function coachCancel(array $body = ['reason' => 'Pool closed for maintenance'], ?TrainingSession $session = null)
    {
        $id = ($session ?? $this->session)->id;

        return $this->actingAs($this->coach, 'sanctum')->postJson("/api/v1/coach/sessions/{$id}/cancel", $body);
    }

    private function cancelledNotificationsFor(User $user)
    {
        return Notification::where('user_id', $user->id)->where('type', 'session_cancelled')->get();
    }

    public function test_cancelling_keeps_the_record_with_the_reason_time_and_author(): void
    {
        $this->coachCancel()->assertOk()
            ->assertJsonPath('status', 'Cancelled')
            ->assertJsonPath('cancellation_reason', 'Pool closed for maintenance')
            ->assertJsonPath('cancelled_by.name', 'Coach Omar');

        $fresh = TrainingSession::withTrashed()->find($this->session->id);
        $this->assertNull($fresh->deleted_at);
        $this->assertSame('Cancelled', $fresh->status);
        $this->assertNotNull($fresh->cancelled_at);
        $this->assertSame($this->coach->id, $fresh->cancelled_by_user_id);
    }

    public function test_a_reason_is_required(): void
    {
        $this->coachCancel([])->assertStatus(422)->assertJsonValidationErrors('reason');
        $this->coachCancel(['reason' => '   '])->assertStatus(422);

        $this->assertSame('Scheduled', $this->session->fresh()->status);
    }

    public function test_the_roster_is_notified_with_the_reason_and_excluded_swimmers_are_not(): void
    {
        $this->coachCancel()->assertOk();

        foreach (['member', 'extra'] as $key) {
            $notes = $this->cancelledNotificationsFor($this->swimmers[$key]);
            $this->assertCount(1, $notes, "{$key} should be notified");
            $this->assertStringContainsString('Speed Day', $notes[0]->body);
            $this->assertStringContainsString('Pool closed for maintenance', $notes[0]->body);
            $this->assertSame($this->session->id, $notes[0]->data['session_id']);
        }

        $this->assertCount(0, $this->cancelledNotificationsFor($this->swimmers['excluded']));
        // The coach cancelled it themselves, so there is nothing to tell them.
        $this->assertCount(0, $this->cancelledNotificationsFor($this->coach));
    }

    public function test_only_scheduled_sessions_can_be_cancelled_and_nobody_is_notified_twice(): void
    {
        $this->coachCancel()->assertOk();
        $this->coachCancel(['reason' => 'Again'])->assertStatus(422);
        $this->assertCount(1, $this->cancelledNotificationsFor($this->swimmers['member']));
        $this->assertSame('Pool closed for maintenance', $this->session->fresh()->cancellation_reason);

        foreach (['Live', 'Completed'] as $status) {
            $other = $this->session->replicate()->fill(['status' => $status]);
            $other->save();
            $this->coachCancel(['reason' => 'x'], $other)->assertStatus(422);
            $this->assertSame($status, $other->fresh()->status);
        }
    }

    public function test_sessions_can_no_longer_be_deleted_by_coach_or_manager(): void
    {
        $this->actingAs($this->coach, 'sanctum')
            ->deleteJson("/api/v1/coach/sessions/{$this->session->id}")
            ->assertStatus(405);
        $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/sessions/{$this->session->id}")
            ->assertStatus(405);

        $this->assertNull(TrainingSession::withTrashed()->find($this->session->id)->deleted_at);
    }

    public function test_a_coach_cannot_cancel_another_coachs_session(): void
    {
        $other = $this->user('Coach Other', 'other@cancel.test', UserRole::COACH);
        CoachProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $other->id]);

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/coach/sessions/{$this->session->id}/cancel", ['reason' => 'x'])
            ->assertStatus(404);

        $this->assertSame('Scheduled', $this->session->fresh()->status);
    }

    public function test_a_manager_cancelling_tells_the_coach_as_well(): void
    {
        $this->actingAs($this->manager, 'sanctum')
            ->postJson("/api/v1/club/sessions/{$this->session->id}/cancel", ['reason' => 'Club event'])
            ->assertOk()
            ->assertJsonPath('cancelled_by.name', 'Manager Mona');

        $this->assertCount(1, $this->cancelledNotificationsFor($this->coach));
        $this->assertCount(1, $this->cancelledNotificationsFor($this->swimmers['member']));
    }

    public function test_a_manager_cannot_cancel_another_clubs_session(): void
    {
        $otherClub = Club::create(['name' => 'Other', 'slug' => 'other', 'is_active' => true, 'max_branches' => 1]);
        $otherGroup = Group::withoutGlobalScopes()->create(['club_id' => $otherClub->id, 'name' => 'Theirs']);
        $foreign = TrainingSession::withoutGlobalScopes()->create([
            'club_id' => $otherClub->id, 'group_id' => $otherGroup->id, 'status' => 'Scheduled', 'type' => 'Speed',
            'date' => now()->toDateString(), 'start_time' => '10:00', 'end_time' => '11:00',
        ]);

        $this->actingAs($this->manager, 'sanctum')
            ->postJson("/api/v1/club/sessions/{$foreign->id}/cancel", ['reason' => 'x'])
            ->assertStatus(404);

        $this->assertSame('Scheduled', TrainingSession::withoutGlobalScopes()->find($foreign->id)->status);
    }

    public function test_the_manager_lists_done_and_cancelled_sessions_with_the_reason(): void
    {
        $done = $this->session->replicate()->fill(['status' => 'Completed', 'title' => 'Done Day']);
        $done->save();
        $this->coachCancel()->assertOk();
        $upcoming = $this->session->replicate()->fill(['status' => 'Scheduled', 'title' => 'Next Day', 'cancellation_reason' => null]);
        $upcoming->save();

        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/sessions?status=Completed,Cancelled')
            ->assertOk()
            ->assertJsonPath('status_counts.Completed', 1)
            ->assertJsonPath('status_counts.Cancelled', 1)
            ->assertJsonPath('status_counts.Scheduled', 1);

        $rows = collect($response->json('data'))->keyBy('title');
        $this->assertEqualsCanonicalizing(['Done Day', 'Speed Day'], $rows->keys()->all());
        $this->assertSame('Pool closed for maintenance', $rows['Speed Day']['cancellation_reason']);
        $this->assertSame('Coach Omar', $rows['Speed Day']['cancelled_by']['name']);
    }

    public function test_swimmers_still_see_the_cancelled_session_with_its_reason(): void
    {
        $this->coachCancel()->assertOk();
        $swimmer = $this->swimmers['member'];

        $row = collect($this->actingAs($swimmer, 'sanctum')->getJson('/api/v1/swimmer/sessions')->assertOk()->json('data'))
            ->firstWhere('id', $this->session->id);
        $this->assertSame('Cancelled', $row['status']);
        $this->assertSame('Pool closed for maintenance', $row['cancellation_reason']);
        $this->assertArrayNotHasKey('cancelled_by_user_id', $row);

        $this->actingAs($swimmer, 'sanctum')->getJson("/api/v1/swimmer/sessions/{$this->session->id}")
            ->assertOk()
            ->assertJsonPath('status', 'Cancelled')
            ->assertJsonPath('cancellation_reason', 'Pool closed for maintenance');

        $upcoming = collect($this->actingAs($swimmer, 'sanctum')->getJson('/api/v1/swimmer/dashboard')->assertOk()->json('upcoming_sessions'));
        $this->assertSame('Cancelled', $upcoming->firstWhere('id', $this->session->id)['status']);
    }
}
