<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Api\PublicRegistrationController;
use App\Models\Branch;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CoachProfile;
use App\Models\Registration;
use App\Models\SubscriptionPlan;
use App\Models\SwimmerProfile;
use App\Models\User;
use App\Support\SwimmerLogin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A swimmer registers with their own email, which becomes their login; a
 * password the club hands out (approval, reset) must be changed on first
 * sign-in.
 */
class FirstLoginPasswordTest extends TestCase
{
    use RefreshDatabase;

    private Club $club;

    private User $manager;

    private Branch $branch;

    private SubscriptionPlan $plan;

    private CoachProfile $coach;

    protected function setUp(): void
    {
        parent::setUp();

        $this->club = Club::create(['name' => 'First Club', 'slug' => 'first-club', 'is_active' => true, 'max_branches' => 5]);
        ClubFeature::create(['club_id' => $this->club->id]);
        $this->manager = User::create(['name' => 'Manager', 'email' => 'manager@first.test', 'password' => 'password', 'role' => UserRole::CLUB_MANAGER, 'club_id' => $this->club->id]);
        $this->branch = Branch::create(['club_id' => $this->club->id, 'name' => 'Main', 'address' => '1 St', 'city' => 'Cairo', 'is_active' => true]);
        $this->plan = SubscriptionPlan::create(['club_id' => $this->club->id, 'name' => 'Monthly', 'duration_months' => 1, 'price' => 100, 'is_active' => true]);
        $coachUser = User::create(['name' => 'Coach', 'email' => 'coach@first.test', 'password' => 'password', 'role' => UserRole::COACH, 'club_id' => $this->club->id]);
        $this->coach = CoachProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $coachUser->id, 'is_active' => true]);
    }

    private function registrationPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name' => 'Laila Ahmed', 'phone' => '01012345678', 'gender' => 'female', 'birth_date' => '2000-01-15',
            'height_cm' => 170, 'weight_kg' => 60, 'fitness_level' => 'good', 'prior_experience' => false,
            'sport_ids' => ['1'], 'experience_level' => 'beginner', 'years_experience' => 'N/A', 'competed' => false,
            'primary_goal' => 'Get fit', 'branch_id' => $this->branch->id, 'plan_id' => $this->plan->id,
            'coach_id' => $this->coach->id, 'preferred_time' => 'flexible', 'payment_method' => 'cash', 'consent_given' => true,
        ], $overrides);
    }

    private function submit(array $overrides = [])
    {
        return $this->withHeaders(['X-Club-Slug' => $this->club->slug])
            ->postJson('/api/v1/registrations', $this->registrationPayload($overrides));
    }

    /** @return array{0: User, 1: string} the new account and its temporary password */
    private function approve(Registration $registration): array
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->patchJson("/api/v1/club/registrations/{$registration->id}/status", ['status' => 'approved'])
            ->assertOk();

        $user = User::findOrFail($response->json('swimmer.user_id'));

        return [$user, $response->json('swimmer.temp_password')];
    }

    /**
     * The test client keeps each guard's resolved user between requests: after
     * actingAs($manager) and a real login, a Bearer request would still run as
     * whoever the guard last resolved. Acting as the swimmer explicitly is the
     * one reliable way to make the next request theirs.
     */
    private function asSwimmer(User $user)
    {
        return $this->actingAs($user, 'sanctum');
    }

    private function login(string $identifier, string $password)
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $identifier, 'password' => $password, 'club_slug' => $this->club->slug,
        ]);
    }

    public function test_the_registered_email_becomes_the_login_address(): void
    {
        $id = $this->submit(['email' => 'laila@example.com'])->assertCreated()->json('registration_id');
        [$user, $temp] = $this->approve(Registration::findOrFail($id));

        $this->assertSame('laila@example.com', $user->email);
        $this->assertSame('01012345678', $user->login_phone);

        // Both the email and the phone sign in to it.
        $this->login('laila@example.com', $temp)->assertOk()->assertJsonPath('user.id', $user->id);
        $this->login('010 1234 5678', $temp)->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_without_an_email_the_generated_address_is_used_as_before(): void
    {
        $id = $this->submit()->assertCreated()->json('registration_id');
        [$user] = $this->approve(Registration::findOrFail($id));

        $this->assertSame(SwimmerLogin::email($this->club->id, '01012345678'), $user->email);
        $this->assertSame('01012345678', $user->login_phone);
    }

    public function test_an_email_already_used_by_an_account_is_refused_at_registration(): void
    {
        $this->submit(['email' => 'manager@first.test'])->assertStatus(422)
            ->assertJsonPath('errors.email.0', PublicRegistrationController::EMAIL_TAKEN_MESSAGE);
        $this->submit(['email' => 'not-an-email'])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    /**
     * Step 1 asks up front, with the same rule and the same message the
     * submission uses, so a taken email is caught before the other seven steps.
     */
    public function test_step_one_can_check_the_email_before_the_rest_of_the_form(): void
    {
        $check = fn (?string $email) => $this->withHeaders(['X-Club-Slug' => $this->club->slug])
            ->postJson('/api/v1/registrations/check-email', ['email' => $email]);

        $check('laila@example.com')->assertOk()->assertJsonPath('available', true);
        $check('manager@first.test')->assertStatus(422)
            ->assertJsonPath('errors.email.0', PublicRegistrationController::EMAIL_TAKEN_MESSAGE);
        $check('not-an-email')->assertStatus(422)->assertJsonValidationErrors('email');
        // Without one the generated address is used, so nothing to refuse.
        $check(null)->assertOk();

        // It needs the club header like every other registration route
        // (withHeaders sticks to the test case, so drop it first).
        $this->flushHeaders()
            ->postJson('/api/v1/registrations/check-email', ['email' => 'laila@example.com'])
            ->assertStatus(422)->assertJsonPath('message', 'X-Club-Slug header is required.');
    }

    public function test_an_email_taken_between_registration_and_approval_falls_back_to_the_generated_one(): void
    {
        $id = $this->submit(['email' => 'laila@example.com'])->assertCreated()->json('registration_id');
        User::create(['name' => 'Other', 'email' => 'laila@example.com', 'password' => 'password', 'role' => UserRole::SWIMMER, 'club_id' => $this->club->id]);

        [$user] = $this->approve(Registration::findOrFail($id));

        $this->assertSame(SwimmerLogin::email($this->club->id, '01012345678'), $user->email);
    }

    public function test_a_relayed_password_must_be_changed_on_first_sign_in(): void
    {
        $id = $this->submit(['email' => 'laila@example.com'])->assertCreated()->json('registration_id');
        [$user, $temp] = $this->approve(Registration::findOrFail($id));

        $this->login('laila@example.com', $temp)
            ->assertOk()
            ->assertJsonPath('user.must_change_password', true);

        $this->asSwimmer($user)->getJson('/api/v1/auth/me')
            ->assertOk()->assertJsonPath('user.must_change_password', true);

        $this->asSwimmer($user)->postJson('/api/v1/auth/change-password', [
            'current_password' => $temp, 'new_password' => 'MyOwnPass123', 'new_password_confirmation' => 'MyOwnPass123',
        ])->assertOk();

        $this->assertFalse($user->fresh()->must_change_password);
        $this->login('laila@example.com', 'MyOwnPass123')->assertOk()->assertJsonPath('user.must_change_password', false);
    }

    public function test_a_manager_reset_puts_the_gate_back(): void
    {
        $id = $this->submit(['email' => 'laila@example.com'])->assertCreated()->json('registration_id');
        [$user, $temp] = $this->approve(Registration::findOrFail($id));
        $this->asSwimmer($user)->postJson('/api/v1/auth/change-password', [
            'current_password' => $temp, 'new_password' => 'MyOwnPass123', 'new_password_confirmation' => 'MyOwnPass123',
        ])->assertOk();
        $this->assertFalse($user->fresh()->must_change_password);

        $swimmer = SwimmerProfile::withoutGlobalScopes()->where('user_id', $user->id)->firstOrFail();
        $reset = $this->actingAs($this->manager, 'sanctum')
            ->postJson("/api/v1/club/swimmers/{$swimmer->id}/reset-password", [], ['X-Club-Slug' => $this->club->slug])
            ->assertOk()
            ->assertJsonPath('credentials.email', 'laila@example.com')
            ->assertJsonPath('credentials.phone', '01012345678')
            ->assertJsonPath('credentials.phone_login_works', true);

        $this->assertTrue($user->fresh()->must_change_password);
        $this->login('01012345678', $reset->json('credentials.temp_password'))
            ->assertOk()->assertJsonPath('user.must_change_password', true);
    }

    public function test_existing_accounts_are_not_gated(): void
    {
        $user = User::create(['name' => 'Old', 'email' => SwimmerLogin::email($this->club->id, '01099999999'), 'password' => 'password', 'role' => UserRole::SWIMMER, 'club_id' => $this->club->id]);
        SwimmerProfile::withoutGlobalScopes()->create(['club_id' => $this->club->id, 'user_id' => $user->id, 'first_name' => 'Old', 'last_name' => 'One']);

        $this->login('01099999999', 'password')->assertOk()->assertJsonPath('user.must_change_password', false);
    }
}
