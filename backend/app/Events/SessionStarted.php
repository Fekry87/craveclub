<?php

namespace App\Events;

use App\Models\TrainingSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  int[]  $swimmerUserIds  user ids of the session's effective roster (swimmers with accounts)
     */
    public function __construct(
        public TrainingSession $session,
        public array $swimmerUserIds,
    ) {}

    public function broadcastOn(): array
    {
        return array_map(
            fn (int $userId) => new PrivateChannel('swimmer.'.$userId),
            $this->swimmerUserIds
        );
    }

    public function broadcastAs(): string
    {
        return 'SessionStarted';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->id,
            'title' => $this->session->title,
            'date' => $this->session->date,
            'start_time' => $this->session->start_time,
            'status' => $this->session->status,
            'group_name' => $this->session->group?->name,
        ];
    }
}
