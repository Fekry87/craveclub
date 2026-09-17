<?php

namespace App\Services;

use App\Events\SessionCancelled;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Cancelling a session — the only way a session leaves the schedule.
 *
 * Sessions used to be deleted from the portal, which erased them from the
 * swimmers' app without a word and from the club's history. A cancelled session
 * keeps its record, carries the reason the coach or manager gave, and tells
 * everyone on its roster.
 */
class SessionCancellationService
{
    public function __construct(private NotificationService $notifications) {}

    /**
     * @return bool false when the session is no longer Scheduled (already
     *              started, completed or cancelled) — nothing was changed.
     */
    public function cancel(TrainingSession $session, User $by, string $reason): bool
    {
        // Conditional update rather than check-then-save, so two clicks (or a
        // coach and a manager at once) can't both cancel and notify twice.
        $updated = TrainingSession::whereKey($session->id)
            ->where('status', 'Scheduled')
            ->update([
                'status' => 'Cancelled',
                'cancellation_reason' => trim($reason),
                'cancelled_at' => now(),
                'cancelled_by_user_id' => $by->id,
            ]);

        if (! $updated) {
            return false;
        }

        $session->refresh();

        // The cancellation is committed; telling people is best-effort.
        try {
            $this->notifyAffected($session, $by);
        } catch (\Throwable $e) {
            Log::warning('Session cancellation notifications failed: '.$e->getMessage());
        }

        return true;
    }

    private function notifyAffected(TrainingSession $session, User $by): void
    {
        $session->loadMissing(['group.swimmers', 'sessionSwimmers', 'sessionExclusions']);

        $label = $session->title ?: ($session->type ?: 'Training session');
        $when = Carbon::parse($session->date)->format('D j M')
            .($session->start_time ? ' at '.substr((string) $session->start_time, 0, 5) : '');
        $body = "{$label} on {$when} was cancelled. Reason: {$session->cancellation_reason}";
        $data = ['type' => 'session_cancelled', 'session_id' => $session->id];

        $swimmerUserIds = $session->effective_swimmers
            ->pluck('user_id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();

        if ($swimmerUserIds) {
            $this->notifications->notifyMany(
                userIds: $swimmerUserIds,
                type: 'session_cancelled',
                title: 'Session cancelled',
                body: $body,
                data: $data,
                clubId: $session->club_id,
            );

            try {
                broadcast(new SessionCancelled($session, $swimmerUserIds));
            } catch (\Throwable $e) {
                Log::warning('SessionCancelled broadcast failed: '.$e->getMessage());
            }
        }

        // A manager cancelling a coach's session: the coach must hear it too.
        $coachUserId = $session->coach_user_id ?? $session->group?->coach_user_id;
        if ($coachUserId && (int) $coachUserId !== $by->id) {
            $this->notifications->notify(
                userId: (int) $coachUserId,
                type: 'session_cancelled',
                title: 'Session cancelled by the club',
                body: $body,
                data: $data,
                clubId: $session->club_id,
            );
        }
    }
}
