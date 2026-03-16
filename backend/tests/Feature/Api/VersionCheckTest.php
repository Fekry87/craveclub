<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VersionCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_version_check_returns_correct_structure(): void
    {
        $response = $this->getJson('/api/v1/app/version-check');

        $response->assertOk()
            ->assertJsonStructure([
                'api_version',
                'latest_version',
                'minimum_version',
                'force_update',
                'update_available',
                'store_url',
                'platform',
                'client_version',
            ]);
    }

    public function test_version_check_without_headers_returns_defaults(): void
    {
        $response = $this->getJson('/api/v1/app/version-check');

        $response->assertOk()
            ->assertJson([
                'api_version' => 'v1',
                'force_update' => false,
                'update_available' => false,
                'platform' => null,
                'client_version' => null,
            ]);
    }

    public function test_version_check_with_current_version_no_update(): void
    {
        config(['app_versions.latest_version' => '1.0.0']);
        config(['app_versions.minimum_ios_version' => '1.0.0']);

        $response = $this->getJson('/api/v1/app/version-check', [
            'X-App-Version' => '1.0.0',
            'X-Platform' => 'ios',
        ]);

        $response->assertOk()
            ->assertJson([
                'force_update' => false,
                'update_available' => false,
                'platform' => 'ios',
                'client_version' => '1.0.0',
            ]);
    }

    public function test_version_check_force_update_when_below_minimum(): void
    {
        config(['app_versions.minimum_ios_version' => '2.0.0']);
        config(['app_versions.latest_version' => '2.5.0']);

        $response = $this->getJson('/api/v1/app/version-check', [
            'X-App-Version' => '1.5.0',
            'X-Platform' => 'ios',
        ]);

        $response->assertOk()
            ->assertJson([
                'force_update' => true,
                'update_available' => false,
                'minimum_version' => '2.0.0',
            ]);
    }

    public function test_version_check_update_available_when_above_minimum_below_latest(): void
    {
        config(['app_versions.minimum_android_version' => '1.0.0']);
        config(['app_versions.latest_version' => '2.0.0']);

        $response = $this->getJson('/api/v1/app/version-check', [
            'X-App-Version' => '1.5.0',
            'X-Platform' => 'android',
        ]);

        $response->assertOk()
            ->assertJson([
                'force_update' => false,
                'update_available' => true,
                'minimum_version' => '1.0.0',
            ]);
    }

    public function test_version_check_returns_ios_store_url(): void
    {
        config(['app_versions.ios_store_url' => 'https://apps.apple.com/app/test']);

        $response = $this->getJson('/api/v1/app/version-check', [
            'X-Platform' => 'ios',
        ]);

        $response->assertOk()
            ->assertJson([
                'store_url' => 'https://apps.apple.com/app/test',
            ]);
    }

    public function test_version_check_returns_android_store_url(): void
    {
        config(['app_versions.android_store_url' => 'https://play.google.com/store/apps/details?id=test']);

        $response = $this->getJson('/api/v1/app/version-check', [
            'X-Platform' => 'android',
        ]);

        $response->assertOk()
            ->assertJson([
                'store_url' => 'https://play.google.com/store/apps/details?id=test',
            ]);
    }

    public function test_version_check_null_store_url_for_web(): void
    {
        $response = $this->getJson('/api/v1/app/version-check', [
            'X-Platform' => 'web',
        ]);

        $response->assertOk()
            ->assertJson([
                'store_url' => null,
            ]);
    }

    public function test_version_check_invalid_semver_no_force_update(): void
    {
        config(['app_versions.minimum_ios_version' => '2.0.0']);

        $response = $this->getJson('/api/v1/app/version-check', [
            'X-App-Version' => 'not-a-version',
            'X-Platform' => 'ios',
        ]);

        $response->assertOk()
            ->assertJson([
                'force_update' => false,
                'update_available' => false,
                'client_version' => 'not-a-version',
            ]);
    }

    public function test_api_version_headers_echoed_back(): void
    {
        $response = $this->getJson('/api/v1/app/version-check', [
            'X-App-Version' => '1.2.3',
            'X-Platform' => 'android',
        ]);

        $response->assertOk()
            ->assertHeader('X-API-Version', 'v1')
            ->assertHeader('X-App-Version-Received', '1.2.3')
            ->assertHeader('X-Platform-Received', 'android');
    }

    public function test_api_version_header_on_any_endpoint(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertHeader('X-API-Version', 'v1');
    }

    public function test_different_minimum_per_platform(): void
    {
        config(['app_versions.minimum_ios_version' => '2.0.0']);
        config(['app_versions.minimum_android_version' => '1.5.0']);
        config(['app_versions.latest_version' => '2.5.0']);

        // iOS at 1.8.0 → force update (below 2.0.0)
        $iosResponse = $this->getJson('/api/v1/app/version-check', [
            'X-App-Version' => '1.8.0',
            'X-Platform' => 'ios',
        ]);
        $iosResponse->assertJson([
            'force_update' => true,
            'minimum_version' => '2.0.0',
        ]);

        // Android at 1.8.0 → update available (above 1.5.0 but below 2.5.0)
        $androidResponse = $this->getJson('/api/v1/app/version-check', [
            'X-App-Version' => '1.8.0',
            'X-Platform' => 'android',
        ]);
        $androidResponse->assertJson([
            'force_update' => false,
            'update_available' => true,
            'minimum_version' => '1.5.0',
        ]);
    }
}
