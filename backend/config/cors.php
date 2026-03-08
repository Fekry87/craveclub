<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://127.0.0.1:5173',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'X-Club-Slug', 'X-Socket-ID'],
    'exposed_headers' => ['X-Request-Id', 'X-Response-Time', 'X-API-Version'],
    'max_age' => 86400, // Cache preflight for 24 hours
    'supports_credentials' => false,
];
