<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'group_id' => [
                'sometimes',
                Rule::exists('groups', 'id')->where('club_id', app('current_club_id')),
            ],
            'plan_id' => [
                'nullable',
                Rule::exists('training_plans', 'id')->where('club_id', app('current_club_id')),
            ],
            'date' => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ];
    }
}
