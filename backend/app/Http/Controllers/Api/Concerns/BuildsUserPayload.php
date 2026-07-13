<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\ClubFeature;
use App\Models\CorporateSetting;
use Illuminate\Http\Request;

/**
 * Shared enriched-user payload so every auth entry point (login, /me,
 * account reactivation) returns the same shape — including `features`,
 * which the mobile app relies on for feature gating.
 */
trait BuildsUserPayload
{
    protected function buildUserPayload($user): array
    {
        $user->load('club');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'club_id' => $user->club_id,
            'club' => $user->club,
            'features' => $user->club_id ? ClubFeature::forClub($user->club_id) : null,
            'corporate' => CorporateSetting::allSettings(),
        ];
    }

    /**
     * Token expiry: 30 days for mobile clients (X-Platform ios/android),
     * null (falls back to sanctum.expiration / 24h) for web.
     */
    protected function tokenExpiryForRequest(Request $request): ?\DateTimeInterface
    {
        $platform = $request->header('X-Platform', 'web');

        return in_array($platform, ['ios', 'android']) ? now()->addDays(30) : null;
    }
}
