<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'avatar', 'email', 'password', 'role', 'club_id',
        'deletion_requested_at', 'scheduled_purge_at',
    ];

    protected $hidden = [
        'password', 'remember_token', 'email_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'deletion_requested_at' => 'datetime',
            'scheduled_purge_at' => 'datetime',
        ];
    }

    public function scopePendingDeletion($query)
    {
        return $query->withTrashed()
            ->whereNotNull('deletion_requested_at')
            ->whereNotNull('scheduled_purge_at')
            ->where('scheduled_purge_at', '>', now());
    }

    public function isPendingDeletion(): bool
    {
        return ! is_null($this->deletion_requested_at)
            && ! is_null($this->scheduled_purge_at)
            && $this->scheduled_purge_at->isFuture();
    }

    public function daysUntilPurge(): int
    {
        if (! $this->isPendingDeletion()) {
            return 0;
        }

        // Ceil of fractional days: a freshly-set 30-day window reads 30, not 29.
        return (int) ceil(now()->diffInSeconds($this->scheduled_purge_at, false) / 86400);
    }

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function coachProfile()
    {
        return $this->hasOne(CoachProfile::class);
    }

    public function swimmerProfile()
    {
        return $this->hasOne(SwimmerProfile::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function pushTokens()
    {
        return $this->hasMany(PushToken::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::PLATFORM_ADMIN;
    }

    public function isClubManager(): bool
    {
        return $this->role === UserRole::CLUB_MANAGER;
    }

    public function isCoach(): bool
    {
        return $this->role === UserRole::COACH;
    }

    public function isSwimmer(): bool
    {
        return $this->role === UserRole::SWIMMER;
    }
}
