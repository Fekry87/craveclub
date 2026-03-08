<?php

namespace App\Models;

use App\Enums\SkillType;
use App\Traits\BelongsToClub;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use BelongsToClub;

    protected $fillable = ['club_id', 'name', 'type', 'description'];

    protected function casts(): array
    {
        return ['type' => SkillType::class];
    }
}
