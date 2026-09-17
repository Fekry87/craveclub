<?php

namespace App\Http\Requests;

use App\Models\Group;
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
            'group_type' => ['sometimes', Rule::in(Group::TYPES)],
            // Null = no limit.
            'capacity' => 'nullable|integer|min:1|max:500',
            'days_of_week' => 'nullable|array',
            'days_of_week.*' => 'integer|min:0|max:6',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ];
    }
}
