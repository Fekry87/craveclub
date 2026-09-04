<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
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
        // Railway terminates TLS at its edge proxy and forwards plain HTTP with
        // X-Forwarded-* headers. Without trusting them, $request->secure() is
        // always false in production, so HSTS never fires and generated URLs
        // come out as http://. The app is only ever reachable through that proxy.
        $middleware->trustProxies(
            at: '*',
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR
                | \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST
                | \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT
                | \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO,
        );

        // Health check stays accessible during maintenance mode
        $middleware->preventRequestsDuringMaintenance(except: [
            'api/v1/health',
        ]);

        $middleware->append(\App\Http\Middleware\RequestId::class);
        $middleware->append(\App\Http\Middleware\TrackResponseTime::class);
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
        $middleware->append(\App\Http\Middleware\ForceProductionSettings::class);
        $middleware->append(\App\Http\Middleware\ApiVersionMiddleware::class);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'club.context' => \App\Http\Middleware\ClubContext::class,
            'club.header' => \App\Http\Middleware\ResolveClubFromHeader::class,
            'request.log' => \App\Http\Middleware\RequestLogger::class,
            'feature' => \App\Http\Middleware\FeatureGuard::class,
            'sport.context' => \App\Http\Middleware\SportContext::class,
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

        // FIX: Explicit 403 handler — prevents falling through to generic 500
        $exceptions->renderable(function (AccessDeniedHttpException $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Forbidden.',
            ], 403);
        });

        // FIX: Explicit 405 handler — prevents falling through to generic 500
        $exceptions->renderable(function (MethodNotAllowedHttpException $e) {
            return response()->json([
                'message' => 'Method not allowed.',
            ], 405);
        });

        // Maintenance mode: return JSON 503 instead of HTML (for API/mobile clients)
        $exceptions->renderable(function (HttpException $e) {
            if ($e->getStatusCode() === 503) {
                return response()->json([
                    'message' => 'System is under maintenance. Please try again in a few minutes.',
                    'retry_after' => 300,
                ], 503);
            }

            return null; // Let other HttpExceptions fall through
        });

        $exceptions->renderable(function (ThrottleRequestsException $e) {
            $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;

            return response()->json([
                'message' => "Too many attempts. Try again in {$retryAfter} seconds.",
            ], 429)->withHeaders($e->getHeaders());
        });

        $exceptions->renderable(function (\Throwable $e) {
            // Capture unhandled exceptions in Sentry
            if (app()->bound('sentry')) {
                app('sentry')->captureException($e);
            }

            if (app()->hasDebugModeEnabled()) {
                return null; // Let Laravel handle in debug mode
            }

            return response()->json([
                'message' => 'An unexpected error occurred.',
                'request_id' => app()->has('request_id') ? app('request_id') : null,
            ], 500);
        });
    })->create();
