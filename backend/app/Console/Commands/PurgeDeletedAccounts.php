<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PurgeDeletedAccounts extends Command
{
    protected $signature = 'accounts:purge {--dry-run : Show what would happen without executing}';

    protected $description = 'Permanently delete accounts past the 30-day grace period';

    public function handle(): int
    {
        $expired = User::withTrashed()
            ->whereNotNull('scheduled_purge_at')
            ->where('scheduled_purge_at', '<=', now())
            ->get();

        if ($expired->isEmpty()) {
            $this->info('No accounts to purge.');

            return 0;
        }

        $this->info("Found {$expired->count()} account(s) to purge.");

        foreach ($expired as $user) {
            if ($this->option('dry-run')) {
                $this->line("[DRY RUN] Would purge: {$user->email}");

                continue;
            }

            $user->tokens()->delete();
            $user->pushTokens()->delete();
            $user->notifications()->delete();

            // Soft-delete related profiles (preserves data for audit)
            $user->swimmerProfile?->delete();
            $user->coachProfile?->delete();

            $user->forceDelete();

            Log::channel('daily')->info('ACCOUNT_PURGED', [
                'email' => $user->email,
                'club_id' => $user->club_id,
                'purged_at' => now()->toIso8601String(),
            ]);

            $this->info("Purged: {$user->email}");
        }

        return 0;
    }
}
