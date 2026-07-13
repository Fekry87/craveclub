<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Manager-only channel (registration notifications, sensitive admin data)
Broadcast::channel('club.{clubId}', function ($user, $clubId) {
    return $user->club_id === (int) $clubId
        && $user->role->value === 'CLUB_MANAGER';
});

// Coach channel (training, attendance, non-sensitive data)
Broadcast::channel('club.{clubId}.coach', function ($user, $clubId) {
    return $user->club_id === (int) $clubId
        && in_array($user->role->value, ['CLUB_MANAGER', 'COACH']);
});

// Per-swimmer channel (session lifecycle events consumed by the mobile app)
Broadcast::channel('swimmer.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
