<?php

namespace Tests\Unit;

use App\Models\Club;
use App\Models\ClubFeature;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClubFeatureTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create([
            'name' => 'Unit Test Club',
            'slug' => 'unit-test-club',
        ]);
    }

    public function test_for_club_creates_default_record_if_none_exists(): void
    {
        $this->assertDatabaseMissing('club_features', ['club_id' => $this->club->id]);

        $features = ClubFeature::forClub($this->club->id);

        $this->assertNotNull($features);
        $this->assertEquals($this->club->id, $features->club_id);
        $this->assertDatabaseHas('club_features', ['club_id' => $this->club->id]);
    }

    public function test_is_enabled_returns_correct_values(): void
    {
        $features = ClubFeature::create([
            'club_id' => $this->club->id,
            'skills_enabled' => false,
            'leaderboard_enabled' => true,
        ]);

        $this->assertFalse($features->isEnabled('skills'));
        $this->assertTrue($features->isEnabled('leaderboard'));

        // Unknown feature should return false
        $this->assertFalse($features->isEnabled('nonexistent'));
    }

    public function test_all_features_default_to_true(): void
    {
        // forClub() uses firstOrCreate which only passes club_id.
        // Database-level defaults (true) are applied but not loaded into
        // the in-memory model, so we refresh from the database.
        $features = ClubFeature::forClub($this->club->id)->fresh();

        foreach (ClubFeature::featureKeys() as $key) {
            $this->assertTrue(
                (bool) $features->$key,
                "Feature {$key} should default to true"
            );
        }
    }

    public function test_feature_keys_returns_all_feature_column_names(): void
    {
        $keys = ClubFeature::featureKeys();

        $expected = [
            'leaderboard_enabled',
            'evaluations_enabled',
            'skills_enabled',
            'training_plans_enabled',
            'attendance_tracking_enabled',
            'swimmer_accounts_enabled',
            'coach_portal_enabled',
            'subscription_plans_enabled',
        ];

        $this->assertEquals($expected, $keys);
        $this->assertCount(8, $keys);
    }
}
