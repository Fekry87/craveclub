<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClubContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->club_id) {
            app()->instance('current_club_id', $request->user()->club_id);
        } elseif ($request->user()) {
            // FIX: Abort with 403 if authenticated user has no club_id — prevents
            // container binding exceptions in club-scoped controllers
            abort(403, 'User is not associated with any club.');
        }

        // Add user context to Sentry for error tracking
        if (app()->bound('sentry')) {
            \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($request): void {
                $scope->setUser([
                    'id'      => $request->user()?->id,
                    'email'   => $request->user()?->email,
                    'club_id' => app()->has('current_club_id') ? app('current_club_id') : null,
                ]);
            });
        }

        return $next($request);
    }
}
