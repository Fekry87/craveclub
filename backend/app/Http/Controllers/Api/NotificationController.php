<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
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

        // Return format compatible with both web and mobile
        return response()->json([
            'data' => $notifications->items(),
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    /**
     * PUT|POST /notifications/{id}/read — mark one notification as read
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
     * PUT|POST /notifications/read-all — mark all notifications as read
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
     * Accepts both `platform` and `device_type` for mobile compat
     */
    public function registerToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string|max:255',
            'platform' => 'sometimes|string|in:expo,fcm,apns',
            'device_type' => 'sometimes|string|in:ios,android',
        ]);

        // Map device_type to platform if platform not provided
        $platform = $request->input('platform');
        if (!$platform && $request->has('device_type')) {
            $platform = 'expo'; // Expo tokens from both iOS and Android
        }

        // Limit active push tokens per user (max 5 devices)
        $activeTokenCount = PushToken::where('user_id', $request->user()->id)
            ->where('token', '!=', $request->input('token'))
            ->count();
        abort_if($activeTokenCount >= 5, 422, 'Maximum device limit reached. Remove an existing device first.');

        // Deactivate tokens older than 90 days
        PushToken::where('user_id', $request->user()->id)
            ->where('updated_at', '<', now()->subDays(90))
            ->delete();

        $pushToken = $this->notificationService->registerPushToken(
            $request->user()->id,
            $request->input('token'),
            $platform ?: 'expo',
        );

        return response()->json($pushToken, 201);
    }
}
