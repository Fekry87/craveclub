<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCoachRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'bio' => 'nullable|string',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ];
    }
}
