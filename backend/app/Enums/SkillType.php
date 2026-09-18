<?php

namespace App\Enums;

enum SkillType: string
{
    case SKILL = 'SKILL';
    case SWIM_TYPE = 'SWIM_TYPE';
    case TECHNIQUE = 'TECHNIQUE';
    /** A swim distance for measurements; the meters live in skills.numeric_value. */
    case DISTANCE = 'DISTANCE';
}
