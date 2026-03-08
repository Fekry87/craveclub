<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('club.{clubId}', function ($user, $clubId) {
    return $user->club_id === (int) $clubId
        && in_array($user->role->value, ['CLUB_MANAGER', 'COACH']);
});
