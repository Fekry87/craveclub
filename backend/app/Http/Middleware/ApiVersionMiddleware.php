<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiVersionMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Add API version header to all responses
        $response->headers->set('X-API-Version', 'v1');
        $response->headers->set('X-API-Deprecated', 'false');

        return $response;
    }
}
