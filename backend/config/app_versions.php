<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Minimum Supported Versions
    |--------------------------------------------------------------------------
    |
    | Clients below these versions will receive force_update = true in the
    | version-check response. Set to '0.0.0' to disable force-update.
    |
    */

    'minimum_ios_version' => env('MINIMUM_IOS_VERSION', '1.0.0'),
    'minimum_android_version' => env('MINIMUM_ANDROID_VERSION', '1.0.0'),

    /*
    |--------------------------------------------------------------------------
    | Latest Available Version
    |--------------------------------------------------------------------------
    |
    | The latest version available in the app stores. Clients below this
    | but above minimum will receive update_available = true.
    |
    */

    'latest_version' => env('APP_LATEST_VERSION', '1.0.0'),

    /*
    |--------------------------------------------------------------------------
    | Store URLs
    |--------------------------------------------------------------------------
    |
    | Deep links to the app in each store. Returned in the version-check
    | response so the client can open the store directly.
    |
    */

    'ios_store_url' => env('IOS_STORE_URL', ''),
    'android_store_url' => env('ANDROID_STORE_URL', ''),

    /*
    |--------------------------------------------------------------------------
    | API Version
    |--------------------------------------------------------------------------
    |
    | Current API version string. Returned in X-API-Version response header
    | and in the version-check endpoint.
    |
    */

    'api_version' => 'v1',

];
