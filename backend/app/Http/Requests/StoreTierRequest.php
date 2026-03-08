<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:50',
            'xp_threshold' => 'required|integer|min:0',
            'color' => 'required|string|max:7',
            'icon' => 'nullable|string|max:10',
        ];
    }
}
