<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AccountDeletionController extends Controller
{
    /**
     * POST /api/v1/account/delete
     * Initiate soft delete — starts 30-day countdown.
     */
    public function requestDeletion(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isPendingDeletion()) {
            return response()->json([
                'message' => 'Account is already scheduled for deletion.',
                'scheduled_purge_at' => $user->scheduled_purge_at->toIso8601String(),
                'days_remaining' => $user->daysUntilPurge(),
            ], 409);
        }

        $purgeAt = now()->addDays(30);

        $user->update([
            'deletion_requested_at' => now(),
            'scheduled_purge_at' => $purgeAt,
        ]);

        // Soft delete — revokes access immediately
        $user->delete();

        // Revoke all tokens
        $user->tokens()->delete();

        Log::channel('daily')->info('ACCOUNT_DELETION_REQUESTED', [
            'user_id' => $user->id,
            'email' => $user->email,
            'club_id' => $user->club_id,
            'scheduled_purge_at' => $purgeAt->toIso8601String(),
        ]);

        return response()->json([
            'message' => 'Account deletion initiated. You have 30 days to reactivate.',
            'scheduled_purge_at' => $purgeAt->toIso8601String(),
            'days_remaining' => 30,
        ]);
    }

    /**
     * POST /api/v1/account/reactivate
     * Restore account within 30-day window (unauthenticated).
     */
    public function reactivate(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::withTrashed()
            ->where('email', $request->email)
            ->whereNotNull('deletion_requested_at')
            ->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account pending deletion found with this email.',
            ], 404);
        }

        if ($user->scheduled_purge_at->isPast()) {
            return response()->json([
                'message' => 'The 30-day reactivation window has expired. Account cannot be restored.',
            ], 410);
        }

        if (! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        $user->restore();
        $user->update([
            'deletion_requested_at' => null,
            'scheduled_purge_at' => null,
        ]);

        $token = $user->createToken('mobile')->plainTextToken;

        Log::channel('daily')->info('ACCOUNT_REACTIVATED', [
            'user_id' => $user->id,
            'email' => $user->email,
            'club_id' => $user->club_id,
        ]);

        return response()->json([
            'message' => 'Account reactivated successfully.',
            'token' => $token,
            'user' => $user->load('club'),
        ]);
    }

    /**
     * GET /api/v1/account/deletion-status
     * Check deletion status (used on login screen, unauthenticated).
     */
    public function status(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::withTrashed()
            ->where('email', $request->email)
            ->first();

        if (! $user) {
            return response()->json(['status' => 'not_found'], 404);
        }

        if ($user->isPendingDeletion()) {
            return response()->json([
                'status' => 'pending_deletion',
                'days_remaining' => $user->daysUntilPurge(),
                'scheduled_purge_at' => $user->scheduled_purge_at->toIso8601String(),
            ]);
        }

        if ($user->trashed() && $user->scheduled_purge_at?->isPast()) {
            return response()->json(['status' => 'permanently_deleted']);
        }

        return response()->json(['status' => 'active']);
    }
}
