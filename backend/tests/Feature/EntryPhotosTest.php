<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Club;
use App\Models\CorporateSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Testing\File;
use Tests\TestCase;

/**
 * The app's club-name entry screen cycles through up to three photos uploaded
 * from corporate settings, stored in the database and streamed by a proxy.
 */
class EntryPhotosTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@craveclubs.com',
            'password' => 'password123',
            'role' => UserRole::PLATFORM_ADMIN,
            'club_id' => null,
        ]);
    }

    private function asAdmin(): array
    {
        return ['Authorization' => 'Bearer '.$this->admin->createToken('test')->plainTextToken];
    }

    private function upload(int $slot, File $file)
    {
        return $this->withHeaders($this->asAdmin())
            ->postJson("/api/v1/corporate/settings/entry-photos/{$slot}", ['file' => $file]);
    }

    private function advertised(): array
    {
        return $this->getJson('/api/v1/public/branding')->assertOk()->json('entry_photo_urls');
    }

    public function test_no_photos_are_advertised_before_any_upload(): void
    {
        $this->assertSame([], $this->advertised());
        $this->get('/api/v1/public/branding/entry-photo/1')->assertStatus(404);
    }

    public function test_uploaded_photos_are_served_and_advertised_in_slot_order(): void
    {
        $this->upload(3, File::image('c.jpg', 1080, 1920))->assertOk()->assertJson(['slot' => 3]);
        $this->upload(1, File::image('a.png', 1080, 1920))->assertOk();

        $urls = $this->advertised();
        $this->assertCount(2, $urls);
        $this->assertStringContainsString('/api/v1/public/branding/entry-photo/1?v=', $urls[0]);
        $this->assertStringContainsString('/api/v1/public/branding/entry-photo/3?v=', $urls[1]);

        $this->get('/api/v1/public/branding/entry-photo/3')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_replacing_a_photo_changes_its_url_so_the_app_refetches_it(): void
    {
        $first = $this->upload(2, File::image('a.jpg', 800, 1200))->json('url');
        $second = $this->upload(2, File::image('b.jpg', 900, 1400))->json('url');

        $this->assertNotSame($first, $second);
        $this->assertSame([$second], $this->advertised());
    }

    public function test_a_removed_photo_leaves_the_rotation(): void
    {
        $this->upload(1, File::image('a.jpg', 800, 1200))->assertOk();
        $this->upload(2, File::image('b.jpg', 800, 1200))->assertOk();

        $this->withHeaders($this->asAdmin())
            ->deleteJson('/api/v1/corporate/settings/entry-photos/1')
            ->assertOk();

        $urls = $this->advertised();
        $this->assertCount(1, $urls);
        $this->assertStringContainsString('/entry-photo/2?v=', $urls[0]);
        $this->get('/api/v1/public/branding/entry-photo/1')->assertStatus(404);
    }

    public function test_only_slots_one_to_three_exist(): void
    {
        $this->upload(4, File::image('d.jpg', 100, 100))->assertStatus(404);
        $this->upload(0, File::image('d.jpg', 100, 100))->assertStatus(404);
        $this->get('/api/v1/public/branding/entry-photo/4')->assertStatus(404);
    }

    public function test_svg_and_non_images_are_refused(): void
    {
        $svg = File::createWithContent('photo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

        $this->upload(1, $svg)->assertStatus(422);
        $this->assertNull(CorporateSetting::get('entry_photo_1_data'));
    }

    public function test_only_admins_can_change_the_photos(): void
    {
        $club = Club::create(['name' => 'C', 'slug' => 'c']);
        $manager = User::create([
            'name' => 'Manager',
            'email' => 'm@c.test',
            'password' => 'password123',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);
        $headers = ['Authorization' => 'Bearer '.$manager->createToken('t')->plainTextToken];

        $this->withHeaders($headers)
            ->postJson('/api/v1/corporate/settings/entry-photos/1', ['file' => File::image('a.jpg', 64, 64)])
            ->assertStatus(403);
        $this->withHeaders($headers)
            ->deleteJson('/api/v1/corporate/settings/entry-photos/1')
            ->assertStatus(403);
    }

    public function test_photo_bytes_never_ride_along_with_the_settings(): void
    {
        $this->upload(1, File::image('a.jpg', 1080, 1920))->assertOk();

        $settings = $this->withHeaders($this->asAdmin())->getJson('/api/v1/corporate/settings')->assertOk()->json();
        $this->assertArrayNotHasKey('entry_photo_1_data', $settings);

        $me = $this->withHeaders($this->asAdmin())->getJson('/api/v1/auth/me')->assertOk()->json('user.corporate');
        $this->assertArrayNotHasKey('entry_photo_1_data', $me);
    }

    public function test_the_settings_form_cannot_write_photo_bytes_or_their_type(): void
    {
        $this->withHeaders($this->asAdmin())
            ->putJson('/api/v1/corporate/settings', [
                'settings' => [
                    'entry_photo_1_data' => base64_encode('<script>alert(1)</script>'),
                    'entry_photo_1_mime' => 'text/html',
                    'entry_photo_1_version' => 'abc',
                ],
            ])->assertOk();

        $this->assertNull(CorporateSetting::get('entry_photo_1_data'));
        $this->assertNull(CorporateSetting::get('entry_photo_1_mime'));
        $this->assertSame([], $this->advertised());
    }

    public function test_the_proxy_refuses_to_serve_a_non_image_type(): void
    {
        CorporateSetting::set('entry_photo_1_data', base64_encode('<html>x</html>'));
        CorporateSetting::set('entry_photo_1_mime', 'text/html');

        $this->get('/api/v1/public/branding/entry-photo/1')->assertStatus(404);
    }
}
