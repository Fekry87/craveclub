<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClubContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->club_id) {
            app()->instance('current_club_id', $request->user()->club_id);
        }
        return $next($request);
    }
}
