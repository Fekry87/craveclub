<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SwimmerAwardView extends Model
{
    public $timestamps = false;

    protected $fillable = ['award_id', 'viewer_user_id', 'viewed_at'];

    protected $casts = ['viewed_at' => 'datetime'];

    public function award(): BelongsTo
    {
        return $this->belongsTo(SwimmerAward::class, 'award_id');
    }
}
