<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CorporateSetting extends Model
{
    protected $fillable = ['key', 'value'];

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
     * Get all settings as key-value array.
     */
    public static function allSettings(): array
    {
        return static::pluck('value', 'key')->toArray();
    }

    /**
     * Allowed setting keys for validation.
     */
    public static function allowedKeys(): array
    {
        return [
            'platform_name',
            'platform_logo_url',
            'primary_color',
            'secondary_color',
            'tagline',
        ];
    }
}
