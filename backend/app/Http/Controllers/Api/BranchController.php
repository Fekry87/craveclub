<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Club;
use App\Models\CoachProfile;
use App\Models\SwimmerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(): JsonResponse
    {
        $branches = Branch::where('club_id', app('current_club_id'))
            ->withCount(['coaches', 'swimmers', 'sessions'])
            ->latest()
            ->get();

        return response()->json($branches);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'working_hours' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'photos' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $club = Club::find(app('current_club_id'));
        if (!$club->canAddBranch()) {
            return response()->json([
                'message' => 'Branch limit reached. Your plan allows a maximum of '
                    . $club->max_branches . ' branch(es).',
                'limit' => $club->max_branches,
            ], 422);
        }

        try {
            $branch = Branch::create(array_merge(
                $validated,
                ['club_id' => app('current_club_id')]
            ));

            return response()->json(
                $branch->loadCount(['coaches', 'swimmers', 'sessions']),
                201
            );
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create branch'], 500);
        }
    }

    public function show(Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $branch->load(['coaches.user', 'swimmers', 'sessions.group']);
        $branch->loadCount(['coaches', 'swimmers', 'sessions']);

        return response()->json($branch);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|min:2|max:255',
            'address' => 'sometimes|string|max:500',
            'city' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'working_hours' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'photos' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        try {
            $branch->update($validated);

            return response()->json(
                $branch->loadCount(['coaches', 'swimmers', 'sessions'])
            );
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update branch'], 500);
        }
    }

    public function destroy(Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $activeSwimmers = $branch->swimmers()->count();
        $activeSessions = $branch->sessions()->count();

        if ($activeSwimmers > 0 || $activeSessions > 0) {
            return response()->json([
                'message' => 'Cannot delete branch with active swimmers or sessions.',
            ], 422);
        }

        try {
            $branch->delete();

            return response()->json(['message' => 'Branch deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete branch'], 500);
        }
    }

    public function updateFeatures(Request $request, Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'features' => 'required|array',
        ]);

        $allowedKeys = [
            'training_plans', 'skills', 'leaderboard',
            'evaluations', 'coach_portal',
        ];

        $filtered = array_intersect_key(
            $validated['features'],
            array_flip($allowedKeys)
        );

        $branch->update(['features' => $filtered]);

        return response()->json(
            $branch->loadCount(['coaches', 'swimmers', 'sessions'])
        );
    }

    // ── Branch Assignment Endpoints ──────────────────────────

    public function availableCoaches(Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $coaches = CoachProfile::where('club_id', app('current_club_id'))
            ->where(function ($q) use ($branch) {
                $q->whereNull('branch_id')
                  ->orWhere('branch_id', '!=', $branch->id);
            })
            ->with('user')
            ->get();

        return response()->json($coaches);
    }

    public function availableSwimmers(Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $swimmers = SwimmerProfile::where('club_id', app('current_club_id'))
            ->where(function ($q) use ($branch) {
                $q->whereNull('branch_id')
                  ->orWhere('branch_id', '!=', $branch->id);
            })
            ->get();

        return response()->json($swimmers);
    }

    public function assignCoaches(Request $request, Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'coach_ids' => 'required|array|min:1',
            'coach_ids.*' => 'integer|exists:coach_profiles,id',
        ]);

        CoachProfile::where('club_id', app('current_club_id'))
            ->whereIn('id', $validated['coach_ids'])
            ->update(['branch_id' => $branch->id]);

        $branch->load(['coaches.user', 'swimmers', 'sessions.group']);
        $branch->loadCount(['coaches', 'swimmers', 'sessions']);

        return response()->json($branch);
    }

    public function unassignCoaches(Request $request, Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'coach_ids' => 'required|array|min:1',
            'coach_ids.*' => 'integer',
        ]);

        CoachProfile::where('club_id', app('current_club_id'))
            ->where('branch_id', $branch->id)
            ->whereIn('id', $validated['coach_ids'])
            ->update(['branch_id' => null]);

        $branch->load(['coaches.user', 'swimmers', 'sessions.group']);
        $branch->loadCount(['coaches', 'swimmers', 'sessions']);

        return response()->json($branch);
    }

    public function assignSwimmers(Request $request, Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'swimmer_ids' => 'required|array|min:1',
            'swimmer_ids.*' => 'integer|exists:swimmer_profiles,id',
        ]);

        SwimmerProfile::where('club_id', app('current_club_id'))
            ->whereIn('id', $validated['swimmer_ids'])
            ->update(['branch_id' => $branch->id]);

        $branch->load(['coaches.user', 'swimmers', 'sessions.group']);
        $branch->loadCount(['coaches', 'swimmers', 'sessions']);

        return response()->json($branch);
    }

    public function unassignSwimmers(Request $request, Branch $branch): JsonResponse
    {
        if ($branch->club_id !== app('current_club_id')) {
            abort(404);
        }

        $validated = $request->validate([
            'swimmer_ids' => 'required|array|min:1',
            'swimmer_ids.*' => 'integer',
        ]);

        SwimmerProfile::where('club_id', app('current_club_id'))
            ->where('branch_id', $branch->id)
            ->whereIn('id', $validated['swimmer_ids'])
            ->update(['branch_id' => null]);

        $branch->load(['coaches.user', 'swimmers', 'sessions.group']);
        $branch->loadCount(['coaches', 'swimmers', 'sessions']);

        return response()->json($branch);
    }
}
