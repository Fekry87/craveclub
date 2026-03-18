<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use BelongsToClub;

    protected $table = 'attendance';

    protected $fillable = ['club_id', 'session_id', 'swimmer_id', 'present'];

    protected function casts(): array
    {
        return ['present' => 'boolean'];
    }

    public function session()
    {
        return $this->belongsTo(TrainingSession::class, 'session_id');
    }

    public function swimmer()
    {
        return $this->belongsTo(SwimmerProfile::class, 'swimmer_id');
    }
}
