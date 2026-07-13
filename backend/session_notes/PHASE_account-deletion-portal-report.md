# PHASE: Account Deletion — Portal (Club Admin View) Report

**Date:** 2026-03-24
**Status:** COMPLETE
**Commit:** `0be1cf9`

## Summary

Added pending deletion visibility to the club manager portal. Managers see an amber warning banner on the Swimmers page listing members who requested account deletion, with a countdown showing days remaining before permanent purge.

## Files Changed

| File | Change |
|------|--------|
| `backend/app/Http/Controllers/Api/SwimmerManagementController.php` | Added `pendingDeletion()` method — queries soft-deleted users with active deletion requests |
| `backend/routes/api.php` | Added `GET /club/members/pending-deletion` route inside CLUB_MANAGER group |
| `frontend/src/pages/club/Swimmers.jsx` | Added pending deletion fetch + warning banner with member list and days-remaining chips |
| `frontend/src/locales/en/common.json` | Added `swimmers.pendingDeletionTitle` and `swimmers.daysLeft` keys |
| `frontend/src/locales/ar/common.json` | Added Arabic translations for new keys |

## API Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/club/members/pending-deletion` | Bearer (CLUB_MANAGER) | Returns club members with active deletion requests, ordered by purge date ASC |

## Frontend UX

- Amber warning banner appears at top of Swimmers page when members are pending deletion
- Each member row shows name, email, and a color-coded chip:
  - **Red** chip: ≤7 days remaining (urgent)
  - **Amber** chip: >7 days remaining
- Banner auto-hides when no members are pending deletion
- Bilingual (English + Arabic)

## Test Results

- Backend: 241 passed (650 assertions)
- Frontend: 22 passed (5 files)
- No regressions
