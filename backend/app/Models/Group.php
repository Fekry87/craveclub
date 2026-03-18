<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use App\Traits\HasSportScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Group extends Model
{
    use BelongsToClub, HasSportScope, SoftDeletes;

    protected $fillable = ['club_id', 'name', 'description', 'coach_user_id', 'sport_module_id'];

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_user_id');
    }

    public function swimmers()
    {
        return $this->belongsToMany(SwimmerProfile::class, 'group_memberships', 'group_id', 'swimmer_id');
    }

    public function sessions()
    {
        return $this->hasMany(TrainingSession::class);
    }

    public function plans()
    {
        return $this->belongsToMany(TrainingPlan::class, 'group_plan_assignments', 'group_id', 'plan_id');
    }

    public function sportModule()
    {
        return $this->belongsTo(SportModule::class);
    }
}
