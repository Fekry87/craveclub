<?php

namespace App\Http\Requests;

use App\Enums\TrainingType;
use Illuminate\Validation\Validator;

/**
 * The one rule both group requests share: the number of selected weekdays must match
 * the group type (daily = 7, three_days = 3, two_days = 2; private is free-form).
 */
class GroupDayCount
{
    public static function check(Validator $validator, ?string $type, array $days): void
    {
        $expected = TrainingType::expectedDayCount($type);
        if ($expected === null) {
            return;
        }

        $count = count(array_unique(array_map('intval', $days)));
        if ($count !== $expected) {
            $validator->errors()->add(
                'days_of_week',
                "A {$type} group must meet on exactly {$expected} day(s); {$count} selected."
            );
        }
    }
}
