<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoachProfile extends Model
{
    use BelongsToClub, SoftDeletes;

    protected $fillable = [
        'club_id', 'user_id', 'branch_id', 'bio', 'specialization', 'phone',
        'sport_ids', 'experience_years', 'certifications', 'rating',
        'current_swimmers_count', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sport_ids' => 'array',
            'certifications' => 'array',
            'rating' => 'decimal:2',
            'experience_years' => 'integer',
            'current_swimmers_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function user() { return $this->belongsTo(User::class); }
    public function branch() { return $this->belongsTo(Branch::class); }

    public function schedules() { return $this->hasMany(CoachSchedule::class, 'coach_id'); }
}
