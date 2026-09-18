<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AwardType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The club's award titles (name + XP). The manager manages the list; the
 * coach and the manager both read it to pick a title when giving an award.
 */
class AwardTypeController extends Controller
{
    /** The club's award types, in the club's chosen order. */
    public function index(Request $request): JsonResponse
    {
        $types = AwardType::where('club_id', $request->user()->club_id)
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id', 'name', 'xp_value']);

        return response()->json(['data' => $types]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);
        $clubId = $request->user()->club_id;

        $type = AwardType::create([
            'club_id' => $clubId,
            'name' => $validated['name'],
            'xp_value' => $validated['xp_value'],
            // New titles land at the end of the list.
            'position' => (int) AwardType::where('club_id', $clubId)->max('position') + 1,
        ]);

        return response()->json($type->only(['id', 'name', 'xp_value']), 201);
    }

    public function update(Request $request, AwardType $awardType): JsonResponse
    {
        $this->authorizeClub($request, $awardType);
        $awardType->update($this->validated($request));

        return response()->json($awardType->only(['id', 'name', 'xp_value']));
    }

    /** Removing a title leaves the awards already given untouched (they hold a snapshot). */
    public function destroy(Request $request, AwardType $awardType): JsonResponse
    {
        $this->authorizeClub($request, $awardType);
        $awardType->delete();

        return response()->json(['status' => 'deleted']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:60',
            'xp_value' => 'required|integer|min:0|max:100000',
        ]);
    }

    private function authorizeClub(Request $request, AwardType $awardType): void
    {
        abort_unless($awardType->club_id === $request->user()->club_id, 404);
    }
}
