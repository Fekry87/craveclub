<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSkillRequest;
use App\Http\Requests\StoreTrainingPlanRequest;
use App\Models\Skill;
use App\Models\TrainingPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    /**
     * Guard: abort 404 if the model doesn't belong to the current club.
     */
    private function assertOwnership(mixed $model): void
    {
        abort_if(
            $model->club_id !== app('current_club_id'),
            404,
            'Resource not found.'
        );
    }

    // ── Training Plans ──
    public function planIndex(Request $request): JsonResponse
    {
        $query = TrainingPlan::with(['items', 'coach'])->withCount('assignments', 'activeAssignments');
        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }
        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function planStore(StoreTrainingPlanRequest $request): JsonResponse
    {
        $plan = TrainingPlan::create($request->only([
            'title', 'level', 'description',
            'duration_weeks', 'duration_unit', 'sessions_per_week',
            'goals', 'difficulty_level', 'is_template', 'phases',
        ]));

        if ($request->has('items')) {
            foreach ($request->items as $item) {
                $plan->items()->create(array_merge($item, ['club_id' => $request->user()->club_id]));
            }
        }

        return response()->json($plan->load('items'), 201);
    }

    public function planShow(TrainingPlan $plan): JsonResponse
    {
        $this->assertOwnership($plan);
        return response()->json($plan->load('items'));
    }

    public function planUpdate(Request $request, TrainingPlan $plan): JsonResponse
    {
        $this->assertOwnership($plan);
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'level' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'duration_weeks' => 'nullable|integer|min:1|max:52',
            'duration_unit' => 'nullable|in:weeks,months',
            'sessions_per_week' => 'nullable|integer|min:1|max:7',
            'goals' => 'nullable|string',
            'difficulty_level' => 'nullable|string|in:beginner,intermediate,advanced',
            'is_template' => 'nullable|boolean',
            'phases' => 'nullable|array',
            'items' => 'nullable|array',
        ]);

        $plan->update($request->only([
            'title', 'level', 'description',
            'duration_weeks', 'duration_unit', 'sessions_per_week',
            'goals', 'difficulty_level', 'is_template', 'phases',
        ]));

        if ($request->has('items')) {
            $plan->items()->delete();
            foreach ($request->items as $item) {
                $plan->items()->create(array_merge($item, ['club_id' => $request->user()->club_id]));
            }
        }

        return response()->json($plan->load('items'));
    }

    public function planDestroy(TrainingPlan $plan): JsonResponse
    {
        $this->assertOwnership($plan);
        $plan->delete();
        return response()->json(['message' => 'Plan deleted']);
    }

    // ── Skills ──
    public function skillIndex(Request $request): JsonResponse
    {
        $query = Skill::query();
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }
        return response()->json($query->latest()->paginate($request->input('per_page', 15)));
    }

    public function skillStore(StoreSkillRequest $request): JsonResponse
    {
        $skill = Skill::create($request->only(['name', 'type', 'description']));
        return response()->json($skill, 201);
    }

    public function skillUpdate(Request $request, Skill $skill): JsonResponse
    {
        $this->assertOwnership($skill);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:SKILL,SWIM_TYPE,TECHNIQUE',
            'description' => 'nullable|string',
        ]);

        $skill->update($request->only(['name', 'type', 'description']));
        return response()->json($skill);
    }

    public function skillDestroy(Skill $skill): JsonResponse
    {
        $this->assertOwnership($skill);
        $skill->delete();
        return response()->json(['message' => 'Skill deleted']);
    }
}
