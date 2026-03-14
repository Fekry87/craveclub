<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\SportModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SportModuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SportModule::withCount('clubs');

        if ($request->boolean('trashed')) {
            $query->withTrashed();
        }

        return response()->json($query->orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:sport_modules,name',
            'slug' => 'nullable|string|max:255|alpha_dash|unique:sport_modules,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $data = $request->only(['name', 'description', 'icon', 'color', 'is_active', 'sort_order']);
        $data['slug'] = $request->input('slug') ?: Str::slug($request->input('name'));

        $module = SportModule::create($data);

        return response()->json($module, 201);
    }

    public function show(SportModule $sportModule): JsonResponse
    {
        $sportModule->load(['clubs' => function ($q) {
            $q->withPivot(['is_active', 'activated_at']);
        }]);

        return response()->json($sportModule);
    }

    public function update(Request $request, SportModule $sportModule): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255|unique:sport_modules,name,' . $sportModule->id,
            'slug' => 'sometimes|string|max:255|alpha_dash|unique:sport_modules,slug,' . $sportModule->id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $sportModule->update($request->only(['name', 'slug', 'description', 'icon', 'color', 'is_active', 'sort_order']));

        return response()->json($sportModule);
    }

    public function destroy(SportModule $sportModule): JsonResponse
    {
        $activeClubsCount = $sportModule->clubs()
            ->wherePivot('is_active', true)
            ->count();

        if ($activeClubsCount > 0) {
            return response()->json([
                'message' => "Cannot delete: {$activeClubsCount} club(s) are actively using this sport module.",
            ], 422);
        }

        $sportModule->delete();

        return response()->json(['message' => 'Sport module deleted']);
    }

    // ── Club Sport Module Assignment ─────────────────────────

    public function getClubSportModules(Club $club): JsonResponse
    {
        $allModules = SportModule::orderBy('sort_order')->get();
        $assigned = $club->sportModules()->get()->keyBy('id');

        $result = $allModules->map(function ($module) use ($assigned) {
            $pivot = $assigned->get($module->id);
            return [
                'id' => $module->id,
                'name' => $module->name,
                'slug' => $module->slug,
                'icon' => $module->icon,
                'color' => $module->color,
                'is_assigned' => $pivot !== null,
                'is_active' => $pivot ? (bool) $pivot->pivot->is_active : false,
                'activated_at' => $pivot?->pivot->activated_at,
            ];
        });

        return response()->json($result);
    }

    public function assignSportModule(Request $request, Club $club): JsonResponse
    {
        $request->validate([
            'sport_module_id' => 'required|integer|exists:sport_modules,id',
        ]);

        $module = SportModule::where('id', $request->input('sport_module_id'))
            ->where('is_active', true)
            ->firstOrFail();

        $club->sportModules()->syncWithoutDetaching([
            $module->id => ['is_active' => true, 'activated_at' => now()],
        ]);

        return response()->json($this->getClubSportModulesData($club), 201);
    }

    public function removeSportModule(Club $club, SportModule $module): JsonResponse
    {
        $club->sportModules()->updateExistingPivot($module->id, ['is_active' => false]);

        return response()->json($this->getClubSportModulesData($club));
    }

    private function getClubSportModulesData(Club $club): array
    {
        $allModules = SportModule::orderBy('sort_order')->get();
        $assigned = $club->sportModules()->get()->keyBy('id');

        return $allModules->map(function ($module) use ($assigned) {
            $pivot = $assigned->get($module->id);
            return [
                'id' => $module->id,
                'name' => $module->name,
                'slug' => $module->slug,
                'icon' => $module->icon,
                'color' => $module->color,
                'is_assigned' => $pivot !== null,
                'is_active' => $pivot ? (bool) $pivot->pivot->is_active : false,
                'activated_at' => $pivot?->pivot->activated_at,
            ];
        })->values()->toArray();
    }
}
