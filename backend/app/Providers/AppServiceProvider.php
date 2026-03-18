<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Per-user rate limiting: authenticated users get 60 req/min keyed by user ID,
        // unauthenticated guests get 20 req/min keyed by IP.
        // Load testing: use env var to override rate limits (default: 60 auth, 20 guest)
        $authLimit = (int) env('RATE_LIMIT_AUTH', 60);
        $guestLimit = (int) env('RATE_LIMIT_GUEST', 20);
        RateLimiter::for('by_user', function (Request $request) use ($authLimit, $guestLimit) {
            return $request->user()
                ? Limit::perMinute($authLimit)->by($request->user()->id)
                : Limit::perMinute($guestLimit)->by($request->ip());
        });

        // Slow query logger — catches queries over 100ms for production monitoring
        // Includes request context (request_id, club_id, URL) for correlation
        DB::listen(function ($query) {
            if ($query->time > 100) {
                Log::channel('daily')->warning('SLOW_QUERY', [
                    'sql'        => $query->sql,
                    'bindings'   => app()->isProduction() ? '[redacted]' : $query->bindings,
                    'time_ms'    => $query->time,
                    'request_id' => app()->has('request_id') ? app('request_id') : null,
                    'club_id'    => app()->has('current_club_id') ? app('current_club_id') : null,
                    'url'        => request()?->fullUrl(),
                ]);
            }
        });
    }
}
