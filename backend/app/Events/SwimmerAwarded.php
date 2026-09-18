<?php

namespace App\Events;

use App\Models\SwimmerAward;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A swimmer was named Man of the Day / Week / Month. Broadcast club-wide so every
 * member currently online sees the celebration live; offline members pick it up
 * from GET /swimmer/awards/pending on their next app open.
 */
class SwimmerAwarded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public SwimmerAward $award) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('club.'.$this->award->club_id.'.members')];
    }

    public function broadcastAs(): string
    {
        return 'SwimmerAwarded';
    }

    public function broadcastWith(): array
    {
        $this->award->loadMissing('swimmer');

        return [
            'award_id' => $this->award->id,
            'swimmer_id' => $this->award->swimmer_id,
            'swimmer_name' => trim($this->award->swimmer?->first_name.' '.$this->award->swimmer?->last_name),
            'award_name' => $this->award->award_name,
            'xp_value' => $this->award->xp_value,
            'awarded_at' => $this->award->created_at?->toIso8601String(),
        ];
    }
}
