<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ApiDocController extends Controller
{
    public function docs(): JsonResponse
    {
        return response()->json([
            'api_version' => 'v1',
            'base_url' => '/api/v1',
            'endpoints' => [
                [
                    'method' => 'POST',
                    'path' => '/api/v1/auth/login',
                    'description' => 'Authenticate a user and receive an API token',
                    'auth' => false,
                ],
                [
                    'method' => 'POST',
                    'path' => '/api/v1/auth/logout',
                    'description' => 'Revoke the current API token',
                    'auth' => true,
                ],
                [
                    'method' => 'GET',
                    'path' => '/api/v1/auth/me',
                    'description' => 'Get the authenticated user profile',
                    'auth' => true,
                ],
                [
                    'method' => 'GET',
                    'path' => '/api/v1/clubs/{slug}',
                    'description' => 'Get public club information by slug',
                    'auth' => false,
                ],
                [
                    'method' => 'GET',
                    'path' => '/api/v1/club/dashboard',
                    'description' => 'Get club manager dashboard data',
                    'auth' => true,
                ],
                [
                    'method' => 'GET',
                    'path' => '/api/v1/club/coaches',
                    'description' => 'List all coaches for the current club',
                    'auth' => true,
                ],
                [
                    'method' => 'GET',
                    'path' => '/api/v1/club/swimmers',
                    'description' => 'List all swimmers for the current club',
                    'auth' => true,
                ],
                [
                    'method' => 'GET',
                    'path' => '/api/v1/club/groups',
                    'description' => 'List all groups for the current club',
                    'auth' => true,
                ],
                [
                    'method' => 'GET',
                    'path' => '/api/v1/club/sessions',
                    'description' => 'List all training sessions for the current club',
                    'auth' => true,
                ],
                [
                    'method' => 'POST',
                    'path' => '/api/v1/registrations',
                    'description' => 'Submit a new swimmer registration (public, requires X-Club-Slug header)',
                    'auth' => false,
                ],
            ],
        ]);
    }
}
