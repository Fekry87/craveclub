<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class AuditService
{
    public static function log(
        string $action,
        string $model,
        int|string $modelId,
        array $metadata = [],
        ?int $clubId = null
    ): void {
        Log::channel('audit')->info($action, [
            'model' => $model,
            'model_id' => $modelId,
            'user_id' => auth()->id(),
            'club_id' => $clubId ?? self::currentClubId(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Best-effort club attribution.
     *
     * `current_club_id` is only bound by the ClubContext middleware, so it is absent on
     * routes that are authenticated but not club-scoped (push-token registration, for
     * one) and in console/queue contexts. Resolving it blindly threw a
     * BindingResolutionException there and turned an audit line into a 500 — audit
     * logging must never be able to fail the operation it is recording.
     */
    private static function currentClubId(): ?int
    {
        if (app()->bound('current_club_id')) {
            return app('current_club_id');
        }

        return auth()->user()?->club_id;
    }
}
