<?php

namespace App\Http\Requests;

use App\Enums\TrainingType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'coach_user_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('club_id', app('current_club_id')),
            ],
            'group_type' => ['required', Rule::in(TrainingType::ALL)],
            'capacity' => 'required|integer|min:1|max:500',
            'days_of_week' => 'required|array|min:1',
            'days_of_week.*' => 'integer|between:0,6|distinct',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            GroupDayCount::check($validator, $this->input('group_type'), $this->input('days_of_week', []));
        });
    }
}
