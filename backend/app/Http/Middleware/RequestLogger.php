<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = Str::uuid()->toString();
        $request->headers->set('X-Request-Id', $requestId);
        $startTime = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        Log::channel('daily')->info('API Request', [
            'request_id' => $requestId,
            'method' => $request->method(),
            'uri' => $request->path(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'user_id' => $request->user()?->id,
            'club_id' => $request->user()?->club_id,
            'ip' => $request->ip(),
        ]);

        $response->headers->set('X-Request-Id', $requestId);
        $response->headers->set('X-Response-Time', $duration . 'ms');

        return $response;
    }
}
