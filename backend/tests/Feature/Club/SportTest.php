<?php

namespace Tests\Feature\Club;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SportTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;
    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Sport Test Club',
            'slug' => 'sport-test-club',
            'is_active' => true,
            'max_branches' => 5,
        ]);

        ClubFeature::create(['club_id' => $this->club->id]);

        $this->manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@sporttest.com',
            'password' => 'password',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $this->club->id,
        ]);
    }

    public function test_sport_index_returns_club_scoped_data(): void
    {
        Sport::create(['club_id' => $this->club->id, 'name' => 'Swimming', 'slug' => 'swimming']);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/sports');

        $response->assertOk();
    }

    public function test_sport_store_creates_sport(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/club/sports', [
                'name' => 'Diving',
                'slug' => 'diving',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('sports', ['name' => 'Diving', 'club_id' => $this->club->id]);
    }

    public function test_sport_show_returns_sport(): void
    {
        $sport = Sport::create(['club_id' => $this->club->id, 'name' => 'Swimming', 'slug' => 'swimming']);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->getJson("/api/v1/club/sports/{$sport->id}");

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Swimming']);
    }

    public function test_sport_update_modifies_sport(): void
    {
        $sport = Sport::create(['club_id' => $this->club->id, 'name' => 'Swimming', 'slug' => 'swimming']);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/club/sports/{$sport->id}", [
                'name' => 'Competitive Swimming',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('sports', ['id' => $sport->id, 'name' => 'Competitive Swimming']);
    }

    public function test_sport_destroy_soft_deletes_sport(): void
    {
        $sport = Sport::create(['club_id' => $this->club->id, 'name' => 'Swimming', 'slug' => 'swimming']);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/club/sports/{$sport->id}");

        $response->assertOk();
        $this->assertSoftDeleted('sports', ['id' => $sport->id]);
    }
}
