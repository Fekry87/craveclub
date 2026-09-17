<?php

namespace App\Enums;

/**
 * The one vocabulary for "how often a member trains".
 *
 * Subscription plans carry it as `training_type` and groups as `group_type`, and the
 * mobile app already speaks these four values, so plans, groups and the app all agree
 * on the same words. Keep the values here only; never inline the string list again.
 */
class TrainingType
{
    public const DAILY = 'daily';

    public const TWO_DAYS = 'two_days';

    public const THREE_DAYS = 'three_days';

    public const PRIVATE = 'private';

    public const ALL = [self::DAILY, self::TWO_DAYS, self::THREE_DAYS, self::PRIVATE];

    /**
     * How many weekdays a group of each type must meet on. Private groups keep their
     * own custom schedule, so there is no fixed count for them.
     */
    public const DAY_COUNTS = [
        self::DAILY => 7,
        self::THREE_DAYS => 3,
        self::TWO_DAYS => 2,
        self::PRIVATE => null,
    ];

    public static function expectedDayCount(?string $type): ?int
    {
        return self::DAY_COUNTS[$type] ?? null;
    }
}
