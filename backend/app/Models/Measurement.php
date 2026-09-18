<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

/**
 * القياس — one timed swim a coach recorded for a swimmer during a session:
 * a stroke (a SWIM_TYPE skill), a distance (a DISTANCE skill) and the time.
 * A swimmer can have any number of them in the same session.
 */
class Measurement extends Model
{
    use BelongsToClub;

    protected $fillable = [
        'club_id', 'session_id', 'swimmer_id',
        'stroke_skill_id', 'distance_skill_id', 'time_seconds', 'recorded_by',
    ];

    protected function casts(): array
    {
        return ['time_seconds' => 'decimal:2'];
    }

    public function session()
    {
        return $this->belongsTo(TrainingSession::class, 'session_id');
    }

    public function swimmer()
    {
        return $this->belongsTo(SwimmerProfile::class, 'swimmer_id');
    }

    public function strokeSkill()
    {
        return $this->belongsTo(Skill::class, 'stroke_skill_id');
    }

    public function distanceSkill()
    {
        return $this->belongsTo(Skill::class, 'distance_skill_id');
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
