<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\ProfilePhoto;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerAward;
use App\Models\SwimmerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A swimmer's photo: sent with the application, carried onto the profile at
 * approval, replaceable from the app, and visible everywhere a swimmer is
 * listed — manager portal, coach portal/app, leaderboard, awards.
 */
class ProfilePhotoTest extends TestCase
{
    use RefreshDatabase;

    /** A 1×1 red PNG. */
    private const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    private Club $club;

    private User $manager;

    private User $coachUser;

    private CoachProfile $coach;

    private Branch $branch;

    private SubscriptionPlan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create(['name' => 'Photo Club', 'slug' => 'photo-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id]);
        $this->manager = User::create(['name' => 'Manager', 'email' => 'manager@photo.test', 'password' => 'password', 'role' => UserRole::CLUB_MANAGER, 'club_id' => $this->club->id]);
        $this->branch = Branch::create(['club_id' => $this->club->id, 'name' => 'Main', 'address' => '1 St', 'city' => 'Cairo', 'is_active' => true]);
        $this->plan = SubscriptionPlan::create(['club_id' => $this->club->id, 'name' => 'Monthly', 'duration_months' => 1, 'price' => 100, 'is_active' => true]);
        $this->coachUser = User::create(['name' => 'Coach', 'email' => 'coach@photo.test', 'password' => 'password', 'role' => UserRole::COACH, 'club_id' => $this->club->id]);
        $this->coach = CoachProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $this->coachUser->id, 'is_active' => true]);
    }

    private function dataUrl(string $base64 = self::PNG_BASE64, string $mime = 'image/png'): string
    {
        return "data:{$mime};base64,{$base64}";
    }

    private function submit(array $overrides = [])
    {
        return $this->withHeaders(['X-Club-Slug' => $this->club->slug])->postJson('/api/v1/registrations', array_merge([
            'full_name' => 'Laila Ahmed', 'phone' => '01012345678', 'gender' => 'female', 'birth_date' => '2000-01-15',
            'height_cm' => 170, 'weight_kg' => 60, 'fitness_level' => 'good', 'prior_experience' => false,
            'sport_ids' => ['1'], 'experience_level' => 'beginner', 'years_experience' => 'N/A', 'competed' => false,
            'primary_goal' => 'Get fit', 'branch_id' => $this->branch->id, 'plan_id' => $this->plan->id,
            'coach_id' => $this->coach->id, 'preferred_time' => 'flexible', 'payment_method' => 'cash', 'consent_given' => true,
        ], $overrides));
    }

    private function approve(Registration $registration): SwimmerProfile
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", ['status' => 'approved'])
            ->assertOk();

        return SwimmerProfile::withoutGlobalScopes()->where('user_id', $response->json('swimmer.user_id'))->firstOrFail();
    }

    private function swimmerWithPhoto(): SwimmerProfile
    {
        $this->submit(['photo' => $this->dataUrl()])->assertStatus(201);

        return $this->approve(Registration::first());
    }

    /* ─── Application → approval ─── */

    public function test_a_photo_sent_with_the_application_streams_publicly_and_appears_in_the_registrations_list(): void
    {
        $this->submit(['photo' => $this->dataUrl()])->assertStatus(201);

        $registration = Registration::first();
        $this->assertNotNull($registration->photo_token);
        $this->assertSame(1, ProfilePhoto::count());
        $this->assertStringEndsWith('/api/v1/photos/'.$registration->photo_token, $registration->avatar_url);

        $this->get($registration->avatar_url)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/registrations')
            ->assertOk()
            ->assertJsonPath('data.0.avatar_url', $registration->avatar_url);
    }

    public function test_an_application_without_a_photo_has_no_avatar(): void
    {
        $this->submit()->assertStatus(201);

        $this->assertNull(Registration::first()->photo_token);
        $this->assertNull(Registration::first()->avatar_url);
        $this->assertSame(0, ProfilePhoto::count());
    }

    public function test_approval_carries_the_photo_onto_the_swimmer_profile(): void
    {
        $swimmer = $this->swimmerWithPhoto();

        $this->assertSame(Registration::first()->photo_token, $swimmer->photo_token);
        $this->assertNotNull($swimmer->avatar_url);
    }

    /* ─── Validation ─── */

    public function test_a_file_that_is_not_an_image_is_refused(): void
    {
        $this->submit(['photo' => $this->dataUrl(base64_encode('<html>not an image</html>'), 'image/png')])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);

        $this->assertSame(0, Registration::count());
        $this->assertSame(0, ProfilePhoto::count());
    }

    public function test_the_claimed_type_does_not_matter_only_the_bytes(): void
    {
        // Says JPEG, is PNG — the sniffed type wins.
        $this->submit(['photo' => $this->dataUrl(self::PNG_BASE64, 'image/jpeg')])->assertStatus(201);

        $this->assertSame('image/png', ProfilePhoto::first()->mime);
    }

    public function test_a_photo_over_two_megabytes_is_refused(): void
    {
        $swimmer = $this->swimmerWithPhoto();
        $big = base64_encode(str_repeat('a', ProfilePhoto::MAX_BYTES + 1));

        $this->actingAs($swimmer->user, 'sanctum')
            ->postJson('/api/v1/swimmer/profile/photo', ['photo' => $big])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);
    }

    /* ─── The swimmer changes it from the app ─── */

    public function test_uploading_from_the_profile_replaces_the_photo_and_retires_the_old_token(): void
    {
        $swimmer = $this->swimmerWithPhoto();
        $oldToken = $swimmer->photo_token;

        $response = $this->actingAs($swimmer->user, 'sanctum')
            ->postJson('/api/v1/swimmer/profile/photo', ['photo' => $this->dataUrl()])
            ->assertOk();

        $swimmer->refresh();
        $this->assertNotSame($oldToken, $swimmer->photo_token);
        $this->assertSame($swimmer->avatar_url, $response->json('avatar_url'));
        $this->assertSame(1, ProfilePhoto::count());

        $this->get('/api/v1/photos/'.$oldToken)->assertNotFound();
        $this->get($swimmer->avatar_url)->assertOk();

        // The profile endpoint the app reads carries it too.
        $this->actingAs($swimmer->user, 'sanctum')
            ->getJson('/api/v1/swimmer/profile')
            ->assertOk()
            ->assertJsonPath('profile.avatar_url', $swimmer->avatar_url);
    }

    public function test_removing_the_photo_clears_it_everywhere(): void
    {
        $swimmer = $this->swimmerWithPhoto();
        $token = $swimmer->photo_token;

        $this->actingAs($swimmer->user, 'sanctum')
            ->deleteJson('/api/v1/swimmer/profile/photo')
            ->assertOk()
            ->assertJsonPath('avatar_url', null);

        $this->assertNull($swimmer->fresh()->photo_token);
        $this->assertSame(0, ProfilePhoto::count());
        $this->get('/api/v1/photos/'.$token)->assertNotFound();
    }

    public function test_a_swimmer_without_a_profile_photo_can_still_upload_one(): void
    {
        $this->submit()->assertStatus(201);
        $swimmer = $this->approve(Registration::first());

        $this->actingAs($swimmer->user, 'sanctum')
            ->postJson('/api/v1/swimmer/profile/photo', ['photo' => $this->dataUrl()])
            ->assertOk();

        $this->assertNotNull($swimmer->fresh()->avatar_url);
    }

    /* ─── Everywhere a swimmer is listed ─── */

    public function test_the_photo_reaches_the_manager_list_the_coach_and_the_leaderboard(): void
    {
        $swimmer = $this->swimmerWithPhoto();
        $url = $swimmer->avatar_url;

        $group = Group::create(['club_id' => $this->club->id, 'name' => 'Elite', 'coach_user_id' => $this->coachUser->id]);
        GroupMembership::firstOrCreate(['club_id' => $this->club->id, 'group_id' => $group->id, 'swimmer_id' => $swimmer->id]);

        // Manager portal: swimmers list
        $this->actingAs($this->manager, 'sanctum')
            ->getJson('/api/v1/club/swimmers')
            ->assertOk()
            ->assertJsonFragment(['avatar_url' => $url]);

        // Coach portal / app: swimmer detail
        $this->actingAs($this->coachUser, 'sanctum')
            ->getJson("/api/v1/coach/swimmers/{$swimmer->id}")
            ->assertOk()
            ->assertJsonFragment(['avatar_url' => $url]);

        // Swimmer app: leaderboard entries
        $this->actingAs($swimmer->user, 'sanctum')
            ->getJson('/api/v1/swimmer/leaderboard')
            ->assertOk()
            ->assertJsonFragment(['swimmer_id' => $swimmer->id, 'avatar_url' => $url]);
    }

    public function test_awards_show_the_swimmers_photo(): void
    {
        $swimmer = $this->swimmerWithPhoto();
        SwimmerAward::create(['club_id' => $this->club->id, 'swimmer_id' => $swimmer->id, 'award_type' => 'day', 'xp_value' => 50, 'awarded_by' => $this->manager->id]);

        $this->actingAs($swimmer->user, 'sanctum')
            ->getJson('/api/v1/swimmer/awards/recent')
            ->assertOk()
            ->assertJsonPath('data.0.swimmer_avatar_url', $swimmer->avatar_url);
    }

    /* ─── The proxy ─── */

    public function test_an_unknown_or_malformed_token_is_a_404(): void
    {
        $this->get('/api/v1/photos/'.str_repeat('0', 40))->assertNotFound();
        $this->get('/api/v1/photos/short')->assertNotFound();
        $this->get('/api/v1/photos/'.str_repeat('Z', 40))->assertNotFound();
    }

    public function test_the_bytes_never_leave_through_json(): void
    {
        $this->submit(['photo' => $this->dataUrl()])->assertStatus(201);

        $this->assertArrayNotHasKey('data', ProfilePhoto::first()->toArray());
    }
}
