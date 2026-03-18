<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppVersionController extends Controller
{
    /**
     * GET /api/v1/app/version-check
     *
     * Returns current API version info, minimum client versions,
     * and whether the calling client needs a force update.
     *
     * Headers read:
     *   X-App-Version: "1.2.3" (semver)
     *   X-Platform: "ios" | "android" | "web"
     */
    public function check(Request $request): JsonResponse
    {
        $clientVersion = $request->header('X-App-Version');
        $platform = $request->header('X-Platform');

        $config = config('app_versions');

        $minimumIos = $config['minimum_ios_version'];
        $minimumAndroid = $config['minimum_android_version'];
        $latestVersion = $config['latest_version'];

        // Determine the minimum version for this platform
        $minimumVersion = match (strtolower($platform ?? '')) {
            'ios' => $minimumIos,
            'android' => $minimumAndroid,
            default => min($minimumIos, $minimumAndroid), // most permissive
        };

        // Determine force_update and update_available
        $forceUpdate = false;
        $updateAvailable = false;

        if ($clientVersion && $this->isValidSemver($clientVersion)) {
            // Force update if client is below the minimum
            $forceUpdate = version_compare($clientVersion, $minimumVersion, '<');

            // Update available if client is below the latest (but above minimum)
            $updateAvailable = ! $forceUpdate && version_compare($clientVersion, $latestVersion, '<');
        }

        // Store URL based on platform
        $storeUrl = match (strtolower($platform ?? '')) {
            'ios' => $config['ios_store_url'],
            'android' => $config['android_store_url'],
            default => null,
        };

        return response()->json([
            'api_version' => $config['api_version'],
            'latest_version' => $latestVersion,
            'minimum_version' => $minimumVersion,
            'force_update' => $forceUpdate,
            'update_available' => $updateAvailable,
            'store_url' => $storeUrl ?: null,
            'platform' => $platform,
            'client_version' => $clientVersion,
        ]);
    }

    /**
     * Basic semver validation (major.minor.patch).
     */
    private function isValidSemver(string $version): bool
    {
        return (bool) preg_match('/^\d+\.\d+\.\d+$/', $version);
    }
}
