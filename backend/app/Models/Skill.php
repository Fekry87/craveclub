<?php

namespace App\Models;

use App\Enums\SkillType;
use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'name', 'type', 'description', 'numeric_value'];

    protected function casts(): array
    {
        return [
            'type' => SkillType::class,
            // Meters, for type=DISTANCE only.
            'numeric_value' => 'decimal:2',
        ];
    }
}
