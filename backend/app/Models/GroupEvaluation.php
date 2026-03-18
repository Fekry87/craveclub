<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class GroupEvaluation extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'session_id', 'group_id', 'rating', 'notes'];

    public function session()
    {
        return $this->belongsTo(TrainingSession::class, 'session_id');
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
