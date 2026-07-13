<?php

namespace App\Services;

use App\Jobs\SendPushNotification;
use App\Models\Notification;
use App\Models\PushToken;

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
     * Scoped to (token, user_id): a token already registered to a DIFFERENT user
     * is reassigned to the current user (device handed over / account switch on the
     * same physical device) rather than silently leaving it bound to the old owner.
     * This closes the "re-bind by token string" cross-user hijack — the actor must
     * hold both the (high-entropy) token AND an authenticated session as themselves.
     */
    public function registerPushToken(int $userId, string $token, string $platform = 'expo'): PushToken
    {
        $existing = PushToken::where('token', $token)->first();

        if ($existing && $existing->user_id !== $userId) {
            // Same device now used by a different account: transfer ownership,
            // refresh timestamps so it isn't treated as stale.
            $existing->update([
                'user_id' => $userId,
                'platform' => $platform,
                'updated_at' => now(),
            ]);

            return $existing;
        }

        return PushToken::updateOrCreate(
            ['token' => $token, 'user_id' => $userId],
            ['platform' => $platform],
        );
    }
}
