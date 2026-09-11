<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Support\SafeCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ClubBrandingController extends Controller
{
    /**
     * Public: GET /api/v1/branding/{slug}
     * No auth required. Returns cached branding config for a club.
     */
    public function show(string $slug): JsonResponse
    {
        $data = SafeCache::remember("branding_{$slug}", 3600, fn () => $this->computeBranding($slug));

        if ($data === null) {
            SafeCache::forget("branding_{$slug}");
            abort(404, 'Club not found.');
        }

        return response()->json($data);
    }

    private function computeBranding(string $slug): ?array
    {
        $club = Club::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $club) {
            return null;
        }

        $features = ClubFeature::forClub($club->id);

        return [
            'club_name' => $club->name,
            'display_name' => $club->display_name,
            'app_name' => $club->app_name,
            'primary_color' => $club->primary_color,
            'secondary_color' => $club->secondary_color,
            'accent_color' => $club->accent_color,
            'logo_url' => $club->logo_url,
            'cover_url' => $club->cover_url,
            'favicon_url' => $club->favicon_url,
            'support_email' => $club->support_email ?? $club->contact_email,
            'support_phone' => $club->support_phone ?? $club->contact_phone,
            'social_links' => $club->social_links,
            'branding_tier' => $club->branding_tier,
            'features' => [
                'leaderboard' => $features->leaderboard_enabled,
                'evaluations' => $features->evaluations_enabled,
                'skills' => $features->skills_enabled,
                'training_plans' => $features->training_plans_enabled,
                'attendance_tracking' => $features->attendance_tracking_enabled,
                'swimmer_accounts' => $features->swimmer_accounts_enabled,
                'coach_portal' => $features->coach_portal_enabled,
                'subscription_plans' => $features->subscription_plans_enabled,
            ],
        ];
    }

    /**
     * Club Manager: GET /api/v1/club/branding
     * Read-only branding for the authenticated club.
     */
    public function own(): JsonResponse
    {
        $club = Club::findOrFail(app('current_club_id'));
        $features = ClubFeature::forClub($club->id);

        return response()->json([
            'club_name' => $club->name,
            'display_name' => $club->display_name,
            'app_name' => $club->app_name,
            'primary_color' => $club->primary_color,
            'secondary_color' => $club->secondary_color,
            'accent_color' => $club->accent_color,
            'logo_url' => $club->logo_url,
            'cover_url' => $club->cover_url,
            'favicon_url' => $club->favicon_url,
            'support_email' => $club->support_email ?? $club->contact_email,
            'support_phone' => $club->support_phone ?? $club->contact_phone,
            'social_links' => $club->social_links,
            'custom_domain' => $club->custom_domain,
            'is_domain_active' => $club->is_domain_active,
            'branding_tier' => $club->branding_tier,
            'features' => [
                'leaderboard' => $features->leaderboard_enabled,
                'evaluations' => $features->evaluations_enabled,
                'skills' => $features->skills_enabled,
                'training_plans' => $features->training_plans_enabled,
                'attendance_tracking' => $features->attendance_tracking_enabled,
                'swimmer_accounts' => $features->swimmer_accounts_enabled,
                'coach_portal' => $features->coach_portal_enabled,
                'subscription_plans' => $features->subscription_plans_enabled,
            ],
        ]);
    }

    /**
     * Corporate: PUT /api/v1/corporate/clubs/{club}/branding
     * Update branding fields. Busts cache on save.
     */
    public function update(Request $request, Club $club): JsonResponse
    {
        $validated = $request->validate($this->brandingRules($club->id));

        $club->update($validated);

        Cache::forget("branding_{$club->slug}");

        return response()->json($club->fresh());
    }

    /**
     * Club Manager: PUT /api/v1/club/branding
     * Update branding for the authenticated club.
     */
    public function updateOwn(Request $request): JsonResponse
    {
        $club = Club::findOrFail(app('current_club_id'));

        // Club-scoped ruleset: a manager may restyle their own club but must NOT be able
        // to self-upgrade `branding_tier` or claim a `custom_domain` — those are billing
        // and namespace decisions that belong to the corporate tier alone.
        $validated = $request->validate($this->clubManagerBrandingRules());

        $club->update($validated);

        Cache::forget("branding_{$club->slug}");

        return response()->json($club->fresh());
    }

    /**
     * Club Manager: POST /api/v1/club/branding/upload
     * Upload logo, cover, or favicon for the authenticated club.
     */
    public function uploadOwn(Request $request): JsonResponse
    {
        $club = Club::findOrFail(app('current_club_id'));

        return $this->handleUpload($request, $club);
    }

    /**
     * Corporate: POST /api/v1/corporate/clubs/{club}/branding/upload
     * Upload logo, cover, or favicon image.
     */
    public function upload(Request $request, Club $club): JsonResponse
    {
        return $this->handleUpload($request, $club);
    }

    /**
     * Shared validation rules for branding updates.
     */
    private function brandingRules(int $clubId): array
    {
        return [
            'display_name' => 'nullable|string|max:255',
            'app_name' => 'nullable|string|max:255',
            'primary_color' => ['nullable', 'string', 'regex:/^[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['nullable', 'string', 'regex:/^[0-9A-Fa-f]{6}$/'],
            'theme_color' => ['nullable', 'string', 'max:7'],
            'logo_url' => 'nullable|url|max:500',
            'cover_url' => 'nullable|url|max:500',
            'favicon_url' => 'nullable|url|max:500',
            'support_email' => 'nullable|email|max:255',
            'support_phone' => 'nullable|string|max:20',
            'social_links' => 'nullable|array',
            'social_links.instagram' => 'nullable|string|max:255',
            'social_links.twitter' => 'nullable|string|max:255',
            'social_links.facebook' => 'nullable|string|max:255',
            'custom_domain' => 'nullable|string|max:255|unique:clubs,custom_domain,'.$clubId,
            'is_domain_active' => 'nullable|boolean',
            'branding_tier' => 'nullable|string|in:shared,branded',
        ];
    }

    /**
     * Branding rules a CLUB_MANAGER may apply to their own club.
     *
     * Deliberately a subset of brandingRules(): `custom_domain`, `is_domain_active` and
     * `branding_tier` are omitted, so a manager cannot upgrade their own plan or squat a
     * domain by POSTing the field. Anything not listed here is dropped by validate().
     */
    private function clubManagerBrandingRules(): array
    {
        return [
            'display_name' => 'nullable|string|max:255',
            'app_name' => 'nullable|string|max:255',
            'primary_color' => ['nullable', 'string', 'regex:/^[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['nullable', 'string', 'regex:/^[0-9A-Fa-f]{6}$/'],
            'theme_color' => ['nullable', 'string', 'max:7'],
            'logo_url' => 'nullable|url|max:500',
            'cover_url' => 'nullable|url|max:500',
            'favicon_url' => 'nullable|url|max:500',
            'support_email' => 'nullable|email|max:255',
            'support_phone' => 'nullable|string|max:20',
            'social_links' => 'nullable|array',
            'social_links.instagram' => 'nullable|string|max:255',
            'social_links.twitter' => 'nullable|string|max:255',
            'social_links.facebook' => 'nullable|string|max:255',
        ];
    }

    /**
     * Shared file upload handler.
     * Uses content-hash filenames for CDN cache-busting without purge.
     * Disk: 's3' in production (when AWS_BUCKET is set), 'public' in dev.
     */
    private function handleUpload(Request $request, Club $club): JsonResponse
    {
        // SVG is deliberately NOT accepted. An SVG is an executable document: served from
        // the same origin as the portal it becomes stored XSS, and the portal keeps its
        // Sanctum token in localStorage where injected script can read it.
        $request->validate([
            'file' => 'required|file|mimes:png,jpg,jpeg,webp|max:2048',
            'type' => 'required|string|in:logo,cover,favicon',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');

        // Validate MIME type from file content (not just extension)
        $allowedMimes = [
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/webp' => 'webp',
        ];
        $mime = $file->getMimeType();
        abort_if(! isset($allowedMimes[$mime]), 422, 'Invalid file type');

        // Per-club upload rate limiting: max 20 uploads per hour.
        // SafeCache so a Redis outage degrades the quota instead of 500-ing the upload.
        $uploadKey = "branding_uploads_{$club->id}";
        $uploads = SafeCache::get($uploadKey, 0);
        if ($uploads >= 20) {
            abort(429, 'Upload limit exceeded. Try again later.');
        }
        SafeCache::put($uploadKey, $uploads + 1, now()->addHour());

        // Extension derived from the VALIDATED content type, never from
        // getClientOriginalExtension() — that string is attacker-controlled and would let
        // a caller pick the extension the web server later dispatches on.
        $ext = $allowedMimes[$mime];

        // Content hash for CDN cache-busting: new file = new filename = fresh CDN response
        $hash = substr(md5_file($file->getRealPath()), 0, 8);
        $filename = "{$type}-{$hash}.{$ext}";
        $storagePath = "clubs/{$club->slug}/{$filename}";

        // Use S3 in production (when configured), public disk in dev
        $diskName = config('filesystems.disks.s3.bucket') ? 's3' : 'public';
        $disk = Storage::disk($diskName);

        $options = $diskName === 's3'
            ? ['visibility' => 'public', 'ContentType' => $mime, 'CacheControl' => 'public, max-age=31536000, immutable']
            : ['visibility' => 'public'];

        $disk->put($storagePath, file_get_contents($file->getRealPath()), $options);

        $url = $disk->url($storagePath);

        $columnMap = [
            'logo' => 'logo_url',
            'cover' => 'cover_url',
            'favicon' => 'favicon_url',
        ];

        $club->update([$columnMap[$type] => $url]);

        Cache::forget("branding_{$club->slug}");

        return response()->json(['url' => $url]);
    }
}
