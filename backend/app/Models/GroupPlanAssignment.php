<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class GroupPlanAssignment extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'group_id', 'plan_id'];

    public function group() { return $this->belongsTo(Group::class); }
    public function plan() { return $this->belongsTo(TrainingPlan::class, 'plan_id'); }
}
