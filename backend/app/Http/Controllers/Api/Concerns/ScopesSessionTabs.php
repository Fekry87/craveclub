<?php

namespace App\Http\Controllers\Api\Concerns;

use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * The app's session tabs (All / Upcoming / Completed), filtered, sorted and
 * counted by the server — one rule for the swimmer's list and the coach's.
 *
 * The app used to split whatever pages it had loaded into tabs itself. With
 * sessions generated weeks ahead and sorted newest first, page one held only
 * far-future sessions: Completed read 0 until somebody scrolled, and every
 * refresh (which reloads page one) emptied it again.
 *
 * - upcoming:  today onwards (Scheduled, Live, Cancelled) plus anything Live;
 *              soonest first
 * - completed: Completed, and Cancelled sessions whose day has passed; most
 *              recent first
 * - all:       upcoming soonest first, then the past most recent first
 */
trait ScopesSessionTabs
{
    protected function scopeUpcoming($query, string $today)
    {
        return $query->where(fn ($q) => $q
            ->where('status', 'Live')
            ->orWhere(fn ($q) => $q
                ->whereDate('date', '>=', $today)
                ->whereIn('status', ['Scheduled', 'Cancelled'])));
    }

    protected function scopeCompleted($query, string $today)
    {
        return $query->where(fn ($q) => $q
            ->where('status', 'Completed')
            ->orWhere(fn ($q) => $q
                ->where('status', 'Cancelled')
                ->whereDate('date', '<', $today)));
    }

    /** Apply one tab's filter and order. Returns false for an unknown scope. */
    protected function applySessionTab($query, ?string $scope, string $today): bool
    {
        switch ($scope) {
            case 'upcoming':
                $this->scopeUpcoming($query, $today)->orderBy('date')->orderBy('start_time');

                return true;
            case 'completed':
                $this->scopeCompleted($query, $today)->orderByDesc('date')->orderByDesc('start_time');

                return true;
            case 'all':
                $query
                    ->orderByRaw('CASE WHEN date >= ? THEN 0 ELSE 1 END', [$today])
                    ->orderByRaw('CASE WHEN date >= ? THEN date END ASC', [$today])
                    ->orderByRaw('CASE WHEN date < ? THEN date END DESC', [$today])
                    ->orderBy('start_time');

                return true;
            default:
                return false;
        }
    }

    /** Badge counts for every tab, so they are right before any tab is opened. */
    protected function sessionTabCounts($base, string $today): array
    {
        return [
            'all' => (clone $base)->count(),
            'upcoming' => $this->scopeUpcoming(clone $base, $today)->count(),
            'completed' => $this->scopeCompleted(clone $base, $today)->count(),
        ];
    }

    /**
     * The viewer's local date: the device's `today`, when it is within a day of
     * the server's UTC date, otherwise the server's. The server runs on UTC,
     * which is still "yesterday" for the first hours of an Egyptian morning.
     */
    protected function deviceToday(Request $request): string
    {
        $server = now()->startOfDay();
        $claimed = $request->input('today');

        if ($claimed) {
            $device = Carbon::createFromFormat('Y-m-d', $claimed)->startOfDay();
            if (abs($device->diffInDays($server)) <= 1) {
                return $device->toDateString();
            }
        }

        return $server->toDateString();
    }
}
