<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfilePhoto;
use App\Models\SwimmerProfile;
use App\Services\ProfilePhotoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Swimmer profile photos: the public proxy that streams one by token, and
 * the swimmer's own upload / remove.
 */
class ProfilePhotoController extends Controller
{
    public function __construct(private ProfilePhotoService $photos) {}

    /**
     * Stream a photo by its token. No auth: the portal's <img> tags and the
     * app's Image components cannot send a Bearer header, and the 40-char
     * random token is the secret. The type is re-checked against the
     * allow-list so the table can only ever be served as an image.
     */
    public function show(string $token): Response
    {
        $photo = ProfilePhoto::where('token', $token)->first();
        abort_unless($photo && in_array($photo->mime, ProfilePhoto::ALLOWED_MIMES, true), 404);

        $contents = $photo->contents();
        abort_if($contents === '', 404);

        return response($contents, 200, [
            'Content-Type' => $photo->mime,
            // A replaced photo gets a new token, so this URL never changes meaning.
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** `{ photo: "data:image/jpeg;base64,..." }` → replaces the swimmer's photo. */
    public function uploadOwn(Request $request): JsonResponse
    {
        $request->validate(['photo' => 'required|string|max:3000000']);

        $profile = $this->ownProfile($request);
        $photo = $this->photos->storeFromBase64($request->input('photo'), $profile->club_id);

        $previous = $profile->photo_token;
        $profile->photo_token = $photo->token;
        $profile->save();
        $this->photos->forget($previous);

        return response()->json(['avatar_url' => $profile->avatar_url]);
    }

    public function deleteOwn(Request $request): JsonResponse
    {
        $profile = $this->ownProfile($request);

        $previous = $profile->photo_token;
        $profile->photo_token = null;
        $profile->save();
        $this->photos->forget($previous);

        return response()->json(['avatar_url' => null]);
    }

    private function ownProfile(Request $request): SwimmerProfile
    {
        $profile = SwimmerProfile::where('user_id', $request->user()->id)
            ->where('club_id', $request->user()->club_id)
            ->first();
        abort_unless($profile, 404, 'Swimmer profile not found');

        return $profile;
    }
}
