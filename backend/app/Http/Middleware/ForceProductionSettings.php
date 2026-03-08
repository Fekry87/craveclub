<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceProductionSettings
{
    /**
     * If APP_ENV is production but APP_DEBUG is still true, abort.
     * Prevents accidental debug exposure in production.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('production') && config('app.debug')) {
            abort(500, 'Application misconfigured: debug mode must be off in production.');
        }

        return $next($request);
    }
}
