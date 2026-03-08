<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTrainingPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'level' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.sort_order' => 'integer',
            'items.*.stroke' => 'nullable|string|max:100',
            'items.*.drill' => 'nullable|string|max:255',
            'items.*.distance' => 'nullable|string|max:100',
            'items.*.reps' => 'nullable|integer',
            'items.*.interval' => 'nullable|string|max:100',
            'items.*.notes' => 'nullable|string',
        ];
    }
}
