<?php

namespace Tests\Support;

use Illuminate\Contracts\Cache\Store;
use RuntimeException;

/**
 * A cache store where every operation fails, standing in for an unreachable Redis.
 *
 * Mocking the Cache facade is not enough to exercise the rate limiter: RateLimiter is
 * constructed with a concrete Repository instance, so it never goes through the facade.
 */
class ThrowingCacheStore implements Store
{
    private function boom(): never
    {
        throw new RuntimeException('Connection refused [tcp://redis:6379]');
    }

    public function get($key)
    {
        $this->boom();
    }

    public function many(array $keys)
    {
        $this->boom();
    }

    public function put($key, $value, $seconds)
    {
        $this->boom();
    }

    public function putMany(array $values, $seconds)
    {
        $this->boom();
    }

    public function increment($key, $value = 1)
    {
        $this->boom();
    }

    public function decrement($key, $value = 1)
    {
        $this->boom();
    }

    public function forever($key, $value)
    {
        $this->boom();
    }

    public function forget($key)
    {
        $this->boom();
    }

    public function flush()
    {
        $this->boom();
    }

    public function getPrefix()
    {
        return '';
    }
}
