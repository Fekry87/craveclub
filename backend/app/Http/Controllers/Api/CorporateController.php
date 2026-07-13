<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Club;
use App\Models\ClubFeature;
use App\Models\CorporateSetting;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class CorporateController extends Controller
{
    // ── Corporate Settings ──────────────────────────────────

    public function settings(): JsonResponse
    {
        return response()->json(CorporateSetting::allSettings());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable|string|max:500',
        ]);

        $allowed = CorporateSetting::allowedKeys();

        foreach ($request->input('settings') as $key => $value) {
            if (in_array($key, $allowed)) {
                CorporateSetting::set($key, $value);
            }
        }

        return response()->json(CorporateSetting::allSettings());
    }

    // ── Enhanced Metrics ────────────────────────────────────

    public function metrics(): JsonResponse
    {
        $totalClubs = Club::count();
        $totalUsers = User::where('role', '!=', UserRole::PLATFORM_ADMIN)->count();
        $totalManagers = User::where('role', UserRole::CLUB_MANAGER)->count();
        $totalCoaches = User::where('role', UserRole::COACH)->count();
        // Count swimmer members (profiles), not just swimmers with login accounts
        $totalSwimmers = \App\Models\SwimmerProfile::withoutGlobalScopes()->whereNull('deleted_at')->count();
        $clubsThisMonth = Club::where('created_at', '>=', now()->startOfMonth())->count();

        // Feature usage summary
        $featureUsage = [];
        foreach (ClubFeature::featureKeys() as $key) {
            $featureUsage[$key] = ClubFeature::where($key, true)->count();
        }

        return response()->json([
            'total_clubs' => $totalClubs,
            'total_users' => $totalUsers,
            'total_managers' => $totalManagers,
            'total_coaches' => $totalCoaches,
            'total_swimmers' => $totalSwimmers,
            'clubs_this_month' => $clubsThisMonth,
            'feature_usage' => $featureUsage,
            'recent_clubs' => Club::with('features')
                ->withCount('users')
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }

    // ── Club CRUD ───────────────────────────────────────────

    public function clubIndex(Request $request): JsonResponse
    {
        $query = Club::with(['features', 'activeSportModules' => function ($q) {
            $q->select('sport_modules.id', 'name', 'slug', 'icon', 'color');
        }])->withCount(['users', 'branches', 'swimmerProfiles']);

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $clubs = $query->latest()->paginate($request->input('per_page', 15));

        return response()->json($clubs);
    }

    public function clubStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('clubs', 'slug')->withoutTrashed()],
            'logo_url' => 'nullable|string|max:500',
            'theme_color' => 'nullable|string|max:7',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'accent_color' => 'nullable|string|max:7',
            'font_preference' => 'nullable|string|max:100',
            'about' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'manager_name' => 'required|string|max:255',
            'manager_email' => 'required|email|unique:users,email',
            'manager_password' => 'required|string|min:8',
            'max_branches' => 'sometimes|integer|min:1|max:100',
            // Feature toggles (optional, all default true)
            'features' => 'nullable|array',
            'features.*' => 'boolean',
        ]);

        $club = Club::create(array_merge(
            $request->only([
                'name', 'slug', 'logo_url', 'theme_color',
                'primary_color', 'secondary_color', 'accent_color', 'font_preference',
                'about', 'contact_email', 'contact_phone', 'max_branches',
            ]),
            ['max_branches' => $request->input('max_branches', 1)]
        ));

        $manager = User::create([
            'name' => $request->manager_name,
            'email' => $request->manager_email,
            'password' => $request->manager_password,
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

        // Create feature flags (merge provided features with defaults)
        $featureData = ['club_id' => $club->id];
        if ($request->has('features')) {
            foreach (ClubFeature::featureKeys() as $key) {
                if (isset($request->input('features')[$key])) {
                    $featureData[$key] = $request->input('features')[$key];
                }
            }
        }
        ClubFeature::create($featureData);

        // Seed default leaderboard settings & tiers
        \App\Models\LeaderboardSetting::forClub($club->id);
        \App\Models\LevelTier::seedForClub($club->id);

        AuditLog::create([
            'club_id' => $club->id,
            'actor_user_id' => auth()->id(),
            'action' => 'club_created',
            'entity_type' => Club::class,
            'entity_id' => $club->id,
            'after_json' => $club->toArray(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'club' => $club->load('features'),
            'manager' => $manager->only(['id', 'name', 'email', 'role']),
        ], 201);
    }

    public function clubShow(Club $club): JsonResponse
    {
        $club->load('features');
        $club->loadCount(['users', 'swimmerProfiles', 'coachProfiles', 'groups', 'trainingSessions', 'branches']);

        $club->branches_remaining = $club->max_branches - $club->branches_count;

        $manager = User::where('club_id', $club->id)->where('role', UserRole::CLUB_MANAGER)->first();

        $data = $club->toArray();
        $data['manager'] = $manager ? $manager->only(['id', 'name', 'email']) : null;

        return response()->json($data);
    }

    public function clubUpdate(Request $request, Club $club): JsonResponse
    {
        $manager = User::where('club_id', $club->id)->where('role', UserRole::CLUB_MANAGER)->first();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('clubs', 'slug')->ignore($club->id)->withoutTrashed()],
            'logo_url' => 'nullable|string|max:500',
            'theme_color' => 'nullable|string|max:7',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'accent_color' => 'nullable|string|max:7',
            'font_preference' => 'nullable|string|max:100',
            'about' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'max_branches' => 'sometimes|integer|min:1|max:100',
            'manager_name' => 'sometimes|string|max:255',
            'manager_email' => 'sometimes|email|max:255|unique:users,email,'.($manager?->id ?? 0),
            'manager_password' => 'nullable|string|min:8',
        ]);

        $oldSlug = $club->slug;

        $club->update($request->only([
            'name', 'slug', 'logo_url', 'theme_color',
            'primary_color', 'secondary_color', 'accent_color', 'font_preference',
            'about', 'contact_email', 'contact_phone', 'max_branches',
        ]));

        // Bust branding cache (covers slug change too)
        Cache::forget("branding_{$oldSlug}");
        if ($club->slug !== $oldSlug) {
            Cache::forget("branding_{$club->slug}");
        }

        // Update manager account if fields provided
        if ($manager) {
            if ($request->filled('manager_name')) {
                $manager->name = $request->manager_name;
            }
            if ($request->filled('manager_email')) {
                $manager->email = $request->manager_email;
            }
            if ($request->filled('manager_password')) {
                $manager->password = $request->manager_password;
            }
            $manager->save();
        }

        $data = $club->load('features')->toArray();
        $data['manager'] = $manager ? $manager->only(['id', 'name', 'email']) : null;

        return response()->json($data);
    }

    public function clubDestroy(Club $club): JsonResponse
    {
        AuditService::log('club.deleted', Club::class, $club->id, [
            'club_name' => $club->name,
            'club_slug' => $club->slug,
        ], $club->id);

        $club->delete(); // soft-delete via SoftDeletes trait

        return response()->json(['message' => 'Club deleted']);
    }

    // ── Club Feature Management ─────────────────────────────

    public function clubFeatures(Club $club): JsonResponse
    {
        return response()->json(ClubFeature::forClub($club->id));
    }

    public function updateClubFeatures(Request $request, Club $club): JsonResponse
    {
        $request->validate([
            'leaderboard_enabled' => 'sometimes|boolean',
            'evaluations_enabled' => 'sometimes|boolean',
            'skills_enabled' => 'sometimes|boolean',
            'training_plans_enabled' => 'sometimes|boolean',
            'attendance_tracking_enabled' => 'sometimes|boolean',
            'swimmer_accounts_enabled' => 'sometimes|boolean',
            'coach_portal_enabled' => 'sometimes|boolean',
            'subscription_plans_enabled' => 'sometimes|boolean',
        ]);

        $features = ClubFeature::forClub($club->id);
        $before = $features->only(ClubFeature::featureKeys());
        $features->update($request->only(ClubFeature::featureKeys()));

        AuditService::log('features.updated', ClubFeature::class, $features->id, [
            'before' => $before,
            'after' => $features->fresh()->only(ClubFeature::featureKeys()),
        ], $club->id);

        Cache::forget("club_features_{$club->id}");

        return response()->json($features->fresh());
    }
}
