<?php

namespace App\Console\Commands;

use App\Models\TrainingSession;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendSessionReminders extends Command
{
    protected $signature = 'notifications:session-reminders';
    protected $description = 'Send reminder notifications for sessions scheduled tomorrow';

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

            $notificationService->notifyMany(
                userIds: $swimmerUserIds,
                type: 'session_reminder',
                title: 'تذكير بجلسة غداً',
                body: "لديك جلسة {$session->title} غداً الساعة {$session->start_time}",
                data: ['session_id' => $session->id],
                clubId: $session->club_id,
            );

            $sent += count($swimmerUserIds);
        }

        $this->info("Sent {$sent} session reminder(s) for " . $sessions->count() . " session(s).");

        return self::SUCCESS;
    }
}
