<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\CorporateSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PublicController extends Controller
{
    /**
     * Resolve a club a swimmer typed by name (or slug) to exactly one club.
     *
     * This backs the app's entry screen, which asks for a club name instead of
     * listing every club — a swimmer at one club has no business being shown the
     * others. That only holds if this endpoint refuses to help someone guess, so
     * the match is EXACT: no partial, prefix or fuzzy matching, and a miss says
     * only "not found", never how close the guess was.
     */
    public function clubLookup(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|max:120']);

        // "  Smart   Club " and "smart-club" must both find Smart Club.
        $needle = trim(preg_replace('/\s+/', ' ', mb_strtolower((string) $request->input('q'))));
        $asSlug = Str::slug($needle);

        if ($needle === '') {
            return response()->json(['message' => 'Club not found'], 404);
        }

        $club = Club::where('is_active', true)
            ->where(function ($q) use ($needle, $asSlug) {
                $q->whereRaw('LOWER(slug) = ?', [$asSlug])
                    ->orWhereRaw('LOWER(TRIM(name)) = ?', [$needle])
                    ->orWhereRaw('LOWER(TRIM(display_name)) = ?', [$needle]);
            })
            ->orderBy('id')
            ->first();

        if (! $club) {
            return response()->json(['message' => 'Club not found'], 404);
        }

        return response()->json([
            'id' => $club->id,
            'name' => $club->name,
            'display_name' => $club->display_name,
            'slug' => $club->slug,
            'primary_color' => $club->primary_color,
            'logo_url' => $club->logo_url,
        ]);
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
    public function splashImage(Request $request)
    {
        $path = CorporateSetting::get('splash_image_path');

        // Prefer the DB-stored bytes (the storage bucket is read-denied).
        $data = CorporateSetting::get('splash_image_data');
        $contents = $data ? base64_decode($data, true) : null;

        // Fallback: try reading from storage disks by path.
        if ($contents === null || $contents === false) {
            abort_if(! $path, 404);
            foreach (['b2', 's3', 'public'] as $diskName) {
                try {
                    $contents = Storage::disk($diskName)->get($path);
                    if ($contents !== null) {
                        break;
                    }
                } catch (\Throwable $e) {
                    // try next disk
                }
            }
        }
        abort_if(! $contents, 404);

        $mime = CorporateSetting::get('splash_image_mime');
        if (! $mime) {
            $ext = strtolower(pathinfo((string) $path, PATHINFO_EXTENSION));
            $mime = match ($ext) {
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                default => 'image/png',
            };
        }

        return response($contents, 200, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
