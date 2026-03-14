<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubFeature;
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
        $data = Cache::remember("branding_{$slug}", 3600, function () use ($slug) {
            $club = Club::where('slug', $slug)
                ->where('is_active', true)
                ->first();

            if (!$club) {
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
        });

        if ($data === null) {
            // Clear the null cache entry so next request retries
            Cache::forget("branding_{$slug}");
            abort(404, 'Club not found.');
        }

        return response()->json($data);
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
        $validated = $request->validate([
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
            'custom_domain' => 'nullable|string|max:255|unique:clubs,custom_domain,' . $club->id,
            'is_domain_active' => 'nullable|boolean',
            'branding_tier' => 'nullable|string|in:shared,branded',
        ]);

        $club->update($validated);

        Cache::forget("branding_{$club->slug}");

        return response()->json($club->fresh());
    }

    /**
     * Corporate: POST /api/v1/corporate/clubs/{club}/branding/upload
     * Upload logo, cover, or favicon image.
     */
    public function upload(Request $request, Club $club): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:png,jpg,jpeg,svg|max:2048',
            'type' => 'required|string|in:logo,cover,favicon',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');
        $ext = $file->getClientOriginalExtension();

        $path = $file->storeAs(
            "clubs/{$club->slug}",
            "{$type}.{$ext}",
            'public'
        );

        $url = Storage::disk('public')->url($path);

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
