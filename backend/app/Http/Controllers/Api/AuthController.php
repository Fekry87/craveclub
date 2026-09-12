<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\BuildsUserPayload;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\User;
use App\Support\SafeCache;
use App\Support\SwimmerLogin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use BuildsUserPayload;

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
            'club_slug' => 'nullable|string',
        ]);

        // Accept a phone number in place of the generated login email. Swimmers
        // never see their internal swimmer_<phone>@club<N>.craveclubs.local address,
        // so resolve a phone (within the club context) to that account's email.
        $loginEmail = $this->resolveLoginIdentifier($request);

        // Brute-force lockout: 5 failed attempts → 15-minute lockout.
        // SafeCache, not Cache: this counter sits on top of the route's throttle:10,1,
        // so a Redis outage must degrade it to "no extra lockout" rather than 500 every
        // login request and lock every tenant out of the product.
        $lockoutKey = 'login_attempts_'.$request->ip();
        $attempts = SafeCache::get($lockoutKey, 0);

        if ($attempts >= 5) {
            return response()->json([
                'message' => 'Too many login attempts. Try again in 15 minutes.',
            ], 429);
        }

        // Check if account is pending deletion (soft-deleted users won't pass Auth::attempt)
        $pendingUser = User::withTrashed()
            ->where('email', $loginEmail)
            ->whereNotNull('deletion_requested_at')
            ->first();

        if ($pendingUser && $pendingUser->isPendingDeletion()) {
            // Disclose the pending-deletion state ONLY to someone who proves they own
            // the account. Answering before the password check would turn /auth/login
            // into the account-existence + status oracle that /account/deletion-status
            // was deliberately hardened against.
            if (! Hash::check($request->password, $pendingUser->password)) {
                SafeCache::put($lockoutKey, $attempts + 1, now()->addMinutes(15));

                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            return response()->json([
                'status' => 'pending_deletion',
                'days_remaining' => $pendingUser->daysUntilPurge(),
                'message' => 'Your account is scheduled for deletion. Use the reactivation endpoint to restore it.',
            ], 403);
        }

        if (! Auth::guard('web')->attempt(['email' => $loginEmail, 'password' => $request->password])) {
            SafeCache::put($lockoutKey, $attempts + 1, now()->addMinutes(15));

            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Reset lockout counter on successful login
        SafeCache::forget($lockoutKey);

        $user = Auth::guard('web')->user();

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

    /**
     * Resolve the login identifier to an email address. A valid email is used
     * as-is; a phone number is mapped to the swimmer's generated login email
     * within the current club (falls back to the raw input, which fails auth).
     */
    private function resolveLoginIdentifier(Request $request): string
    {
        $identifier = trim((string) $request->input('email'));

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return $identifier;
        }

        $digits = SwimmerLogin::digits($identifier);
        if ($digits === '' || ! $request->filled('club_slug')) {
            return $identifier;
        }

        $club = Club::where('slug', $request->club_slug)->first();
        if (! $club) {
            return $identifier;
        }

        return SwimmerLogin::resolve($club->id, $digits)?->email ?? $identifier;
    }

    /**
     * Change the authenticated user's password. Revokes every other token so a
     * leaked temp password stops working everywhere else.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        if (Hash::check($request->new_password, $user->password)) {
            return response()->json(['message' => 'New password must be different from the current one'], 422);
        }

        $user->password = $request->new_password;
        $user->save();

        $currentTokenId = optional($request->user()->currentAccessToken())->id;
        $user->tokens()->when($currentTokenId, fn ($q) => $q->where('id', '!=', $currentTokenId))->delete();

        return response()->json(['message' => 'Password changed successfully']);
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
