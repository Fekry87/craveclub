<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'group_id' => [
                'required',
                Rule::exists('groups', 'id')->where('club_id', app('current_club_id')),
            ],
            'plan_id' => [
                'nullable',
                Rule::exists('training_plans', 'id')->where('club_id', app('current_club_id')),
            ],
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ];
    }
}
