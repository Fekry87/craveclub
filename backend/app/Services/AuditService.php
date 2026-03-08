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
            'club_id' => $clubId ?? app('current_club_id'),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
