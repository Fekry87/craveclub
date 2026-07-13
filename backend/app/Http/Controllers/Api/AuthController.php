<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\BuildsUserPayload;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    use BuildsUserPayload;

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'club_slug' => 'nullable|string',
        ]);

        // Brute-force lockout: 5 failed attempts → 15-minute lockout
        $lockoutKey = 'login_attempts_'.$request->ip();
        $attempts = Cache::get($lockoutKey, 0);

        if ($attempts >= 5) {
            return response()->json([
                'message' => 'Too many login attempts. Try again in 15 minutes.',
            ], 429);
        }

        // Check if account is pending deletion (soft-deleted users won't pass Auth::attempt)
        $pendingUser = User::withTrashed()
            ->where('email', $request->email)
            ->whereNotNull('deletion_requested_at')
            ->first();

        if ($pendingUser && $pendingUser->isPendingDeletion()) {
            return response()->json([
                'status' => 'pending_deletion',
                'days_remaining' => $pendingUser->daysUntilPurge(),
                'message' => 'Your account is scheduled for deletion. Use the reactivation endpoint to restore it.',
            ], 403);
        }

        if (! Auth::attempt($request->only('email', 'password'))) {
            Cache::put($lockoutKey, $attempts + 1, now()->addMinutes(15));

            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Reset lockout counter on successful login
        Cache::forget($lockoutKey);

        $user = Auth::user();

        // Validate club membership when logging in from a club portal
        if ($request->filled('club_slug') && $user->club_id) {
            $club = Club::where('slug', $request->club_slug)->first();
            if ($club && $user->club_id !== $club->id) {
                Auth::guard('web')->logout();

                return response()->json(['message' => 'You are not a member of this club'], 403);
            }
        }

        // Create a personal access token (stateless — no session dependency)
        // Mobile tokens last 30 days; web tokens use sanctum.expiration (24h)
        $scope = $request->filled('club_slug') ? 'club' : 'corporate';
        $platform = $request->header('X-Platform', 'web');
        $expiresAt = in_array($platform, ['ios', 'android']) ? now()->addDays(30) : null;
        $token = $user->createToken("auth-{$scope}", ['*'], $expiresAt)->plainTextToken;

        // Clear the web session — we rely on bearer tokens only
        Auth::guard('web')->logout();

        return response()->json([
            'token' => $token,
            'user' => $this->buildUserPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        // PersonalAccessToken (bearer token) has delete(); TransientToken (session) does not
        if (method_exists($token, 'delete')) {
            $token->delete();
        } else {
            // Fallback: clear the web session
            Auth::guard('web')->logout();
        }

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->buildUserPayload($request->user()),
        ]);
    }

}
