<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $notificationService,
    ) {}

    /**
     * GET /notifications — paginated list for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->orderByDesc('created_at')
            ->paginate(20);

        $unreadCount = $request->user()
            ->notifications()
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * PUT /notifications/{id}/read — mark one notification as read
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $marked = $this->notificationService->markRead($id, $request->user()->id);

        if (!$marked) {
            return response()->json(['message' => 'Notification not found or already read.'], 404);
        }

        return response()->json(['message' => 'Marked as read.']);
    }

    /**
     * PUT /notifications/read-all — mark all notifications as read
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllRead($request->user()->id);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'count' => $count,
        ]);
    }

    /**
     * POST /notifications/push-token — register a push token
     */
    public function registerToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string|max:255',
            'platform' => 'sometimes|string|in:expo,fcm,apns',
        ]);

        $pushToken = $this->notificationService->registerPushToken(
            $request->user()->id,
            $request->input('token'),
            $request->input('platform', 'expo'),
        );

        return response()->json($pushToken, 201);
    }
}
