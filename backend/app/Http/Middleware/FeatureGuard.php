<?php

namespace App\Http\Middleware;

use App\Models\ClubFeature;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FeatureGuard
{
    /**
     * Check if a feature is enabled for the current user's club.
     * Platform admins (no club_id) bypass this guard.
     *
     * Usage: middleware('feature:leaderboard')
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $clubId = $request->user()?->club_id;

        // Platform admins have no club_id — skip guard
        if (! $clubId) {
            return $next($request);
        }

        $features = ClubFeature::forClub($clubId);

        if (! $features->isEnabled($feature)) {
            return response()->json([
                'message' => 'This feature is not enabled for your club.',
                'feature' => $feature,
            ], 403);
        }

        return $next($request);
    }
}
