<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSwimmerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'level' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'guardian_email' => 'nullable|email|max:255',
            'medical_notes' => 'nullable|string',
            'create_login' => 'nullable|boolean',
            'email' => 'nullable|required_if:create_login,true|email|unique:users,email',
            'password' => 'nullable|required_if:create_login,true|string|min:8',
        ];
    }
}
