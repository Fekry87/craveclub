<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendGuardianSMSJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 120, 240];

    public int $timeout = 15;

    public function __construct(
        private string $guardianPhone,
        private string $guardianName,
        private string $swimmerName,
        private string $clubName,
        private int $swimmerId,
        private int $sessionId,
    ) {}

    public function handle(): void
    {
        $message = "Dear Guardian, {$this->swimmerName} was absent from today's training session at {$this->clubName}.";

        Log::channel('daily')->info('GUARDIAN_SMS', [
            'to' => $this->guardianPhone,
            'guardian_name' => $this->guardianName,
            'swimmer_name' => $this->swimmerName,
            'swimmer_id' => $this->swimmerId,
            'session_id' => $this->sessionId,
            'club_name' => $this->clubName,
            'message' => $message,
        ]);
    }
}
