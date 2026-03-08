<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
        $middleware->append(\App\Http\Middleware\ForceProductionSettings::class);
        $middleware->append(\App\Http\Middleware\ApiVersionMiddleware::class);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'club.context' => \App\Http\Middleware\ClubContext::class,
            'club.header' => \App\Http\Middleware\ResolveClubFromHeader::class,
            'request.log' => \App\Http\Middleware\RequestLogger::class,
            'feature' => \App\Http\Middleware\FeatureGuard::class,
        ]);

        // Token-based auth only — no session/CSRF needed for API routes
        // $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
