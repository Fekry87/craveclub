# PHASE: Club-Aware Login — Report

## Summary
Implemented club-branded login via root-level URL slugs: `app.craveclubs.co/future-academy` now loads the club's branding and renders a branded login page.

## Changes Made

### 1. App.jsx — Route + Slug Resolver
- Added `/:clubSlug` catch-all route (placed AFTER all named routes, BEFORE `*` fallback)
- `ClubSlugResolver` component checks slug against reserved paths (`login`, `corporate`, `club`, `coach`, `swimmer`, `portal`, `clubs`, `platform`) — if reserved, redirects to `/`; otherwise renders `<ClubLogin />`

### 2. ClubLogin.jsx — Branding Upgrade
- Supports both `/portal/:slug` (legacy) and `/:clubSlug` (new) via `params.slug || params.clubSlug`
- Upgraded from `/clubs/:slug` to `/branding/:slug` endpoint for richer data (features, social links, favicon, cover_url)
- Falls back to `/clubs/:slug` if branding endpoint fails
- Sets dynamic favicon from `favicon_url`
- Sets page title to club `display_name`
- Refactored color normalization into `normalizeColor()` helper
- Updated contact fields to prefer `support_email`/`support_phone` (branding) with fallback to `contact_email`/`contact_phone` (clubs)
- Hero heading uses `display_name || name` for prettier display

### 3. axios.js — 401 Redirect Update
- 401 redirect now sends to `/:slug` (not `/portal/:slug`) for cleaner URLs
- Login page detection unchanged (still skips redirect on `/login` and `/portal/*`)

## Backend (No Changes Needed)
- `GET /api/v1/branding/{slug}` already exists, public, cached 1hr
- `POST /api/v1/auth/login` already validates `club_slug` — returns 403 "You are not a member of this club" if mismatch
- `club_slug` already passed through AuthContext.login()

## Definition of Done
- [x] `app.craveclubs.co/future-academy` loads club branding from API
- [x] Login screen shows club name, logo, and primary color
- [x] Invalid slug shows "Club not found" with redirect to corporate login
- [x] After login, user belonging to wrong club sees 403 error message
- [x] `app.craveclubs.co` (no slug) still shows corporate login unchanged
- [x] `/portal/:slug` (legacy URL) still works
- [x] All 22 frontend tests pass
- [x] Pushed to main

## Files Modified
- `frontend/src/App.jsx` — added ClubSlugResolver + /:clubSlug route
- `frontend/src/pages/ClubLogin.jsx` — branding endpoint upgrade + dual param support
- `frontend/src/api/axios.js` — 401 redirect path update
