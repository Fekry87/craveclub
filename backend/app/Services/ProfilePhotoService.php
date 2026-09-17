<?php

namespace App\Services;

use App\Models\ProfilePhoto;
use Illuminate\Validation\ValidationException;

/**
 * Store, replace and remove swimmer photos.
 *
 * The app sends the image as a base64 data URL (it has already cropped it
 * square and shrunk it to 512px). The server does no resizing — the
 * production image has no GD — so it validates what it gets: a real JPEG,
 * PNG or WebP no larger than 2MB, judged by the bytes, never by the claimed
 * content type.
 */
class ProfilePhotoService
{
    /**
     * Decode and validate a data URL (or bare base64) and save it under a
     * fresh token. Throws a 422 on anything that is not a usable image.
     */
    public function storeFromBase64(string $input, int $clubId, string $field = 'photo'): ProfilePhoto
    {
        return $this->store($this->parse($input, $field), $clubId);
    }

    /**
     * Decode and validate only (a 422 on failure), so a caller can refuse the
     * request before opening a transaction and never leave an orphan row.
     *
     * @return array{bytes: string, mime: string}
     */
    public function parse(string $input, string $field = 'photo'): array
    {
        $base64 = $input;
        if (str_starts_with($input, 'data:')) {
            $comma = strpos($input, ',');
            $base64 = $comma === false ? '' : substr($input, $comma + 1);
        }

        $bytes = base64_decode(preg_replace('/\s+/', '', $base64), true);
        if ($bytes === false || $bytes === '') {
            $this->reject($field, 'The photo could not be read.');
        }

        if (strlen($bytes) > ProfilePhoto::MAX_BYTES) {
            $this->reject($field, 'The photo must be smaller than 2MB.');
        }

        $mime = $this->sniffMime($bytes);
        if (! in_array($mime, ProfilePhoto::ALLOWED_MIMES, true)) {
            $this->reject($field, 'The photo must be a JPEG, PNG or WebP image.');
        }

        return ['bytes' => $bytes, 'mime' => $mime];
    }

    /** @param array{bytes: string, mime: string} $parsed */
    public function store(array $parsed, int $clubId): ProfilePhoto
    {
        return ProfilePhoto::create([
            'club_id' => $clubId,
            'token' => ProfilePhoto::newToken(),
            'mime' => $parsed['mime'],
            'bytes' => strlen($parsed['bytes']),
            'data' => base64_encode($parsed['bytes']),
        ]);
    }

    /** Drop the stored bytes behind a token (a replaced or removed photo). */
    public function forget(?string $token): void
    {
        if ($token) {
            ProfilePhoto::where('token', $token)->delete();
        }
    }

    /**
     * The image type from the bytes themselves. `getimagesizefromstring` is
     * core PHP (no GD needed) and refuses anything that is not an image.
     */
    private function sniffMime(string $bytes): ?string
    {
        $info = @getimagesizefromstring($bytes);

        return $info === false ? null : ($info['mime'] ?? null);
    }

    private function reject(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
