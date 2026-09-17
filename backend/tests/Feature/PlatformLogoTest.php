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
 * The platform logo on the app's club-name screen is uploaded from corporate
 * settings, stored in the database, and streamed by a public proxy.
 */
class PlatformLogoTest extends TestCase
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

    private function upload(File $file)
    {
        return $this->withHeaders($this->asAdmin())
            ->postJson('/api/v1/corporate/settings/platform-logo', ['file' => $file]);
    }

    public function test_an_uploaded_logo_is_served_and_advertised_to_the_app(): void
    {
        $this->upload(File::image('logo.png', 512, 512))
            ->assertOk()
            ->assertJsonStructure(['url', 'platform_logo_url']);

        $url = $this->getJson('/api/v1/public/branding')
            ->assertOk()
            ->json('platform_logo_url');

        $this->assertStringContainsString('/api/v1/public/branding/platform-logo?v=', $url);

        $this->get('/api/v1/public/branding/platform-logo')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_a_new_upload_changes_the_url_so_the_app_refetches_it(): void
    {
        $first = $this->upload(File::image('a.png', 300, 300))->json('url');
        $second = $this->upload(File::image('b.png', 640, 640))->json('url');

        $this->assertNotSame($first, $second);
        $this->assertSame($second, $this->getJson('/api/v1/public/branding')->json('platform_logo_url'));
    }

    public function test_the_proxy_is_not_found_before_any_upload(): void
    {
        $this->get('/api/v1/public/branding/platform-logo')->assertStatus(404);
    }

    public function test_svg_and_non_images_are_refused(): void
    {
        $svg = File::createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

        $this->upload($svg)->assertStatus(422);
        $this->assertNull(CorporateSetting::get('platform_logo_data'));
    }

    public function test_only_admins_can_upload(): void
    {
        $club = Club::create(['name' => 'C', 'slug' => 'c']);
        $manager = User::create([
            'name' => 'Manager',
            'email' => 'm@c.test',
            'password' => 'password123',
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

        $this->withHeaders(['Authorization' => 'Bearer '.$manager->createToken('t')->plainTextToken])
            ->postJson('/api/v1/corporate/settings/platform-logo', ['file' => File::image('logo.png', 64, 64)])
            ->assertStatus(403);
    }

    public function test_image_bytes_never_ride_along_with_the_settings(): void
    {
        // allSettings() feeds the `corporate` block of every login and /auth/me.
        // The stored image bytes must stay out of it, and out of the settings API.
        $this->upload(File::image('logo.png', 512, 512))->assertOk();
        CorporateSetting::set('splash_image_data', base64_encode('splash-bytes'));

        $settings = $this->withHeaders($this->asAdmin())->getJson('/api/v1/corporate/settings')->assertOk()->json();
        $this->assertArrayNotHasKey('platform_logo_data', $settings);
        $this->assertArrayNotHasKey('splash_image_data', $settings);

        $me = $this->withHeaders($this->asAdmin())->getJson('/api/v1/auth/me')->assertOk()->json('user.corporate');
        $this->assertArrayNotHasKey('platform_logo_data', $me);
        $this->assertArrayNotHasKey('splash_image_data', $me);
    }

    public function test_the_settings_form_cannot_write_image_bytes_or_their_type(): void
    {
        // Pairing stored bytes with a chosen content type would let the public
        // proxy serve a document from the API's own origin.
        $this->withHeaders($this->asAdmin())
            ->putJson('/api/v1/corporate/settings', [
                'settings' => [
                    'splash_image_data' => base64_encode('<script>alert(1)</script>'),
                    'splash_image_mime' => 'text/html',
                    'platform_logo_mime' => 'text/html',
                ],
            ])->assertOk();

        $this->assertNull(CorporateSetting::get('splash_image_data'));
        $this->assertNull(CorporateSetting::get('splash_image_mime'));
        $this->assertNull(CorporateSetting::get('platform_logo_mime'));
    }

    public function test_the_proxy_refuses_to_serve_a_non_image_type(): void
    {
        // Defence in depth: even if a bad type reached the table another way.
        CorporateSetting::set('platform_logo_data', base64_encode('<html>x</html>'));
        CorporateSetting::set('platform_logo_mime', 'text/html');

        $this->get('/api/v1/public/branding/platform-logo')->assertStatus(404);
    }
}
