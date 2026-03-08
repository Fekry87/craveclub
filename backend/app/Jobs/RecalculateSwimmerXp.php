<?php

namespace App\Jobs;

use App\Models\LeaderboardSetting;
use App\Models\SwimmerProfile;
use App\Services\XpCalculationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecalculateSwimmerXp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $swimmerId,
        public int $clubId,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(XpCalculationService $xpService): void
    {
        $settings = LeaderboardSetting::forClub($this->clubId);

        // Invalidate cache first so computeForSwimmer fetches fresh data
        $xpService->invalidateCache($this->swimmerId, $this->clubId);

        $xpData = $xpService->computeForSwimmer($this->swimmerId, $this->clubId, $settings);

        SwimmerProfile::where('id', $this->swimmerId)
            ->where('club_id', $this->clubId)
            ->update(['xp_points' => $xpData['total_xp']]);
    }
}
