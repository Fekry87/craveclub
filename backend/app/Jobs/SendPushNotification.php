<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [30, 60, 120];
    public int $timeout = 30;

    /**
     * @param  string[]  $tokens  Expo push tokens
     */
    public function __construct(
        public array $tokens,
        public string $title,
        public string $body,
        public ?array $data = null,
    ) {}

    public function handle(): void
    {
        if (empty($this->tokens)) {
            return;
        }

        $messages = array_map(fn (string $token) => [
            'to' => $token,
            'sound' => 'default',
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data ?? (object) [],
        ], $this->tokens);

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->post('https://exp.host/--/api/v2/push/send', $messages);

            if ($response->failed()) {
                Log::warning('Expo push notification failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'token_count' => count($this->tokens),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Expo push notification exception', [
                'message' => $e->getMessage(),
                'token_count' => count($this->tokens),
            ]);

            throw $e; // Re-throw so the job retries
        }
    }
}
