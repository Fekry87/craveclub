<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = SubscriptionPlan::where('club_id', app('current_club_id'))
            ->withCount('registrations')
            ->orderBy('display_order')
            ->orderBy('duration_months')
            ->get();

        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $clubId = app('current_club_id');

        $request->validate([
            'name' => 'required|string|min:2|max:255',
            'duration_months' => 'required|integer|min:1|max:36',
            'price' => 'required|numeric|min:0',
            'discount_percent' => 'integer|min:0|max:100',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer|min:0',
        ]);

        try {
            // If marking as popular, clear other popular plans first
            if ($request->boolean('is_popular')) {
                SubscriptionPlan::where('club_id', $clubId)->update(['is_popular' => false]);
            }

            // Auto-assign display_order if not provided
            $data = $request->only(['name', 'duration_months', 'price', 'discount_percent', 'is_popular', 'is_active', 'display_order']);
            if (!$request->has('display_order')) {
                $data['display_order'] = SubscriptionPlan::where('club_id', $clubId)->max('display_order') + 1;
            }

            $plan = SubscriptionPlan::create(array_merge($data, ['club_id' => $clubId]));

            return response()->json($plan->loadCount('registrations'), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create plan'], 500);
        }
    }

    public function show(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        if ($subscriptionPlan->club_id !== app('current_club_id')) {
            abort(404);
        }

        return response()->json($subscriptionPlan->loadCount('registrations'));
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        if ($subscriptionPlan->club_id !== app('current_club_id')) {
            abort(404);
        }

        $clubId = app('current_club_id');

        $request->validate([
            'name' => 'sometimes|string|min:2|max:255',
            'duration_months' => 'sometimes|integer|min:1|max:36',
            'price' => 'sometimes|numeric|min:0',
            'discount_percent' => 'integer|min:0|max:100',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer|min:0',
        ]);

        try {
            // If marking as popular, clear other popular plans first
            if ($request->boolean('is_popular')) {
                SubscriptionPlan::where('club_id', $clubId)
                    ->where('id', '!=', $subscriptionPlan->id)
                    ->update(['is_popular' => false]);
            }

            $subscriptionPlan->update(
                $request->only(['name', 'duration_months', 'price', 'discount_percent', 'is_popular', 'is_active', 'display_order'])
            );

            return response()->json($subscriptionPlan->loadCount('registrations'));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update plan'], 500);
        }
    }

    public function destroy(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        if ($subscriptionPlan->club_id !== app('current_club_id')) {
            abort(404);
        }

        if ($subscriptionPlan->registrations()->exists()) {
            return response()->json([
                'message' => 'Cannot delete plan with existing registrations. Deactivate it instead.',
            ], 422);
        }

        try {
            $subscriptionPlan->delete();

            return response()->json(['message' => 'Plan deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete plan'], 500);
        }
    }

    public function toggleActive(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        if ($subscriptionPlan->club_id !== app('current_club_id')) {
            abort(404);
        }

        $subscriptionPlan->update(['is_active' => !$subscriptionPlan->is_active]);

        return response()->json($subscriptionPlan->loadCount('registrations'));
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'ordered_ids' => 'required|array|min:1',
            'ordered_ids.*' => ['integer', Rule::exists('subscription_plans', 'id')->where('club_id', app('current_club_id'))],
        ]);

        $clubId = app('current_club_id');

        foreach ($request->input('ordered_ids') as $index => $id) {
            SubscriptionPlan::where('id', $id)
                ->where('club_id', $clubId)
                ->update(['display_order' => $index]);
        }

        $plans = SubscriptionPlan::where('club_id', $clubId)
            ->withCount('registrations')
            ->orderBy('display_order')
            ->orderBy('duration_months')
            ->get();

        return response()->json($plans);
    }
}
