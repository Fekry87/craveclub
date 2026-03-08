<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class SessionExclusion extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'session_id', 'swimmer_id', 'reason'];

    public function session()
    {
        return $this->belongsTo(TrainingSession::class, 'session_id');
    }

    public function swimmer()
    {
        return $this->belongsTo(SwimmerProfile::class, 'swimmer_id');
    }
}
