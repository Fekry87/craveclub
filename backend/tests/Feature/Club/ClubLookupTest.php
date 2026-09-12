<?php

namespace Tests\Feature\Club;

use App\Models\Club;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The app asks a swimmer to type their club name instead of showing a list, so
 * this endpoint must resolve a real name and refuse to help anyone guess.
 */
class ClubLookupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Club::create([
            'name' => 'Smart Club',
            'display_name' => 'Smart Club',
            'slug' => 'smart-club',
            'is_active' => true,
            'max_branches' => 5,
            'primary_color' => '7D3C98',
        ]);

        Club::create([
            'name' => 'Hidden Club',
            'display_name' => 'Hidden Club',
            'slug' => 'hidden-club',
            'is_active' => false,
            'max_branches' => 5,
        ]);
    }

    private function lookup(string $q)
    {
        return $this->getJson('/api/v1/public/club-lookup?q='.urlencode($q));
    }

    public function test_finds_a_club_by_its_name(): void
    {
        $this->lookup('Smart Club')
            ->assertOk()
            ->assertJsonPath('slug', 'smart-club');
    }

    public function test_name_match_ignores_case_and_extra_spaces(): void
    {
        $this->lookup('  sMaRt   club ')
            ->assertOk()
            ->assertJsonPath('slug', 'smart-club');
    }

    public function test_finds_a_club_by_its_slug(): void
    {
        $this->lookup('smart-club')
            ->assertOk()
            ->assertJsonPath('slug', 'smart-club');
    }

    public function test_partial_names_do_not_match(): void
    {
        // The privacy property: guessing a fragment must not confirm a club exists.
        $this->lookup('smart')->assertStatus(404);
        $this->lookup('club')->assertStatus(404);
        $this->lookup('s')->assertStatus(404);
    }

    public function test_inactive_clubs_are_not_found(): void
    {
        $this->lookup('Hidden Club')->assertStatus(404);
    }

    public function test_blank_query_is_rejected(): void
    {
        $this->getJson('/api/v1/public/club-lookup')->assertStatus(422);
    }

    public function test_there_is_no_public_route_that_lists_every_club(): void
    {
        // This is the point of the whole feature: the customer roster is not a
        // public document. If someone re-adds the listing route, this fails.
        $this->getJson('/api/v1/clubs')->assertStatus(404);
    }

    public function test_response_exposes_only_branding_fields(): void
    {
        $body = $this->lookup('Smart Club')->assertOk()->json();

        $this->assertSame(
            ['display_name', 'id', 'logo_url', 'name', 'primary_color', 'slug'],
            collect($body)->keys()->sort()->values()->all(),
        );
    }
}
