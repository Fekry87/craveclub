<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class SwimmerPlanAssignment extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'swimmer_id', 'plan_id'];

    public function swimmer() { return $this->belongsTo(SwimmerProfile::class, 'swimmer_id'); }
    public function plan() { return $this->belongsTo(TrainingPlan::class, 'plan_id'); }
}
