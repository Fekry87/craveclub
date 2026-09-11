<?php

namespace App\Services;

use App\Jobs\SendPushNotification;
use App\Models\Notification;
use App\Models\PushToken;
use App\Models\User;
use App\Support\SafeCache;
use Illuminate\Validation\ValidationException;

class NotificationService
{
    /**
     * Send a notification to a single user.
     */
    public function notify(
        int $userId,
        string $type,
        string $title,
        string $body,
        ?array $data = null,
        ?int $clubId = null,
    ): Notification {
        $notification = Notification::create([
            'user_id' => $userId,
            'club_id' => $clubId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        // Dispatch push notification to all user's devices
        $tokens = PushToken::where('user_id', $userId)->pluck('token')->toArray();
        if (! empty($tokens)) {
            SendPushNotification::dispatch($tokens, $title, $body, $data);
        }

        return $notification;
    }

    /**
     * Send a notification to multiple users.
     */
    public function notifyMany(
        array $userIds,
        string $type,
        string $title,
        string $body,
        ?array $data = null,
        ?int $clubId = null,
    ): void {
        $now = now();
        $rows = array_map(fn (int $id) => [
            'user_id' => $id,
            'club_id' => $clubId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data ? json_encode($data) : null,
            'created_at' => $now,
            'updated_at' => $now,
        ], $userIds);

        // Insert in chunks
        foreach (array_chunk($rows, 100) as $chunk) {
            Notification::insert($chunk);
        }

        // Collect all push tokens for these users
        $tokens = PushToken::whereIn('user_id', $userIds)->pluck('token')->toArray();
        if (! empty($tokens)) {
            // Send in batches of 100 (Expo limit)
            foreach (array_chunk($tokens, 100) as $batch) {
                SendPushNotification::dispatch($batch, $title, $body, $data);
            }
        }
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(int $notificationId, int $userId): bool
    {
        return Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]) > 0;
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Register or update a push token for a user.
     *
     * A token already registered to a DIFFERENT user is reassigned to the caller. That
     * transfer is required, not optional: when someone hands a phone over and a second
     * account signs in, Expo hands back the same device token, and leaving it bound to
     * the previous owner would deliver THEIR notifications to the new user's screen.
     *
     * The server cannot attest device ownership, so the residual risk is that an actor
     * who obtains someone else's token can claim it. Two controls bound that: the claim
     * is capped (see MAX_TOKEN_CLAIMS_PER_HOUR) so it cannot be used to harvest tokens
     * in bulk, and every transfer is audit-logged so a targeted claim is detectable.
     * Push tokens are never returned by any API response, so there is no in-band way to
     * learn another user's token in the first place.
     */
    private const MAX_TOKEN_CLAIMS_PER_HOUR = 3;

    public function registerPushToken(int $userId, string $token, string $platform = 'expo'): PushToken
    {
        $existing = PushToken::where('token', $token)->first();

        if ($existing && $existing->user_id !== $userId) {
            $this->guardTokenClaimRate($userId);

            $previousOwnerId = $existing->user_id;

            // Same device now used by a different account: transfer ownership,
            // refresh timestamps so it isn't treated as stale.
            $existing->update([
                'user_id' => $userId,
                'platform' => $platform,
                'updated_at' => now(),
            ]);

            AuditService::log('push_token.reassigned', PushToken::class, $existing->id, [
                'previous_user_id' => $previousOwnerId,
                'new_user_id' => $userId,
                'platform' => $platform,
            ]);

            return $existing;
        }

        return PushToken::updateOrCreate(
            ['token' => $token, 'user_id' => $userId],
            ['platform' => $platform],
        );
    }

    /**
     * Cap how many tokens one account may claim from other users per hour.
     *
     * A genuine device handover claims one token. Anything beyond a handful an hour is
     * someone walking a list of stolen tokens, so it is refused outright.
     */
    private function guardTokenClaimRate(int $userId): void
    {
        $key = "push_token_claims_{$userId}";
        $claims = SafeCache::get($key, 0);

        if ($claims >= self::MAX_TOKEN_CLAIMS_PER_HOUR) {
            AuditService::log('push_token.claim_blocked', User::class, $userId, [
                'claims_in_window' => $claims,
            ]);

            throw ValidationException::withMessages([
                'token' => 'Too many device transfers. Please try again later.',
            ]);
        }

        SafeCache::put($key, $claims + 1, now()->addHour());
    }
}
