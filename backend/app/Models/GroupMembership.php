<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class GroupMembership extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'group_id', 'swimmer_id'];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function swimmer()
    {
        return $this->belongsTo(SwimmerProfile::class, 'swimmer_id');
    }
}
