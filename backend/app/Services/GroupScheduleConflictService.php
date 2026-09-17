<?php

namespace App\Services;

use App\Models\Group;

/**
 * A coach can never be in two places at once: two of their groups may share a weekday
 * only if their time ranges do not overlap. Different days are always fine, whatever
 * the times.
 */
class GroupScheduleConflictService
{
    /**
     * The first of the coach's other groups that shares at least one day AND overlaps
     * in time, or null when the proposed schedule is free.
     *
     * @param  int[]  $daysOfWeek  0-6, 0 = Sunday
     * @param  string  $startTime  H:i or H:i:s
     * @param  string  $endTime  H:i or H:i:s
     * @param  int|null  $excludeGroupId  the group being edited, so it does not conflict with itself
     */
    public function findConflict(
        int $coachUserId,
        array $daysOfWeek,
        string $startTime,
        string $endTime,
        ?int $excludeGroupId = null
    ): ?Group {
        $days = array_map('intval', $daysOfWeek);
        $start = self::minutes($startTime);
        $end = self::minutes($endTime);

        $query = Group::where('coach_user_id', $coachUserId)
            ->whereNotNull('days_of_week')
            ->whereNotNull('start_time')
            ->whereNotNull('end_time');

        if ($excludeGroupId) {
            $query->where('id', '!=', $excludeGroupId);
        }

        foreach ($query->get() as $existing) {
            $shared = array_intersect(array_map('intval', $existing->days_of_week ?? []), $days);
            if (empty($shared)) {
                continue;
            }

            // Half-open ranges: a group ending at 18:00 and one starting at 18:00 do not clash.
            $overlaps = $start < self::minutes($existing->end_time)
                && $end > self::minutes($existing->start_time);

            if ($overlaps) {
                return $existing;
            }
        }

        return null;
    }

    /**
     * Minutes since midnight. Accepts "H:i" from a request and "H:i:s" from the database,
     * so the two are compared as numbers rather than as strings of unequal length.
     */
    public static function minutes(string $time): int
    {
        [$h, $m] = array_map('intval', array_slice(explode(':', $time), 0, 2));

        return $h * 60 + $m;
    }
}
