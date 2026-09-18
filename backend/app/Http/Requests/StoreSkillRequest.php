<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSkillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function messages(): array
    {
        return ['numeric_value.required_if' => 'Enter the distance in meters.'];
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'type' => 'required|in:SKILL,SWIM_TYPE,TECHNIQUE,DISTANCE',
            'description' => 'nullable|string',
            // A distance is its meters; the other types have no number.
            'numeric_value' => 'nullable|required_if:type,DISTANCE|numeric|min:1|max:9999.99',
        ];
    }
}
