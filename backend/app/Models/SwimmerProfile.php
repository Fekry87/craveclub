<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SwimmerProfile extends Model
{
    use BelongsToClub, SoftDeletes;

    protected $fillable = [
        'club_id', 'user_id', 'branch_id', 'first_name', 'last_name', 'level',
        'date_of_birth', 'guardian_name', 'guardian_phone', 'guardian_email', 'medical_notes',
        'xp_points', 'xp_rank',
    ];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date'];
    }

    public function user() { return $this->belongsTo(User::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function groups() { return $this->belongsToMany(Group::class, 'group_memberships', 'swimmer_id', 'group_id'); }
    public function attendances() { return $this->hasMany(Attendance::class, 'swimmer_id'); }
    public function evaluations() { return $this->hasMany(DailyEvaluation::class, 'swimmer_id'); }

    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}
