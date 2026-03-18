<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:5173'),
        env('FRONTEND_URL_ALT', 'http://127.0.0.1:5173'),
    ]),
    'allowed_origins_patterns' => [],
    // FIX: Added X-Sport-Module header for sport-scoped cross-origin requests
    'allowed_headers' => ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'X-Club-Slug', 'X-Socket-ID', 'X-Sport-Module'],
    'exposed_headers' => ['X-Request-Id', 'X-Response-Time', 'X-API-Version'],
    'max_age' => 86400, // Cache preflight for 24 hours
    'supports_credentials' => false,
];
