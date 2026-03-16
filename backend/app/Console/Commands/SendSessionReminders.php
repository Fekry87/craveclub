<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\TrainingSession;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendSessionReminders extends Command
{
    protected $signature = 'notifications:session-reminders';
    protected $description = 'Send reminder notifications for sessions scheduled tomorrow';

    /** Maximum execution time in seconds */
    protected int $commandTimeout = 60;

    public function handle(NotificationService $notificationService): int
    {
        $tomorrow = now()->addDay()->toDateString();

        $sessions = TrainingSession::where('date', $tomorrow)
            ->where('status', 'Scheduled')
            ->get();

        $sent = 0;

        foreach ($sessions as $session) {
            // Get swimmer user_ids via group_memberships (more efficient than effective_swimmers accessor)
            $swimmerUserIds = DB::table('group_memberships')
                ->join('swimmer_profiles', 'group_memberships.swimmer_id', '=', 'swimmer_profiles.id')
                ->where('group_memberships.group_id', $session->group_id)
                ->whereNotNull('swimmer_profiles.user_id')
                ->pluck('swimmer_profiles.user_id')
                ->toArray();

            if (empty($swimmerUserIds)) continue;

            // FIX: Idempotency — skip users already notified for this session today
            $alreadyNotified = Notification::where('type', 'session_reminder')
                ->whereIn('user_id', $swimmerUserIds)
                ->whereDate('created_at', now()->toDateString())
                ->pluck('user_id')
                ->toArray();
            $swimmerUserIds = array_values(array_diff($swimmerUserIds, $alreadyNotified));
            if (empty($swimmerUserIds)) continue;

            $notificationService->notifyMany(
                userIds: $swimmerUserIds,
                type: 'session_reminder',
                title: 'Session Reminder — Tomorrow',
                body: "You have a session: {$session->title} tomorrow at {$session->start_time}",
                data: ['session_id' => $session->id],
                clubId: $session->club_id,
            );

            $sent += count($swimmerUserIds);
        }

        $this->info("Sent {$sent} session reminder(s) for " . $sessions->count() . " session(s).");

        return self::SUCCESS;
    }
}
