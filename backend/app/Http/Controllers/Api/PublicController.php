<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\CorporateSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PublicController extends Controller
{
    public function clubIndex(): JsonResponse
    {
        $clubs = Club::select('id', 'name', 'display_name', 'slug', 'logo_url', 'primary_color', 'about')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $clubs]);
    }

    public function clubBySlug(string $slug): JsonResponse
    {
        $club = Club::where('slug', $slug)->firstOrFail();

        return response()->json([
            'id' => $club->id,
            'name' => $club->name,
            'slug' => $club->slug,
            'logo_url' => $club->logo_url,
            'theme_color' => $club->theme_color,
            'primary_color' => $club->primary_color,
            'secondary_color' => $club->secondary_color,
            'accent_color' => $club->accent_color,
            'about' => $club->about,
            'contact_email' => $club->contact_email,
            'contact_phone' => $club->contact_phone,
        ]);
    }

    /**
     * Active sport modules for a club (by slug, no header required).
     */
    public function clubSports(string $slug): JsonResponse
    {
        $club = Club::where('slug', $slug)->where('is_active', true)->first();

        if (! $club) {
            return response()->json(['data' => []]);
        }

        $modules = $club->activeSportModules()
            ->where('sport_modules.is_active', true)
            ->orderBy('sort_order')
            ->get(['sport_modules.id', 'sport_modules.name', 'sport_modules.slug', 'sport_modules.description', 'sport_modules.icon', 'sport_modules.color']);

        return response()->json(['data' => $modules]);
    }

    /**
     * Public corporate branding — no auth required.
     */
    public function corporateBranding(Request $request): JsonResponse
    {
        $settings = CorporateSetting::allSettings();

        // Serve the splash image through our own public proxy (the storage bucket
        // is private), so it loads without exposing the bucket.
        $splashUrl = ($settings['splash_image_path'] ?? null)
            ? rtrim($request->getSchemeAndHttpHost(), '/').'/api/v1/public/branding/splash-image?v='.substr(md5($settings['splash_image_path']), 0, 8)
            : ($settings['splash_image_url'] ?? ($settings['platform_logo_url'] ?? null));

        return response()->json([
            'platform_name' => $settings['platform_name'] ?? 'CraveClubs',
            'platform_logo_url' => $settings['platform_logo_url'] ?? null,
            'primary_color' => $settings['primary_color'] ?? '#8b5cf6',
            'secondary_color' => $settings['secondary_color'] ?? '#22d3ee',
            'tagline' => $settings['tagline'] ?? 'Club Management Platform',
            'splash_background_color' => $settings['splash_background_color'] ?? ($settings['primary_color'] ?? '#6C4CF5'),
            'splash_image_url' => $splashUrl,
        ]);
    }

    /**
     * Public proxy for the corporate splash image. The asset lives on a private
     * bucket, so we stream it (with the backend's credentials) instead of
     * handing out a bucket URL that would 401 for app users.
     */
    public function splashImage()
    {
        $path = CorporateSetting::get('splash_image_path');
        abort_if(! $path, 404);

        $diskName = config('filesystems.disks.s3.bucket') ? 's3' : 'public';
        $disk = Storage::disk($diskName);
        abort_if(! $disk->exists($path), 404);

        $mime = 'image/png';
        try {
            $mime = $disk->mimeType($path) ?: 'image/png';
        } catch (\Throwable $e) {
            // Some drivers can't infer mime — default to png
        }

        return response($disk->get($path), 200, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
