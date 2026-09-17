<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Events\SwimmerAwarded;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\LeaderboardSetting;
use App\Models\SwimmerAward;
use App\Models\SwimmerProfile;
use App\Models\User;
use App\Services\XpCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/**
 * Man of the Day / Week / Month awards: who may give them, how they feed XP,
 * and the once-per-viewer celebration queue.
 */
class SwimmerAwardTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $coach;

    private User $otherCoach;

    private SwimmerProfile $mySwimmer;

    private SwimmerProfile $otherSwimmer;

    private User $mySwimmerUser;

    private User $otherSwimmerUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create(['name' => 'Award Club', 'slug' => 'award-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id, 'coach_portal_enabled' => true, 'leaderboard_enabled' => true]);

        $this->manager = $this->user('Manager', 'manager@award.test', UserRole::CLUB_MANAGER);
        $this->coach = $this->user('Coach One', 'coach1@award.test', UserRole::COACH);
        $this->otherCoach = $this->user('Coach Two', 'coach2@award.test', UserRole::COACH);
        CoachProfile::withoutGlobalScopes()->create(['user_id' => $this->coach->id, 'club_id' => $this->club->id]);
        CoachProfile::withoutGlobalScopes()->create(['user_id' => $this->otherCoach->id, 'club_id' => $this->club->id]);

        $this->mySwimmerUser = $this->user('Sara Ali', 'sara@award.test', UserRole::SWIMMER);
        $this->otherSwimmerUser = $this->user('Omar Ali', 'omar@award.test', UserRole::SWIMMER);
        $this->mySwimmer = $this->swimmer('Sara', 'Ali', $this->mySwimmerUser);
        $this->otherSwimmer = $this->swimmer('Omar', 'Ali', $this->otherSwimmerUser);

        $myGroup = Group::create(['club_id' => $this->club->id, 'name' => 'Mine', 'coach_user_id' => $this->coach->id]);
        $otherGroup = Group::create(['club_id' => $this->club->id, 'name' => 'Theirs', 'coach_user_id' => $this->otherCoach->id]);
        GroupMembership::create(['club_id' => $this->club->id, 'group_id' => $myGroup->id, 'swimmer_id' => $this->mySwimmer->id]);
        GroupMembership::create(['club_id' => $this->club->id, 'group_id' => $otherGroup->id, 'swimmer_id' => $this->otherSwimmer->id]);
    }

    private function user(string $name, string $email, UserRole $role, ?int $clubId = null): User
    {
        return User::create(['name' => $name, 'email' => $email, 'password' => 'password', 'role' => $role, 'club_id' => $clubId ?? $this->club->id]);
    }

    private function swimmer(string $first, string $last, ?User $user = null, ?int $clubId = null): SwimmerProfile
    {
        return SwimmerProfile::withoutGlobalScopes()->create([
            'club_id' => $clubId ?? $this->club->id,
            'user_id' => $user?->id,
            'first_name' => $first,
            'last_name' => $last,
            'level' => 'Beginner',
        ]);
    }

    private function award(User $giver, string $prefix, SwimmerProfile $swimmer, string $type = 'day')
    {
        return $this->actingAs($giver, 'sanctum')
            ->postJson("/api/v1/{$prefix}/awards", ['swimmer_id' => $swimmer->id, 'award_type' => $type]);
    }

    // ── Who may give an award ──────────────────────────────────────────

    public function test_manager_can_award_any_swimmer_in_the_club(): void
    {
        $this->award($this->manager, 'club', $this->otherSwimmer, 'week')
            ->assertStatus(201)
            ->assertJsonPath('award.swimmer_id', $this->otherSwimmer->id)
            ->assertJsonPath('award.award_type', 'week')
            ->assertJsonPath('award.swimmer_name', 'Omar Ali')
            ->assertJsonPath('award.awarded_by', 'Manager');

        $this->assertDatabaseHas('swimmer_awards', [
            'club_id' => $this->club->id,
            'swimmer_id' => $this->otherSwimmer->id,
            'award_type' => 'week',
            'awarded_by' => $this->manager->id,
        ]);
    }

    public function test_coach_can_award_a_swimmer_in_their_own_group(): void
    {
        $this->award($this->coach, 'coach', $this->mySwimmer)
            ->assertStatus(201)
            ->assertJsonPath('award.awarded_by', 'Coach One');
    }

    public function test_coach_cannot_award_a_swimmer_outside_their_groups(): void
    {
        $this->award($this->coach, 'coach', $this->otherSwimmer)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['swimmer_id']);

        $this->assertDatabaseCount('swimmer_awards', 0);
    }

    public function test_manager_cannot_award_a_swimmer_from_another_club(): void
    {
        $otherClub = Club::create(['name' => 'Other', 'slug' => 'other-award', 'is_active' => true, 'max_branches' => 5]);
        $foreign = $this->swimmer('Far', 'Away', null, $otherClub->id);

        $this->award($this->manager, 'club', $foreign)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['swimmer_id']);
    }

    public function test_award_type_must_be_day_week_or_month(): void
    {
        $this->award($this->manager, 'club', $this->mySwimmer, 'year')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['award_type']);
    }

    public function test_swimmers_cannot_give_awards(): void
    {
        $this->actingAs($this->mySwimmerUser, 'sanctum')
            ->postJson('/api/v1/club/awards', ['swimmer_id' => $this->otherSwimmer->id, 'award_type' => 'day'])
            ->assertStatus(403);
    }

    // ── XP ────────────────────────────────────────────────────────────

    public function test_award_grants_the_club_configured_xp_for_its_type(): void
    {
        LeaderboardSetting::forClub($this->club->id)->update(['award_day_xp' => 70, 'award_week_xp' => 200, 'award_month_xp' => 900]);

        $this->award($this->manager, 'club', $this->mySwimmer, 'day')->assertJsonPath('award.xp_value', 70);
        $this->award($this->manager, 'club', $this->mySwimmer, 'week')->assertJsonPath('award.xp_value', 200);
        $this->award($this->manager, 'club', $this->mySwimmer, 'month')->assertJsonPath('award.xp_value', 900);

        $xp = app(XpCalculationService::class)->computeForSwimmer(
            $this->mySwimmer->id, $this->club->id, LeaderboardSetting::forClub($this->club->id)
        );

        $this->assertSame(1170, $xp['award_xp']);
        $this->assertSame(1170, $xp['total_xp']);
    }

    public function test_award_xp_is_a_snapshot_that_survives_later_setting_changes(): void
    {
        LeaderboardSetting::forClub($this->club->id)->update(['award_day_xp' => 50]);
        $this->award($this->manager, 'club', $this->mySwimmer, 'day');

        LeaderboardSetting::forClub($this->club->id)->update(['award_day_xp' => 5]);
        app(XpCalculationService::class)->invalidateCache($this->mySwimmer->id, $this->club->id);

        $xp = app(XpCalculationService::class)->computeForSwimmer(
            $this->mySwimmer->id, $this->club->id, LeaderboardSetting::forClub($this->club->id)
        );

        $this->assertSame(50, $xp['award_xp']);
    }

    public function test_award_xp_is_present_and_zero_for_swimmers_without_awards(): void
    {
        $xp = app(XpCalculationService::class)->computeForSwimmer(
            $this->mySwimmer->id, $this->club->id, LeaderboardSetting::forClub($this->club->id)
        );

        $this->assertArrayHasKey('award_xp', $xp);
        $this->assertSame(0, $xp['award_xp']);
    }

    public function test_award_xp_ranks_swimmers_in_get_top_swimmers(): void
    {
        LeaderboardSetting::forClub($this->club->id)->update(['award_month_xp' => 400]);
        $this->award($this->manager, 'club', $this->otherSwimmer, 'month');

        $top = app(XpCalculationService::class)->getTopSwimmers($this->club->id, 5);

        $this->assertSame($this->otherSwimmer->id, $top[0]['swimmer_id']);
        $this->assertSame(400, $top[0]['total_xp']);
        $this->assertSame(0, $top[1]['total_xp']);
    }

    public function test_award_xp_reaches_the_manager_leaderboard_overview_and_swimmer_leaderboard(): void
    {
        $this->award($this->manager, 'club', $this->otherSwimmer, 'week'); // default 150

        $overview = $this->actingAs($this->manager, 'sanctum')->getJson('/api/v1/club/leaderboard/overview')->assertOk();
        $this->assertSame($this->otherSwimmer->id, $overview->json('top_swimmers.0.swimmer_id'));
        $this->assertSame(150, $overview->json('top_swimmers.0.total_xp'));

        $board = $this->actingAs($this->mySwimmerUser, 'sanctum')->getJson('/api/v1/swimmer/leaderboard')->assertOk();
        $this->assertSame($this->otherSwimmer->id, $board->json('top5.0.swimmer_id'));
    }

    public function test_several_swimmers_can_hold_the_same_title_in_the_same_period(): void
    {
        $this->award($this->manager, 'club', $this->mySwimmer, 'day')->assertStatus(201);
        $this->award($this->manager, 'club', $this->otherSwimmer, 'day')->assertStatus(201);
        $this->award($this->coach, 'coach', $this->mySwimmer, 'day')->assertStatus(201);

        $this->assertDatabaseCount('swimmer_awards', 3);
    }

    public function test_awarding_broadcasts_to_the_whole_club(): void
    {
        Event::fake([SwimmerAwarded::class]);

        $this->award($this->manager, 'club', $this->mySwimmer, 'day')->assertStatus(201);

        Event::assertDispatched(SwimmerAwarded::class, function (SwimmerAwarded $event) {
            $channels = collect($event->broadcastOn())->map(fn ($c) => $c->name);
            $payload = $event->broadcastWith();

            return $channels->contains('private-club.'.$this->club->id.'.members')
                && $payload['swimmer_id'] === $this->mySwimmer->id
                && $payload['swimmer_name'] === 'Sara Ali'
                && $payload['award_type'] === 'day';
        });
    }

    // ── Celebration queue ─────────────────────────────────────────────

    public function test_pending_lists_an_award_until_the_viewer_marks_it_seen(): void
    {
        $this->award($this->manager, 'club', $this->otherSwimmer, 'day');
        $awardId = SwimmerAward::withoutGlobalScopes()->first()->id;

        $pending = $this->actingAs($this->mySwimmerUser, 'sanctum')->getJson('/api/v1/swimmer/awards/pending')->assertOk();
        $this->assertCount(1, $pending->json('data'));
        $this->assertSame('Omar Ali', $pending->json('data.0.swimmer_name'));
        $this->assertFalse($pending->json('data.0.is_mine'));

        // The winner sees it flagged as their own
        $mine = $this->actingAs($this->otherSwimmerUser, 'sanctum')->getJson('/api/v1/swimmer/awards/pending')->assertOk();
        $this->assertTrue($mine->json('data.0.is_mine'));

        $this->actingAs($this->mySwimmerUser, 'sanctum')->postJson("/api/v1/swimmer/awards/{$awardId}/seen")->assertOk();
        // Dismissing twice is harmless
        $this->actingAs($this->mySwimmerUser, 'sanctum')->postJson("/api/v1/swimmer/awards/{$awardId}/seen")->assertOk();

        $this->actingAs($this->mySwimmerUser, 'sanctum')->getJson('/api/v1/swimmer/awards/pending')->assertOk()->assertJsonCount(0, 'data');

        // ...but only for that viewer: the winner still has it queued
        $this->actingAs($this->otherSwimmerUser, 'sanctum')->getJson('/api/v1/swimmer/awards/pending')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_pending_and_recent_are_isolated_per_club(): void
    {
        $otherClub = Club::create(['name' => 'Other', 'slug' => 'other-award', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $otherClub->id, 'leaderboard_enabled' => true]);
        $otherManager = $this->user('Other Manager', 'om@award.test', UserRole::CLUB_MANAGER, $otherClub->id);
        $otherViewer = $this->user('Other Swimmer', 'os@award.test', UserRole::SWIMMER, $otherClub->id);
        $foreign = $this->swimmer('Far', 'Away', $otherViewer, $otherClub->id);

        $this->award($this->manager, 'club', $this->mySwimmer, 'day')->assertStatus(201);
        $this->award($otherManager, 'club', $foreign, 'month')->assertStatus(201);
        $ourAwardId = SwimmerAward::withoutGlobalScopes()->where('club_id', $this->club->id)->value('id');

        $this->actingAs($otherViewer, 'sanctum')->getJson('/api/v1/swimmer/awards/pending')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.swimmer_name', 'Far Away');

        $this->actingAs($otherViewer, 'sanctum')->getJson('/api/v1/swimmer/awards/recent')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.award_type', 'month');

        // A foreign viewer cannot dismiss (or even see) our award
        $this->actingAs($otherViewer, 'sanctum')->postJson("/api/v1/swimmer/awards/{$ourAwardId}/seen")->assertStatus(404);
    }

    public function test_recent_is_the_permanent_club_wide_feed_newest_first(): void
    {
        $this->award($this->manager, 'club', $this->mySwimmer, 'day');
        $this->award($this->manager, 'club', $this->otherSwimmer, 'week');
        $awards = SwimmerAward::withoutGlobalScopes()->orderBy('id')->get();
        $awards[0]->forceFill(['created_at' => now()->subDay()])->save();

        // Seen awards stay in the feed
        $this->actingAs($this->mySwimmerUser, 'sanctum')->postJson("/api/v1/swimmer/awards/{$awards[1]->id}/seen")->assertOk();

        $recent = $this->actingAs($this->mySwimmerUser, 'sanctum')->getJson('/api/v1/swimmer/awards/recent')->assertOk();
        $this->assertCount(2, $recent->json('data'));
        $this->assertSame('week', $recent->json('data.0.award_type'));
        $this->assertSame('day', $recent->json('data.1.award_type'));

        // Managers and coaches read the same feed
        $this->actingAs($this->manager, 'sanctum')->getJson('/api/v1/club/awards/recent')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($this->coach, 'sanctum')->getJson('/api/v1/coach/awards/recent')->assertOk()->assertJsonCount(2, 'data');
    }

    // ── Point values are manager-only ─────────────────────────────────

    public function test_manager_can_set_award_point_values(): void
    {
        $this->actingAs($this->manager, 'sanctum')->putJson('/api/v1/club/leaderboard/settings', [
            'rating_xp_1' => 10, 'rating_xp_2' => 25, 'rating_xp_3' => 50, 'rating_xp_4' => 80, 'rating_xp_5' => 120,
            'attendance_xp' => 5, 'streak_bonus_xp' => 10, 'streak_threshold' => 3,
            'award_day_xp' => 60, 'award_week_xp' => 180, 'award_month_xp' => 500,
        ])->assertOk()
            ->assertJsonPath('award_day_xp', 60)
            ->assertJsonPath('award_week_xp', 180)
            ->assertJsonPath('award_month_xp', 500);

        $this->actingAs($this->manager, 'sanctum')->getJson('/api/v1/club/leaderboard/settings')
            ->assertOk()->assertJsonPath('settings.award_month_xp', 500);
    }

    public function test_coach_cannot_set_award_point_values(): void
    {
        $this->actingAs($this->coach, 'sanctum')->putJson('/api/v1/club/leaderboard/settings', [
            'rating_xp_1' => 10, 'rating_xp_2' => 25, 'rating_xp_3' => 50, 'rating_xp_4' => 80, 'rating_xp_5' => 120,
            'attendance_xp' => 5, 'streak_bonus_xp' => 10, 'streak_threshold' => 3,
            'award_day_xp' => 9999, 'award_week_xp' => 9999, 'award_month_xp' => 9999,
        ])->assertStatus(403);

        $this->assertSame(50, LeaderboardSetting::forClub($this->club->id)->award_day_xp);
    }

    public function test_settings_defaults_are_50_150_400(): void
    {
        $settings = LeaderboardSetting::forClub($this->club->id);

        $this->assertSame(50, $settings->getAwardXpFor('day'));
        $this->assertSame(150, $settings->getAwardXpFor('week'));
        $this->assertSame(400, $settings->getAwardXpFor('month'));
        $this->assertSame(0, $settings->getAwardXpFor('year'));
    }
}
