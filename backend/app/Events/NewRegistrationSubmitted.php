<?php

namespace App\Events;

use App\Models\Registration;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewRegistrationSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Registration $registration)
    {
        //
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('club.'.$this->registration->club_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NewRegistrationSubmitted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->registration->id,
            'swimmer_name' => $this->registration->full_name,
            'swimmer_phone' => $this->registration->phone,
            'branch_name' => $this->registration->branch?->name,
            'coach_name' => $this->registration->coach?->user?->name,
            'plan_name' => $this->registration->plan?->name,
            'total_amount' => $this->registration->total_amount,
            'status' => $this->registration->status,
            'created_at' => $this->registration->created_at->toISOString(),
        ];
    }
}
