<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Global middleware: tracks response time on ALL requests,
 * adds X-Response-Time header, and logs slow requests (>500ms).
 */
class TrackResponseTime
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        $response->headers->set('X-Response-Time', $duration . 'ms');

        // Log slow requests (> 500ms)
        if ($duration > 500) {
            Log::channel('daily')->warning('SLOW_REQUEST', [
                'method' => $request->method(),
                'path' => $request->path(),
                'duration' => $duration,
                'user_id' => $request->user()?->id,
                'club_id' => app()->has('current_club_id') ? app('current_club_id') : null,
                'request_id' => app()->has('request_id') ? app('request_id') : null,
            ]);
        }

        return $response;
    }
}
