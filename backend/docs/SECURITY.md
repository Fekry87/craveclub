# Security Guide — CraveClubs

## Secrets Management

- **Never commit `.env` files** to git. The `.gitignore` excludes them.
- Only `.env.example` and `.env.ci` are safe to commit (they contain no real secrets).
- If you accidentally commit `.env`, **rotate ALL keys immediately**:
  - `APP_KEY` — `php artisan key:generate`
  - Database password
  - AWS credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY)
  - `METRICS_SECRET_KEY`
  - Sentry DSN
  - Reverb app key/secret
- Use `git filter-branch` or BFG Repo Cleaner to remove `.env` from git history, then force push.

## Authentication

- Token-based auth via Laravel Sanctum (no session cookies).
- Web tokens expire in 24 hours (`config/sanctum.php`).
- Mobile tokens (ios/android) expire in 30 days (`AuthController`).
- Brute force protection: 5 failed login attempts → 15-minute lockout per IP.
- Login endpoint rate limited: 10 attempts/minute.

## Multi-Tenancy

- All tenant data scoped by `club_id` — enforced by `BelongsToClub` trait (global scope) and `assertOwnership()` in controllers.
- All `Rule::exists()` validations on tenant tables include `->where('club_id', app('current_club_id'))`.
- Cache keys include `$clubId` to prevent cross-tenant cache poisoning.

## Rate Limiting

| Endpoint | Limit | Key |
|----------|-------|-----|
| Login | 10/min | IP |
| Authenticated | 60/min | User ID |
| Guest | 20/min | IP |
| Registration (public) | 5/hr | Phone hash |
| Branding upload | 20/hr | Club ID |
| Push tokens | 5 active | User ID |

## File Upload Security

- MIME types validated from file content (not just extension).
- Allowed: `image/png`, `image/jpeg`, `image/svg+xml`.
- Max size: 2MB.
- Filenames are content-hashed (no user-supplied names reach storage).

## Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy`

## Error Handling

- Production 500 errors return generic "An unexpected error occurred." with `request_id` (no stack traces).
- Slow query bindings are redacted in production logs.
- All API errors return JSON (never HTML).

## CORS

- `allowed_origins` configured via `FRONTEND_URL` and `FRONTEND_URL_ALT` env vars.
- `supports_credentials: false` — no cookies.
- Production must set `FRONTEND_URL` to the actual frontend domain.

## B2 Storage

- Bucket: public read (images need to be accessible), no public write, no public list.
- Content-hash filenames for CDN cache-busting.
- `CacheControl: public, max-age=31536000, immutable` on uploads.
