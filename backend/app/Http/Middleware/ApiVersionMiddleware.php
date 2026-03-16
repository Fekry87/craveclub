<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiVersionMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Read client-sent version headers and store in container
        $appVersion = $request->header('X-App-Version');
        $platform = $request->header('X-Platform');

        if ($appVersion) {
            app()->instance('client_app_version', $appVersion);
        }
        if ($platform) {
            app()->instance('client_platform', $platform);
        }

        $response = $next($request);

        // Add API version header to all responses
        $response->headers->set('X-API-Version', config('app_versions.api_version', 'v1'));
        $response->headers->set('X-API-Deprecated', 'false');

        // Echo back client headers for debugging
        if ($appVersion) {
            $response->headers->set('X-App-Version-Received', $appVersion);
        }
        if ($platform) {
            $response->headers->set('X-Platform-Received', $platform);
        }

        return $response;
    }
}
