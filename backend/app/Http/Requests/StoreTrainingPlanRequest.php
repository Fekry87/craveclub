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
            'duration_weeks' => 'nullable|integer|min:1|max:52',
            'duration_unit' => 'nullable|in:weeks,months',
            'sessions_per_week' => 'nullable|integer|min:1|max:7',
            'goals' => 'nullable|string',
            'difficulty_level' => 'nullable|string|in:beginner,intermediate,advanced',
            'is_template' => 'nullable|boolean',
            'phases' => 'nullable|array',
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
