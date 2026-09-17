<?php

namespace App\Http\Requests;

use App\Enums\TrainingType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'coach_user_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('club_id', app('current_club_id')),
            ],
            'group_type' => ['sometimes', Rule::in(TrainingType::ALL)],
            'capacity' => 'sometimes|integer|min:1|max:500',
            'days_of_week' => 'sometimes|array|min:1',
            'days_of_week.*' => 'integer|between:0,6|distinct',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // A partial update is judged against the group as it will be after the
            // change, so fields left out fall back to what is stored.
            $group = $this->route('group');
            $type = $this->input('group_type', $group?->group_type);
            $days = $this->has('days_of_week') ? $this->input('days_of_week', []) : ($group?->days_of_week ?? null);
            $start = $this->input('start_time', $group?->start_time);
            $end = $this->input('end_time', $group?->end_time);

            if ($days !== null && ($this->has('days_of_week') || $this->has('group_type'))) {
                GroupDayCount::check($validator, $type, $days);
            }

            if ($start && $end && ($this->has('start_time') || $this->has('end_time'))
                && \App\Services\GroupScheduleConflictService::minutes($end) <= \App\Services\GroupScheduleConflictService::minutes($start)) {
                $validator->errors()->add('end_time', 'The end time must be after the start time.');
            }
        });
    }
}
