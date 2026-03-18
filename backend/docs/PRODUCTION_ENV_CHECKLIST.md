# Production Environment Checklist — CraveClubs

Review every variable before first deployment. Missing critical vars will cause outages.

## Critical (app breaks without these)

| Variable | Notes |
|----------|-------|
| `APP_KEY` | 32 chars, base64 encoded. Generate: `php artisan key:generate` |
| `APP_ENV` | **Must be `production`** (not `local` or `testing`) |
| `APP_DEBUG` | **Must be `false`** (leaks stack traces if true) |
| `APP_URL` | Full URL including https:// |
| `DB_HOST` | MySQL host |
| `DB_DATABASE` | Database name |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `REDIS_URL` | Full Redis connection URL |

## Security (must not use defaults)

| Variable | Notes |
|----------|-------|
| `METRICS_SECRET_KEY` | Strong random string (32+ chars). Protects `/api/v1/metrics` |
| `FRONTEND_URL` | Production frontend domain for CORS (e.g., `https://app.craveclubs.com`) |
| `FRONTEND_URL_ALT` | Optional second origin (e.g., `https://www.app.craveclubs.com`) |

## Storage (required for file uploads)

| Variable | Notes |
|----------|-------|
| `AWS_ACCESS_KEY_ID` | B2 application key ID |
| `AWS_SECRET_ACCESS_KEY` | B2 application key |
| `AWS_DEFAULT_REGION` | B2 region (e.g., `us-east-005`) |
| `AWS_BUCKET` | B2 bucket name |
| `AWS_URL` | B2 bucket endpoint URL |
| `CDN_URL` | Optional CDN URL (Cloudflare in front of B2) |

## Queue & Broadcasting

| Variable | Notes |
|----------|-------|
| `QUEUE_CONNECTION` | `redis` in production (not `database`) |
| `BROADCAST_CONNECTION` | `reverb` |
| `REVERB_APP_ID` | Unique app ID |
| `REVERB_APP_KEY` | Random key |
| `REVERB_APP_SECRET` | Random secret |
| `REVERB_HOST` | `0.0.0.0` (bind all interfaces) |
| `REVERB_PORT` | `8080` (or Railway-assigned) |

## Monitoring (recommended)

| Variable | Notes |
|----------|-------|
| `SENTRY_LARAVEL_DSN` | Sentry project DSN for error tracking |
| `LOG_CHANNEL` | `json` for structured logging |

## Mobile App

| Variable | Notes |
|----------|-------|
| `MINIMUM_IOS_VERSION` | Minimum iOS app version (force update below this) |
| `MINIMUM_ANDROID_VERSION` | Minimum Android app version |
| `APP_LATEST_VERSION` | Latest available version |
| `IOS_STORE_URL` | App Store URL |
| `ANDROID_STORE_URL` | Play Store URL |

## DO NOT set in production

| Variable | Why |
|----------|-----|
| `RATE_LIMIT_AUTH=10000` | Load testing override — removes rate limiting |
| `RATE_LIMIT_GUEST=10000` | Same — remove after load testing |
| `APP_DEBUG=true` | Leaks stack traces and internal paths |
