<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\CorporateSetting;
use Illuminate\Http\JsonResponse;

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
    public function corporateBranding(): JsonResponse
    {
        $settings = CorporateSetting::allSettings();

        return response()->json([
            'platform_name' => $settings['platform_name'] ?? 'CraveClubs',
            'platform_logo_url' => $settings['platform_logo_url'] ?? null,
            'primary_color' => $settings['primary_color'] ?? '#8b5cf6',
            'secondary_color' => $settings['secondary_color'] ?? '#22d3ee',
            'tagline' => $settings['tagline'] ?? 'Club Management Platform',
        ]);
    }
}
