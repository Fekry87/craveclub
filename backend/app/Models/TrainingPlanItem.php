<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class TrainingPlanItem extends Model
{
    use BelongsToClub;

    protected $fillable = [
        'club_id', 'plan_id', 'sort_order', 'stroke', 'drill', 'distance', 'reps', 'interval', 'notes',
    ];

    public function plan()
    {
        return $this->belongsTo(TrainingPlan::class, 'plan_id');
    }
}
