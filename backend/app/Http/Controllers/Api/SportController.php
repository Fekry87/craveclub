<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SportController extends Controller
{
    public function index(): JsonResponse
    {
        $sports = Sport::where('club_id', app('current_club_id'))->latest()->get();

        return response()->json($sports);
    }

    public function store(Request $request): JsonResponse
    {
        $clubId = app('current_club_id');

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:sports,slug,NULL,id,club_id,' . $clubId,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        try {
            $sport = Sport::create(array_merge(
                $request->only(['name', 'slug', 'description', 'icon', 'is_active']),
                ['club_id' => $clubId]
            ));

            return response()->json($sport, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create sport'], 500);
        }
    }

    public function show(Sport $sport): JsonResponse
    {
        if ($sport->club_id !== app('current_club_id')) {
            abort(404);
        }

        return response()->json($sport);
    }

    public function update(Request $request, Sport $sport): JsonResponse
    {
        if ($sport->club_id !== app('current_club_id')) {
            abort(404);
        }

        $clubId = app('current_club_id');

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:sports,slug,' . $sport->id . ',id,club_id,' . $clubId,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        try {
            $sport->update($request->only(['name', 'slug', 'description', 'icon', 'is_active']));

            return response()->json($sport);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update sport'], 500);
        }
    }

    public function destroy(Sport $sport): JsonResponse
    {
        if ($sport->club_id !== app('current_club_id')) {
            abort(404);
        }

        try {
            $sport->delete();

            return response()->json(['message' => 'Sport deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete sport'], 500);
        }
    }
}
