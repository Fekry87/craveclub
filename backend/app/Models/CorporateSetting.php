<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CorporateSetting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Keys holding the raw base64 bytes of an uploaded image.
     *
     * The storage bucket is read-denied, so uploaded branding images live in
     * this table and are streamed by a public proxy. Those bytes must never ride
     * along with the rest of the settings: allSettings() feeds the `corporate`
     * block of every login and /auth/me response, so an image up to the 2 MB
     * upload limit would be shipped (as ~2.7 MB of base64) to every user on
     * every sign-in.
     */
    public const IMAGE_DATA_KEYS = [
        'splash_image_data',
        'platform_logo_data',
        'entry_photo_1_data',
        'entry_photo_2_data',
        'entry_photo_3_data',
    ];

    /**
     * Photo slots on the app's club-name entry screen, which cycles through
     * whichever of them are filled.
     */
    public const ENTRY_PHOTO_SLOTS = [1, 2, 3];

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    /**
     * Set a setting value (upsert).
     */
    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * Get all settings as key-value array — without the stored image bytes,
     * which are only ever read by the image proxies (see IMAGE_DATA_KEYS).
     */
    public static function allSettings(): array
    {
        return static::whereNotIn('key', self::IMAGE_DATA_KEYS)
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Keys the settings form may write.
     *
     * The stored image bytes, their content type, path and version are set only
     * by the upload endpoints, which validate the real file type. They used to
     * be writable here, which let a settings save pair arbitrary bytes with an
     * arbitrary content type — `text/html`, say — for the public proxy to serve
     * from the API's own origin.
     */
    public static function allowedKeys(): array
    {
        return [
            'platform_name',
            'platform_logo_url',
            'primary_color',
            'secondary_color',
            'tagline',
            'splash_background_color',
            'splash_image_url',
        ];
    }
}
