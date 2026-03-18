<?php

namespace App\Http\Middleware;

use App\Models\Club;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveClubFromHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->header('X-Club-Slug');

        if (! $slug) {
            return response()->json([
                'message' => 'X-Club-Slug header is required.',
            ], 422);
        }

        $club = Club::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $club) {
            return response()->json([
                'message' => 'Club not found or inactive.',
            ], 404);
        }

        // Same key used by ClubContext — consistent across the app
        app()->instance('current_club_id', $club->id);
        app()->instance('current_club', $club);

        return $next($request);
    }
}
