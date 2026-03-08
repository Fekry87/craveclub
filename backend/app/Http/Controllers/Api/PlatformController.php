<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\UserRole;
use App\Models\Club;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlatformController extends Controller
{
    public function metrics(): JsonResponse
    {
        return response()->json([
            'total_clubs' => Club::count(),
            'total_users' => User::where('role', '!=', UserRole::PLATFORM_ADMIN)->count(),
            'total_managers' => User::where('role', UserRole::CLUB_MANAGER)->count(),
            'recent_clubs' => Club::latest()->take(5)->get(),
        ]);
    }

    public function clubIndex(Request $request): JsonResponse
    {
        $query = Club::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $clubs = $query->withCount('users')->latest()->paginate($request->input('per_page', 15));

        return response()->json($clubs);
    }

    public function clubStore(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:clubs,slug',
            'logo_url' => 'nullable|string|max:500',
            'theme_color' => 'nullable|string|max:7',
            'about' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'manager_name' => 'required|string|max:255',
            'manager_email' => 'required|email|unique:users,email',
            'manager_password' => 'required|string|min:8',
        ]);

        $club = Club::create($request->only([
            'name', 'slug', 'logo_url', 'theme_color', 'about', 'contact_email', 'contact_phone',
        ]));

        $manager = User::create([
            'name' => $request->manager_name,
            'email' => $request->manager_email,
            'password' => $request->manager_password,
            'role' => UserRole::CLUB_MANAGER,
            'club_id' => $club->id,
        ]);

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
            'club' => $club,
            'manager' => $manager->only(['id', 'name', 'email', 'role']),
        ], 201);
    }

    public function clubShow(Club $club): JsonResponse
    {
        return response()->json($club->loadCount('users'));
    }

    public function clubUpdate(Request $request, Club $club): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:clubs,slug,' . $club->id,
            'logo_url' => 'nullable|string|max:500',
            'theme_color' => 'nullable|string|max:7',
            'about' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
        ]);

        $before = $club->toArray();
        $club->update($request->only([
            'name', 'slug', 'logo_url', 'theme_color', 'about', 'contact_email', 'contact_phone',
        ]));

        return response()->json($club);
    }

    public function clubDestroy(Club $club): JsonResponse
    {
        $club->delete();
        return response()->json(['message' => 'Club deleted']);
    }
}
