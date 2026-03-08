<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'avatar', 'email', 'password', 'role', 'club_id',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
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
