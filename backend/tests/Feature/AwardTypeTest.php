<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\AwardType;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\SwimmerAward;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The club's award titles: seeded on club creation, managed by the manager,
 * readable by the coach, and safe to delete after they've been given.
 */
class AwardTypeTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private User $coach;

    protected function setUp(): void
    {
        parent::setUp();
        $this->club = Club::create(['name' => 'Award Types', 'slug' => 'award-types', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id, 'coach_portal_enabled' => true, 'leaderboard_enabled' => true]);
        $this->manager = $this->user('Manager', 'mgr@at.test', UserRole::CLUB_MANAGER);
        $this->coach = $this->user('Coach', 'coach@at.test', UserRole::COACH);
        CoachProfile::withoutGlobalScopes()->create(['user_id' => $this->coach->id, 'club_id' => $this->club->id]);
    }

    private function user(string $name, string $email, UserRole $role, ?int $clubId = null): User
    {
        return User::create(['name' => $name, 'email' => $email, 'password' => 'password', 'role' => $role, 'club_id' => $clubId ?? $this->club->id]);
    }

    public function test_a_new_club_starts_with_the_three_defaults_in_order(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/award-types')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->assertSame(
            [['Man of the Day', 50], ['Man of the Week', 150], ['Man of the Month', 400]],
            collect($response->json('data'))->map(fn ($t) => [$t['name'], $t['xp_value']])->all(),
        );
    }

    public function test_the_coach_reads_the_same_list(): void
    {
        $this->actingAs($this->coach, 'sanctum')
            ->getJson('/api/v1/coach/award-types')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Man of the Day');
    }

    public function test_manager_adds_renames_and_reprices_titles(): void
    {
        // Add lands at the end.
        $created = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/award-types', ['name' => 'Most Improved', 'xp_value' => 250])
            ->assertStatus(201)
            ->assertJsonPath('name', 'Most Improved')
            ->assertJsonPath('xp_value', 250);

        $this->actingAs($this->manager, 'sanctum')->getJson('/api/v1/club/award-types')
            ->assertJsonCount(4, 'data')->assertJsonPath('data.3.name', 'Most Improved');

        // Rename + re-price.
        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/award-types/{$created->json('id')}", ['name' => 'Comeback King', 'xp_value' => 300])
            ->assertOk()->assertJsonPath('name', 'Comeback King')->assertJsonPath('xp_value', 300);
    }

    public function test_validation(): void
    {
        $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/award-types', ['name' => '', 'xp_value' => -5])
            ->assertStatus(422)->assertJsonValidationErrors(['name', 'xp_value']);
    }

    public function test_deleting_a_title_keeps_awards_already_given(): void
    {
        $swimmer = SwimmerProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'first_name' => 'Sara', 'last_name' => 'Ali']);
        $type = AwardType::where('club_id', $this->club->id)->where('name', 'Man of the Week')->first();

        $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/awards', ['swimmer_id' => $swimmer->id, 'award_type_id' => $type->id])
            ->assertStatus(201);

        $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/award-types/{$type->id}")
            ->assertOk();

        $this->assertDatabaseMissing('award_types', ['id' => $type->id]);
        // The award survives with its snapshot; the link is just nulled.
        $award = SwimmerAward::withoutGlobalScopes()->first();
        $this->assertNull($award->award_type_id);
        $this->assertSame('Man of the Week', $award->award_name);
        $this->assertSame(150, $award->xp_value);

        // It still shows in the feed with its snapshotted name.
        $this->actingAs($this->manager, 'sanctum')->getJson('/api/v1/club/awards/recent')
            ->assertOk()->assertJsonPath('data.0.award_name', 'Man of the Week');
    }

    public function test_a_coach_cannot_manage_titles_and_clubs_are_isolated(): void
    {
        $this->actingAs($this->coach, 'sanctum')
            ->postJson('/api/v1/club/award-types', ['name' => 'X', 'xp_value' => 1])
            ->assertStatus(403);

        $otherClub = Club::create(['name' => 'Other', 'slug' => 'other-at', 'is_active' => true, 'max_branches' => 5]);
        $foreign = AwardType::withoutGlobalScopes()->where('club_id', $otherClub->id)->first();

        $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/award-types/{$foreign->id}", ['name' => 'Hijack', 'xp_value' => 1])
            ->assertNotFound();
        $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/award-types/{$foreign->id}")
            ->assertNotFound();
    }

    public function test_the_feature_gate_applies(): void
    {
        ClubFeature::where('club_id', $this->club->id)->update(['leaderboard_enabled' => false]);
        $this->actingAs($this->manager, 'sanctum')->getJson('/api/v1/club/award-types')->assertForbidden();
        $this->actingAs($this->coach, 'sanctum')->getJson('/api/v1/coach/award-types')->assertForbidden();
    }
}
