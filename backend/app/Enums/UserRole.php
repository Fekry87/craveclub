<?php

namespace App\Enums;

enum UserRole: string
{
    case PLATFORM_ADMIN = 'PLATFORM_ADMIN';
    case CLUB_MANAGER = 'CLUB_MANAGER';
    case COACH = 'COACH';
    case SWIMMER = 'SWIMMER';
}
