<?php

namespace App\Models;

use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingPlan extends Model
{
    use BelongsToClub, SoftDeletes;

    protected $fillable = ['club_id', 'title', 'level', 'description'];

    public function items() { return $this->hasMany(TrainingPlanItem::class, 'plan_id')->orderBy('sort_order'); }
}
