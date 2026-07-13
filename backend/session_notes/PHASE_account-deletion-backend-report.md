# PHASE: Account Deletion — Backend Report

**Date:** 2026-03-24
**Status:** COMPLETE
**Commit:** `72447e7`

## Summary

Implemented soft delete with 30-day recovery window for swimmer and coach mobile users. Three API endpoints (delete, reactivate, status), login integration, and automated daily purge command.

## Files Changed

| File | Change |
|------|--------|
| `database/migrations/2024_01_01_000068_add_deletion_columns_to_users_table.php` | **NEW** — adds `deletion_requested_at` + `scheduled_purge_at` to users |
| `app/Models/User.php` | Added new columns to fillable/casts, `scopePendingDeletion`, `isPendingDeletion()`, `daysUntilPurge()` |
| `app/Http/Controllers/Api/AccountDeletionController.php` | **NEW** — 3 endpoints: requestDeletion, reactivate, status |
| `app/Http/Controllers/Api/AuthController.php` | Login checks for pending deletion before auth attempt |
| `app/Console/Commands/PurgeDeletedAccounts.php` | **NEW** — permanently deletes expired accounts, `--dry-run` flag |
| `routes/api.php` | Added account deletion routes (auth + public) |
| `routes/console.php` | Added `accounts:purge` daily at 03:00 UTC |
| `tests/Feature/AccountDeletionTest.php` | **NEW** — 12 tests, 39 assertions |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/account/delete` | Bearer token | Initiates 30-day soft delete, revokes all tokens |
| POST | `/api/v1/account/reactivate` | None (email+password) | Restores account within 30-day window, returns new token |
| GET | `/api/v1/account/deletion-status?email=` | None | Returns: `active`, `pending_deletion`, `permanently_deleted`, or `not_found` |

## Flow

1. User calls `POST /account/delete` → account soft-deleted, tokens revoked, 30-day timer starts
2. Login attempts for pending users return `403 { status: "pending_deletion", days_remaining: N }`
3. User can call `POST /account/reactivate` with email+password within 30 days → account restored, new token issued
4. After 30 days, `accounts:purge` command permanently deletes the user record + related data

## Test Results

```
12 passed (39 assertions) — 0.45s
```

- Request deletion → soft delete + token revocation
- Duplicate deletion → 409
- Login blocked → 403 with pending_deletion status
- Reactivate within window → success + new token
- Reactivate after window → 410 Gone
- Wrong password → 401
- Status endpoint → correct states
- Purge command → permanent delete
- Purge dry-run → no delete
- Purge skips non-expired → correct

## Full Suite

```
241 passed (650 assertions) — 10.22s
```

No regressions.
