<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * `throttle` that fails OPEN when the rate-limiter's cache store is unreachable.
 *
 * Laravel's ThrottleRequests keeps its counters in the cache, so with
 * CACHE_STORE=redis a Redis outage makes every throttled route — login included —
 * return 500. That is the same failure the app-level counters were moved onto
 * SafeCache to avoid; the framework half has to degrade too, or the tenant is locked
 * out of the product by an infrastructure blip rather than by a rate limit.
 *
 * Rate limiting is a defensive control layered on top of authentication, so losing it
 * briefly is strictly better than losing the product. A genuine 429 still propagates.
 */
class ResilientThrottleRequests extends ThrottleRequests
{
    public function handle($request, Closure $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = '')
    {
        $response = null;
        $downstreamRan = false;

        // Wrap $next so we can tell a limiter failure (before the app ran) apart from an
        // application failure (after it ran). The parent touches the cache on BOTH sides
        // of $next — tooManyAttempts/hit before it, response headers after it.
        $tracked = function ($tracked_request) use ($next, &$response, &$downstreamRan) {
            $downstreamRan = true;

            return $response = $next($tracked_request);
        };

        try {
            return parent::handle($request, $tracked, $maxAttempts, $decayMinutes, $prefix);
        } catch (ThrottleRequestsException $e) {
            // A real rate limit. Must still reach the client as 429.
            throw $e;
        } catch (Throwable $e) {
            if ($downstreamRan) {
                // The application itself threw — that is not ours to swallow.
                if ($response === null) {
                    throw $e;
                }

                // The limiter only failed while stamping X-RateLimit-* headers.
                // The response is complete; send it without them.
                $this->warn($request, $e, 'headers');

                return $response;
            }

            $this->warn($request, $e, 'counter');

            return $next($request);
        }
    }

    private function warn($request, Throwable $e, string $stage): void
    {
        Log::warning('Rate limiter unavailable, allowing request', [
            'stage' => $stage,
            'path' => $request->path(),
            'error' => $e->getMessage(),
        ]);
    }
}
