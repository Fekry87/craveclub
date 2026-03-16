# CraveClubs — API Versioning Strategy

## Overview

CraveClubs uses a **URL-prefix versioning** scheme (`/api/v1/...`) combined with **header-based client identification** to manage API evolution across portal (web) and mobile (React Native/Expo) clients.

## Versioning Scheme

### URL Prefix

All API routes are prefixed with `/api/v1`. When breaking changes are needed, a new version prefix (`/api/v2`) will be introduced alongside the existing one, giving clients a migration window.

```
Current:  /api/v1/club/dashboard
Future:   /api/v2/club/dashboard  (when breaking changes are needed)
```

### Client Identification Headers

Every request should include:

| Header | Format | Example | Purpose |
|--------|--------|---------|---------|
| `X-App-Version` | semver | `1.2.3` | Client app version for force-update checks |
| `X-Platform` | string | `ios`, `android`, `web` | Platform identification for platform-specific logic |

These headers are:
- **Optional** — the API works without them
- **Stored** in the app container (`client_app_version`, `client_platform`) for downstream use
- **Echoed back** as `X-App-Version-Received` and `X-Platform-Received` response headers

### Response Headers

Every API response includes:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-API-Version` | `v1` | Current API version |
| `X-API-Deprecated` | `false` | Will be `true` when endpoint is deprecated |
| `X-Request-ID` | UUID | Unique request identifier for debugging |

## Force Update Mechanism

### Endpoint

```
GET /api/v1/app/version-check
```

### Request Headers

```
X-App-Version: 1.2.3
X-Platform: ios
```

### Response

```json
{
    "api_version": "v1",
    "latest_version": "2.0.0",
    "minimum_version": "1.5.0",
    "force_update": false,
    "update_available": true,
    "store_url": "https://apps.apple.com/app/your-app-id",
    "platform": "ios",
    "client_version": "1.2.3"
}
```

### Decision Matrix

| Client Version vs Minimum | Client Version vs Latest | `force_update` | `update_available` | Action |
|---------------------------|--------------------------|----------------|-------------------|--------|
| Below minimum | — | `true` | `false` | Block app, show update screen |
| At or above minimum | Below latest | `false` | `true` | Show optional update banner |
| At or above minimum | At or above latest | `false` | `false` | No action needed |

### Mobile Implementation Guide

```javascript
// On app launch (React Native / Expo)
async function checkVersion() {
    const response = await fetch(`${API_URL}/app/version-check`, {
        headers: {
            'X-App-Version': APP_VERSION,
            'X-Platform': Platform.OS, // 'ios' or 'android'
        },
    });
    const data = await response.json();

    if (data.force_update) {
        // Show blocking modal with store link
        showForceUpdateScreen(data.store_url);
    } else if (data.update_available) {
        // Show dismissible banner
        showUpdateBanner(data.store_url);
    }
}
```

### Configuration

Server-side version config in `config/app_versions.php`:

```php
return [
    'minimum_ios_version' => env('MINIMUM_IOS_VERSION', '1.0.0'),
    'minimum_android_version' => env('MINIMUM_ANDROID_VERSION', '1.0.0'),
    'latest_version' => env('APP_LATEST_VERSION', '1.0.0'),
    'ios_store_url' => env('IOS_STORE_URL', ''),
    'android_store_url' => env('ANDROID_STORE_URL', ''),
    'api_version' => 'v1',
];
```

Environment variables (in `.env`):

```
MINIMUM_IOS_VERSION=1.0.0
MINIMUM_ANDROID_VERSION=1.0.0
APP_LATEST_VERSION=1.0.0
IOS_STORE_URL=https://apps.apple.com/app/your-app-id
ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=your.app.id
```

## Backward Compatibility Rules

1. **Never remove fields** from existing JSON responses — add new fields instead
2. **Never change field types** — `"count": 5` must not become `"count": "5"`
3. **Never change URL semantics** — `GET /club/dashboard` must keep returning the same resource shape
4. **Nullable fields** are safe to add — new fields default to `null` and don't break old clients
5. **New endpoints** are always safe — they don't affect existing clients
6. **New optional query params** are safe — existing requests without them still work

## When to Bump API Version

Create a new `/api/v2` only when:

- Removing a field from a response
- Changing a field's type or meaning
- Changing authentication flow
- Restructuring the URL hierarchy
- Removing an endpoint entirely

Do NOT bump for:

- Adding new endpoints
- Adding new optional fields to responses
- Adding new optional query parameters
- Bug fixes that correct incorrect behavior
- Performance improvements

## Deprecation Process

1. **Mark endpoint**: Set `X-API-Deprecated: true` on the response
2. **Document**: Add deprecation notice to `API_CHANGELOG.md` with date and replacement
3. **Notify**: Log usage of deprecated endpoints for monitoring
4. **Grace period**: Minimum 90 days before removal
5. **Remove**: Only after confirming zero traffic from analytics

## File Reference

| File | Purpose |
|------|---------|
| `config/app_versions.php` | Version numbers, store URLs |
| `app/Http/Middleware/ApiVersionMiddleware.php` | Reads client headers, adds response headers |
| `app/Http/Controllers/Api/AppVersionController.php` | Version check endpoint logic |
| `routes/api.php` | Route registration |
| `docs/API_CHANGELOG.md` | Endpoint change history |
| `.env.example` / `.env.production.example` | Environment variable templates |
