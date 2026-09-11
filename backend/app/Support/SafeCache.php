<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Cache access that degrades gracefully when the store is unreachable.
 *
 * Every counter in this app (login lockout, registration throttle, branding upload
 * quota) is a *defensive* control layered on top of the route throttles. Losing Redis
 * must not take the endpoint down with it — a cache blip would otherwise turn
 * `Cache::get()` into a 500 on every login and lock out the entire tenant.
 *
 * Reads fall back to the supplied default, writes are dropped, and the failure is
 * logged. Catches Throwable (not Exception): a missing predis/phpredis class raises
 * an Error, which does not extend Exception.
 */
class SafeCache
{
    public static function get(string $key, mixed $default = null): mixed
    {
        try {
            return Cache::get($key, $default);
        } catch (Throwable $e) {
            self::warn('get', $key, $e);

            return $default;
        }
    }

    public static function put(string $key, mixed $value, mixed $ttl = null): bool
    {
        try {
            return Cache::put($key, $value, $ttl);
        } catch (Throwable $e) {
            self::warn('put', $key, $e);

            return false;
        }
    }

    public static function forget(string $key): bool
    {
        try {
            return Cache::forget($key);
        } catch (Throwable $e) {
            self::warn('forget', $key, $e);

            return false;
        }
    }

    /**
     * Cache-aside read. On a cache failure the callback still runs, so the caller
     * always gets real data — just without the caching.
     */
    public static function remember(string $key, mixed $ttl, Closure $callback): mixed
    {
        try {
            return Cache::remember($key, $ttl, $callback);
        } catch (Throwable $e) {
            self::warn('remember', $key, $e);

            return $callback();
        }
    }

    private static function warn(string $operation, string $key, Throwable $e): void
    {
        Log::warning('Cache unavailable, degrading gracefully', [
            'operation' => $operation,
            'key' => $key,
            'error' => $e->getMessage(),
        ]);
    }
}
