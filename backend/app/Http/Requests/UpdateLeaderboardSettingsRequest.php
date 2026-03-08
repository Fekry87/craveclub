<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaderboardSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating_xp_1' => 'required|integer|min:0|max:9999',
            'rating_xp_2' => 'required|integer|min:0|max:9999',
            'rating_xp_3' => 'required|integer|min:0|max:9999',
            'rating_xp_4' => 'required|integer|min:0|max:9999',
            'rating_xp_5' => 'required|integer|min:0|max:9999',
            'attendance_xp' => 'required|integer|min:0|max:9999',
            'streak_bonus_xp' => 'required|integer|min:0|max:9999',
            'streak_threshold' => 'required|integer|min:2|max:50',
        ];
    }
}
