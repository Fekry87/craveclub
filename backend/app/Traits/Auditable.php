<?php

namespace App\Traits;

use App\Models\AuditLog;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            self::logAudit($model, 'created', null, $model->toArray());
        });

        static::updated(function ($model) {
            self::logAudit($model, 'updated', $model->getOriginal(), $model->toArray());
        });

        static::deleted(function ($model) {
            self::logAudit($model, 'deleted', $model->toArray(), null);
        });
    }

    protected static function logAudit($model, string $action, ?array $before, ?array $after): void
    {
        try {
            AuditLog::create([
                'club_id' => $model->club_id ?? (auth()->user()?->club_id ?? null),
                'actor_user_id' => auth()->id(),
                'action' => $action,
                'entity_type' => get_class($model),
                'entity_id' => $model->id,
                'before_json' => $before,
                'after_json' => $after,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Don't let audit logging break the app
        }
    }
}
