<?php

namespace App\Console\Commands;

use App\Models\Club;
use App\Models\Notification;
use App\Models\Registration;
use App\Models\SwimmerProfile;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendSubscriptionReminders extends Command
{
    protected $signature = 'notifications:subscription-reminders';
    protected $description = 'Send notifications for expiring subscriptions (14, 7, 1 day before)';

    /** Maximum execution time in seconds */
    protected int $commandTimeout = 60;

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

                // FIX: Idempotency — skip if manager already notified for this registration today
                $alreadyNotified = Notification::where('type', 'subscription_expiring')
                    ->where('user_id', $manager->id)
                    ->whereDate('created_at', now()->toDateString())
                    ->whereRaw("json_extract(data, '$.registration_id') = ?", [$reg->id])
                    ->exists();
                if ($alreadyNotified) continue;

                $bodyText = $daysLeft === 1
                    ? "{$reg->full_name}'s subscription expires tomorrow"
                    : "{$reg->full_name}'s subscription expires in {$daysLeft} days";

                $notificationService->notify(
                    userId: $manager->id,
                    type: 'subscription_expiring',
                    title: 'Subscription Expiring Soon',
                    body: $bodyText,
                    data: ['registration_id' => $reg->id, 'days_left' => $daysLeft, 'swimmer_name' => $reg->full_name],
                    clubId: $club->id,
                );

                // Notify the swimmer too (parent sees via shared account)
                $swimmerProfile = SwimmerProfile::where('club_id', $club->id)
                    ->whereHas('user', fn ($q) => $q->where('name', $reg->full_name))
                    ->first();

                if ($swimmerProfile?->user_id) {
                    $swimmerBodyText = $daysLeft === 1
                        ? 'Your subscription expires tomorrow — contact your club to renew'
                        : "Your subscription expires in {$daysLeft} days — contact your club to renew";

                    $notificationService->notify(
                        userId: $swimmerProfile->user_id,
                        type: 'subscription_expiring',
                        title: 'Your Subscription Expiring Soon',
                        body: $swimmerBodyText,
                        data: ['days_left' => $daysLeft],
                        clubId: $club->id,
                    );
                }

                $sent++;
            }
        }

        $this->info("Sent {$sent} subscription reminder(s).");

        return self::SUCCESS;
    }
}
