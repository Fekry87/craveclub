<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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
        $exceptions->renderable(function (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->renderable(function (AuthenticationException $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Unauthenticated.',
            ], 401);
        });

        $exceptions->renderable(function (NotFoundHttpException $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Not found.',
            ], 404);
        });

        $exceptions->renderable(function (\Throwable $e) {
            if (app()->hasDebugModeEnabled()) {
                return null; // Let Laravel handle in debug mode
            }

            return response()->json([
                'message' => 'Server error.',
            ], 500);
        });
    })->create();
