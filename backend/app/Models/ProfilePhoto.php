<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * A swimmer's photo, kept as base64 in the database (see the migration for
 * why not on disk). Looked up by its random token from the public proxy, so
 * this model deliberately carries no club global scope: the proxy runs
 * outside any club context and the token is the only key.
 */
class ProfilePhoto extends Model
{
    public const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    /** 2MB, the same ceiling as the corporate branding uploads. */
    public const MAX_BYTES = 2 * 1024 * 1024;

    protected $fillable = ['club_id', 'token', 'mime', 'bytes', 'data'];

    /** The bytes never leave through JSON; only the proxy streams them. */
    protected $hidden = ['data'];

    public static function newToken(): string
    {
        return Str::lower(Str::random(40));
    }

    public function contents(): string
    {
        $decoded = base64_decode($this->data, true);

        return $decoded === false ? '' : $decoded;
    }

    /** The public URL that streams this photo (absolute, on the API host). */
    public static function urlFor(?string $token): ?string
    {
        return $token ? url('/api/v1/photos/'.$token) : null;
    }
}
