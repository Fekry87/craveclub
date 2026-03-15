<?php

namespace App\Console\Commands;

use App\Models\Club;
use App\Models\Registration;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendSubscriptionReminders extends Command
{
    protected $signature = 'notifications:subscription-reminders';
    protected $description = 'Send notifications for expiring subscriptions (14, 7, 1 day before)';

    public function handle(NotificationService $notificationService): int
    {
        $sent = 0;

        // Subscription expiry is computed from: registration approved_at + plan.duration_months
        // Since there's no subscription_end_date on SwimmerProfile, we derive it from approved registrations
        $clubs = Club::all();

        foreach ($clubs as $club) {
            $manager = User::where('club_id', $club->id)
                ->where('role', 'CLUB_MANAGER')
                ->first();

            if (!$manager) continue;

            $approvedRegistrations = Registration::where('club_id', $club->id)
                ->where('status', 'approved')
                ->whereNotNull('plan_id')
                ->with(['plan'])
                ->get();

            foreach ($approvedRegistrations as $reg) {
                if (!$reg->plan || !$reg->plan->duration_months) continue;

                $endDate = $reg->updated_at->copy()->addMonths($reg->plan->duration_months);
                $daysLeft = (int) now()->startOfDay()->diffInDays($endDate->startOfDay(), false);

                if (!in_array($daysLeft, [14, 7, 1])) continue;

                $bodyText = $daysLeft === 1
                    ? "اشتراك {$reg->full_name} ينتهي غداً"
                    : "اشتراك {$reg->full_name} ينتهي خلال {$daysLeft} أيام";

                $notificationService->notify(
                    userId: $manager->id,
                    type: 'subscription_expiring',
                    title: 'اشتراك ينتهي قريباً',
                    body: $bodyText,
                    data: ['registration_id' => $reg->id, 'days_left' => $daysLeft, 'swimmer_name' => $reg->full_name],
                    clubId: $club->id,
                );

                $sent++;
            }
        }

        $this->info("Sent {$sent} subscription reminder(s).");

        return self::SUCCESS;
    }
}
