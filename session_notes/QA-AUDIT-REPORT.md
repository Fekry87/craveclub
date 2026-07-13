# QA Audit Report — 2026-07-11

Full-stack audit of CraveClubs on the `staging` branch. Backend + portal tested live against a local staging environment (SQLite dev DB, seeded demo data + a second "QA Test Club" created locally for isolation testing). Mobile audited via API simulation + full code-contract review (no simulator run). **No production data was touched.**

The original audit findings are preserved below for the record. **All HIGH and MEDIUM findings (portal + mobile) have since been fixed** — see the "Fixes Applied" section immediately below. LOW findings were left for a later pass.

---

## Fixes Applied — 2026-07-11 (follow-up)

**All findings across every severity are now fixed** — CRITICAL (none existed), HIGH, MEDIUM, and all 13 LOW items. Backend suite **242/242 pass** (one test added), frontend **22/22 pass**, mobile **`tsc --noEmit` 0 errors**. Portal fixes browser-verified where visible.

### LOW (polish / hardening) — all fixed
- **L1 — Enter doesn't submit login** ✅ Explicit `onKeyDown` Enter handler on both login forms ([ClubLogin.jsx](frontend/src/pages/ClubLogin.jsx), [Login.jsx](frontend/src/pages/Login.jsx)). Browser-verified: Enter logs in.
- **L2 — Concatenated support contact** ✅ Operator-precedence bug (`a || b && (...)`) leaked raw strings; wrapped the condition ([ClubLogin.jsx](frontend/src/pages/ClubLogin.jsx)). Browser-verified: two clean labeled cards.
- **L3 — Raw `SESSIONS.TIME` header** ✅ Missing `sessions.time` key added to en + ar ([locales](frontend/src/locales/en/common.json)).
- **L4 — "Good Afternoon, Club"** ✅ Demo manager renamed to a real name in seeder + dev DB. Browser-verified: "Good Morning, Mahmoud".
- **L5 — Sport card shows "D"** ✅ Emoji map keyed by RemixIcon name, falling back to the sport's initial ([SportModuleDashboard.jsx](frontend/src/pages/club/SportModuleDashboard.jsx)).
- **L6 — Deletion off-by-one** ✅ `daysUntilPurge()` now ceils fractional days; delete response uses the same computed value ([User.php](backend/app/Models/User.php), [AccountDeletionController.php](backend/app/Http/Controllers/Api/AccountDeletionController.php)).
- **L7 — Coach PII on public endpoint** ✅ `email`/`phone` removed from unauthenticated `/coaches` payloads ([PublicRegistrationController.php](backend/app/Http/Controllers/Api/PublicRegistrationController.php)).
- **L8 — Account-existence oracle** ✅ `deletion-status` collapses active/missing/purged into a generic `none`; only user-triggered `pending_deletion` is surfaced ([AccountDeletionController.php](backend/app/Http/Controllers/Api/AccountDeletionController.php)). Test updated + added.
- **L9 — Rejection notifies wrong user** ✅ Matches on the deterministic phone-derived email, not display name ([RegistrationController.php](backend/app/Http/Controllers/Api/RegistrationController.php)).
- **L10 — Weekday picker reversed in LTR** ✅ Array reordered Sun→Sat; RTL flips visually via `dir` ([ScheduleBuilderPage.jsx](frontend/src/pages/club/ScheduleBuilderPage.jsx)).
- **L11 — Leftover admin accounts** ✅ Two stray `.co` PLATFORM_ADMINs removed from dev DB; `admin:create` is idempotent per-email. (`.com` demo vs `.co` prod split is intentional.)
- **L12 — Latent scoping fragility** ✅ Explicit `where('club_id', ...)` added to all 6 trait-only index methods (coach/swimmer/group/session/plan/skill).
- **L13 — Evaluation month grouping** ✅ Monthly progress now groups by session date, not `created_at` ([SwimmerApiController.php](backend/app/Http/Controllers/Api/SwimmerApiController.php)).

### HIGH + MEDIUM + Mobile (from the first fix pass)

Backend suite **241/241 pass**, frontend **22/22 pass**, mobile **`tsc --noEmit` 0 errors**. Portal fixes browser-verified where visible.

### HIGH
- **H1 — Coach "My Groups" crash** ✅ `useTranslation()` now bound inside `GroupCard` ([frontend/src/pages/coach/Groups.jsx](frontend/src/pages/coach/Groups.jsx)). Browser-verified: page renders with all 6 swimmers, no error boundary.
- **H2 — Silent club-login failure** ✅ The 401 axios interceptor now (a) ignores 401s from the login/reactivate call itself and (b) recognises `/:clubSlug` as a login page, so it no longer redirect-wipes the error ([frontend/src/api/axios.js](frontend/src/api/axios.js)). Browser-verified: "Invalid credentials" now shows, form retains values. *This was the "something wrong when I login" symptom.*
- **H3 — Corporate swimmer counts** ✅ `total_swimmers` now counts `SwimmerProfile`; `/corporate/clubs` adds `withCount('swimmerProfiles')` ([backend/app/Http/Controllers/Api/CorporateController.php](backend/app/Http/Controllers/Api/CorporateController.php)). Browser-verified: "TOTAL SWIMMERS 11", Future Academy "11 SWIMMERS".
- **H4–H7 (mobile MH1–MH4)** — see mobile section below. All fixed.

### MEDIUM
- **M1 — Blank Membership Growth chart** ✅ Bar column wrapper given `height:100%` + `justify-content:flex-end` ([frontend/src/components/ui/MiniChart.jsx](frontend/src/components/ui/MiniChart.jsx)). Browser-verified: bars render (10→11 growth).
- **M2 — Leaderboard XP contradictions** ✅ Root cause: `RecalculateSwimmerXp` job existed but was never dispatched, leaving `xp_points` stale at 0. Now dispatched on session complete + attendance toggle ([backend/app/Http/Controllers/Api/CoachApiController.php](backend/app/Http/Controllers/Api/CoachApiController.php)).
- **M3 — Duplicate "Beginner/beginner" filters** ✅ Approval normalises `level` via `ucfirst(strtolower(...))`; existing dev rows backfilled ([backend/app/Http/Controllers/Api/RegistrationController.php](backend/app/Http/Controllers/Api/RegistrationController.php)).
- **M4 — "8/7 features"** ✅ Denominator derived from the feature object instead of hardcoded 7 ([frontend/src/pages/corporate/Dashboard.jsx](frontend/src/pages/corporate/Dashboard.jsx)).
- **M5 — Branch "0 sessions"** ✅ Sessions now inherit `branch_id` from the group's coach at creation ([SessionManagementController](backend/app/Http/Controllers/Api/SessionManagementController.php) + [SessionGeneratorService](backend/app/Services/SessionGeneratorService.php)); existing sessions backfilled. Verified: Main 5 / Downtown 5.
- **M6 — Push-token hijack** ✅ `registerPushToken` no longer blind-`updateOrCreate` on token alone; ownership transfer is explicit and requires an authenticated session as the new owner ([backend/app/Services/NotificationService.php](backend/app/Services/NotificationService.php)).
- **M7 — Stuck "CONNECTING…" badge** ✅ Badge now has a distinct amber "Offline — refresh for updates" state driven by Pusher `state_change` ([frontend/src/pages/club/Registrations.jsx](frontend/src/pages/club/Registrations.jsx)).
- **M8 — Registration enumeration** ✅ Added unguessable `reference_code` (migration `000070`); the public status endpoint looks up by code, not sequential id ([PublicRegistrationController](backend/app/Http/Controllers/Api/PublicRegistrationController.php), [routes/api.php](backend/routes/api.php)).

### Mobile (SwimmingApp)
- **MH1 — Daily forced logout** ✅ Default `X-Platform: Platform.OS` header on the axios instance → 30-day tokens ([src/api/client.ts](../Club App/SwimmingApp/src/api/client.ts)).
- **MH2 — Force-update crash** ✅ Screen + service now use the backend's platform-resolved `store_url` string with a null guard ([app.service.ts](../Club App/SwimmingApp/src/api/services/app.service.ts), [ForceUpdateScreen.tsx](../Club App/SwimmingApp/src/screens/Auth/ForceUpdateScreen.tsx), [RootNavigator.tsx](../Club App/SwimmingApp/src/navigation/RootNavigator.tsx)).
- **MH3 — Dead realtime** ✅ Two-part fix: mobile echo auth URL corrected to `/api/v1/broadcasting/auth` ([echo.service.ts](../Club App/SwimmingApp/src/services/echo.service.ts)); backend gained the `swimmer.{userId}` channel ([routes/channels.php](backend/routes/channels.php)) and now broadcasts `SessionStarted`/`SessionCompleted` ([new Events](backend/app/Events/) + CoachApiController). Channel/event names match the mobile listeners.
- **MH4 — Wrong password wipes club/branding** ✅ 401 interceptor now excludes `/auth/login` and `/account/reactivate` from the logout cascade ([src/api/client.ts](../Club App/SwimmingApp/src/api/client.ts)).
- **MM1 — Branded build membership** ✅ Login now sends the resolved `club_slug` so the backend enforces membership ([auth.store.ts](../Club App/SwimmingApp/src/store/auth.store.ts), [api.types.ts](../Club App/SwimmingApp/src/types/api.types.ts)).
- **MM2 — Reactivate missing `features`** ✅ Extracted a shared `BuildsUserPayload` trait; reactivation returns the same enriched payload as login and honors the 30-day mobile token expiry ([Concerns/BuildsUserPayload.php](backend/app/Http/Controllers/Api/Concerns/BuildsUserPayload.php), AccountDeletionController, AuthController).
- **MM3 — Config landmines** ✅ Removed the hardcoded Railway `wsHost` fallback; base `production` EAS profile now sets `EXPO_PUBLIC_API_URL` + Reverb scheme/port explicitly ([echo.service.ts](../Club App/SwimmingApp/src/services/echo.service.ts), [eas.json](../Club App/SwimmingApp/eas.json)). **Follow-up for deploy:** `EXPO_PUBLIC_REVERB_HOST` and `EXPO_PUBLIC_REVERB_APP_KEY` must be set as EAS secrets for production realtime.
- **MM4 — Dead `ClubEntryScreen`** ✅ Wired into the navigator (shared build, no club chosen → club picker before login); `isResolved` + the import are now used ([RootNavigator.tsx](../Club App/SwimmingApp/src/navigation/RootNavigator.tsx)).

Not addressed (out of scope for this pass): all LOW items (L1–L13).

---

## CRITICAL (security / data isolation — fix immediately)

**None found.** No cross-tenant read or write path was identified. Multi-tenant isolation held up under automated tests, live two-club API probing, and a full read of every API controller. The items below in HIGH/MEDIUM include a few security *hardening* gaps, but none allow club A to see club B's data.

---

## HIGH (broken core functionality)

### H1. Coach "My Groups" page crashes completely
- **Where:** `frontend/src/pages/coach/Groups.jsx`
- **What:** `ReferenceError: t is not defined` in `GroupCard` (defined at line 49, uses `t('actions.edit')` / `t('actions.delete')` at lines 150/168). `useTranslation()` is only called in the parent `CoachGroups` component (line 178), not in `GroupCard`.
- **Impact:** Every coach hitting "My Groups" gets the RouteErrorBoundary error page. Core coach navigation is broken.
- **Repro:** Log in as `coach1@futureacademy.com` → My Groups.

### H2. Failed club login shows NO error — form silently resets
- **Where:** `frontend/src/api/axios.js:67-79` (401 interceptor) + `frontend/src/pages/ClubLogin.jsx`
- **What:** The global 401 interceptor treats every 401 as session expiry and does `window.location.href = '/{slug}'`. Its `isLoginPage` guard only covers `/login` and `/portal/*` — but the club login page lives at `/:clubSlug`. A wrong password → 401 → full page reload → error state wiped, fields cleared, zero feedback.
- **Impact:** Users entering a wrong password see the form blink and empty with no explanation, on every club login page. (ClubLogin.jsx's own error handling at line 426 is correct but never gets to render.) This very likely explains the reported "something wrong when I login as manager."
- **Repro:** `/future-academy` → any email + wrong password → Sign in.

### H3. Corporate swimmer totals wrong in two different ways
- **Where:** `backend/app/Http/Controllers/Api/CorporateController.php` (metrics + clubs endpoints), `frontend/src/pages/corporate/Clubs.jsx:246,569`
- **What:**
  1. `total_swimmers` in `/corporate/metrics` counts Users with role SWIMMER (= 1) instead of swimmer members/profiles (= 11). Dashboard proudly shows "TOTAL SWIMMERS 1".
  2. `/corporate/clubs` does `withCount(['users','branches'])` but never `swimmer_profiles`; the frontend reads `club.swimmer_profiles_count` → always 0. Clubs page shows "0 SWIMMERS" per club and "0 TOTAL SWIMMERS".
- **Impact:** The corporate owner's two main screens show 1, 0, and (on the club detail page, which counts correctly) 10 swimmers for the same club. Three surfaces, three numbers.

### H4–H7. Mobile: daily forced logout, crashing force-update screen, dead realtime layer, login-error wipes club selection
See **Mobile Flow Audit → Mobile HIGH findings (MH1–MH4)** below. These four are HIGH severity: MH1 logs every mobile user out daily; MH2 crashes the app precisely when a forced update is issued; MH3 means no realtime feature works on mobile at all (two independent breaks); MH4 mirrors portal H2.

---

## MEDIUM (works but wrong/inconsistent)

### M1. Membership Growth chart always renders blank
- **Where:** `frontend/src/components/ui/MiniChart.jsx:94-102` (bar mode)
- **What:** Each bar's `height: {pct}%` is a percentage of a wrapper div that has **no height** (`flex: 1` in a row flex container sets width, not height) → every bar computes to 0px. API data is correct (`membership_growth` returns 0→10→11).
- **Impact:** Manager analytics "Membership Growth" panel shows axis labels but no bars, always.
- **Fix hint:** give the per-bar column wrapper `height: '100%'` (+ `justifyContent: 'flex-end'`).

### M2. Leaderboard XP contradictions on one page
- **Where:** `frontend/src/pages/swimmer/Leaderboard*` + backend XP sources
- **What:** After 1 attendance + rating 4, the same page shows: podium "Ali Hassan **0 XP**", stats card "**0** XP earned" but "**115 to go**" to the 200-XP tier (implying 85), and the ranked list "**85 XP**". The stored `swimmer_profiles.xp_points` (0, stale) and the computed `XpCalculationService` value (85) are mixed on one screen. Ratings/Attend/Streak counters also show 0 despite 1 rating + 1 attendance.
- **Impact:** Gamification numbers visibly contradict each other — undermines trust in the feature.

### M3. Registration approval stores unnormalized `experience_level`
- **Where:** approval chain in `backend/app/Http/Controllers/Api/RegistrationController.php`
- **What:** Approving a registration with `experience_level: "beginner"` creates a profile with lowercase `beginner`, while seeded/manually-created swimmers use `Beginner`. Filter chips then show **"Beginner (4)" and "beginner (1)" as two separate filters** (seen on both manager and coach swimmer pages).
- **Impact:** Duplicate filter buckets; any level-based grouping/reporting splits into case variants.

### M4. Corporate dashboard shows "8/7 features"
- **Where:** `frontend/src/pages/corporate/Dashboard.jsx:97` — hardcoded `{enabledCount}/7` while the backend now has 8 feature flags (subscription_plans was added).
- **Impact:** Nonsense ratio on the flagship corporate screen.

### M5. Branch cards show "0 Sessions" despite 10 sessions existing
- **Where:** Branches page / branch stats source
- **What:** Both branches show 0 sessions while the club has 10 (sessions aren't linked to branches, or the count query is wrong). Coaches/swimmers counts on the same cards are correct.

### M6. Push token can be silently re-bound to another user
- **Where:** `backend/app/Services/NotificationService.php:100-106` (`registerPushToken`)
- **What:** `PushToken::updateOrCreate(['token' => $token], ['user_id' => $userId, ...])` keys only on the token string. Any authenticated user who submits a token value already registered by someone else re-binds that device row to themselves (victim loses pushes; attacker's notifications go to victim's device). Mitigated by Expo token unguessability, but it's a cross-user write with no ownership check.
- **Fix hint:** reject or scope the lookup when the existing row belongs to a different user.

### M7. Realtime status badge stuck on "CONNECTING…"
- **Where:** Registrations page header (Reverb/Echo status)
- **What:** With Reverb offline (as in local/staging without the 4th process), the badge shows "CONNECTING…" forever; no offline/degraded state. Approvals still work via HTTP — but the badge implies something is pending.

### M8. Unauthenticated registration status enumeration
- **Where:** `backend/app/Http/Controllers/Api/PublicRegistrationController.php:272-283` (`GET /registrations/{id}` under `club.header`, no auth)
- **What:** Registration IDs are sequential and club slugs are public; anyone can iterate IDs with an `X-Club-Slug` header and harvest applicant `swimmer_name` + status (PII, often minors). Throttled at 60/min but not blocked.
- **Fix hint:** return a random reference code at submission instead of the numeric ID.

---

## LOW (polish / hardening / UX nitpicks)

- **L1. Login form doesn't submit on Enter** (club login page) — button click only.
- **L2. Support contact concatenation:** club login hero shows `support@futureacademy.com+1-555-0101` with no separator.
- **L3. Raw i18n key in sessions table header:** manager Sessions page column header renders literal **"SESSIONS.TIME"** (missing translation key).
- **L4. Greeting shows "Good Afternoon, Club"** for user "Club Manager" (first-name split on a non-personal name; seeder data quality + greeting logic).
- **L5. Sport module card icon renders letter "D"** instead of an icon on manager home / sport dashboard.
- **L6. Deletion grace period off-by-one:** delete response says "30 days" but status immediately reports `days_remaining: 29` (floor of 29.99).
- **L7. Coach email + phone exposed on public unauthenticated `/coaches`** endpoints (registration wizard needs names/photos; emails are also login identifiers — combine with L8 and it aids credential attacks).
- **L8. Account-existence oracle:** unauthenticated `GET /account/deletion-status?email=` distinguishes `not_found` / `active` / `pending_deletion` across all clubs, and generated swimmer emails are predictable (`swimmer_{phone}@club{id}.craveclubs.local`).
- **L9. Rejection notification can hit the wrong same-club user:** `RegistrationController.php:205-207` finds the swimmer's User by **name** match within the club.
- **L10. Weekday picker order looks reversed in English** (Sa→Su) on the Schedule Builder — fine for RTL, odd in LTR.
- **L11. Three PLATFORM_ADMIN accounts exist** (`admin@craveclubs.com`, `manager@craveclubs.co`, `admin@craveclubs.co`) — leftovers from seed + deploy-time `admin:create` iterations; consolidate before production.
- **L12. Latent scoping fragility:** the `BelongsToClub` global scope filters by `auth()->user()->club_id` and is a **no-op** for unauthenticated requests and PLATFORM_ADMINs (null club_id). Today every affected route stacks `role:` + `club.context` middleware so it's safe, but six index methods (coach/swimmer/group/session/plan/skill) rely solely on the trait. Add explicit `where('club_id', app('current_club_id'))` for defense in depth.
- **L13. Evaluation month grouping:** swimmer "Monthly Progress" groups a March-session evaluation under 2026-07 (evaluation creation date, not session date). Confirm which is intended.

---

## Automated Test Results

| Suite | Result |
|---|---|
| Backend (`php artisan test`) | **241 passed**, 0 failed (647 assertions, 10.4s) |
| Frontend (`npx vitest run`) | **22 passed**, 0 failed (5 files) |
| MultiTenancyTest (isolation) | 8/8 passed |

Note: `--parallel` was not used (ParaTest not configured); the plain runner covered the full suite.

## Multi-Tenancy Isolation Audit

- **Models with `BelongsToClub` trait (17):** all auto-scoped.
- **Models without the trait but with `club_id` (11):** AuditLog, Branch, ClubSportModule, ClubFeature, LeaderboardSetting, Notification, LevelTier, Registration, Sport, SubscriptionPlan, User — all verified manually scoped in their controllers (explicit `where club_id` + ownership asserts + club-scoped `Rule::exists` on FK inputs).
- **Indirectly scoped:** CoachSchedule (via coach profile), ScheduleHoliday (via schedule), PushToken (via user) — parent ownership verified in controllers (except the M6 push-token write).
- **Legitimately global:** Club, CorporateSetting, SportModule.
- **Live two-club check:** created "QA Test Club" (club 2) in the local dev DB. Club-2 manager: all list endpoints return empty; direct ID probes at club-1 swimmers/sessions/coaches/branches/groups all return 404; dashboard all zeros. Role fences verified: coach→manager routes 403, swimmer→coach/manager 403, manager→corporate/platform 403, no-token 401.
- Null-`club_id` users are exactly the 3 PLATFORM_ADMINs (expected, see L11).

## API Smoke Test (local staging)

All 13 public endpoints 200 (health, clubs, club detail, sports, branding, version-check, branches/coaches/plans via X-Club-Slug, deletion-status). All 23 manager GET endpoints 200. All 7 coach + 7 swimmer GET endpoints 200. All 10 corporate endpoints 200. Login throttle (10/min) fires correctly with a JSON Retry-After response.

## End-to-End Flows Verified Working

- **Registration → approval chain:** public API submission → appears on manager Registrations page (pending) → approve dialog → swimmer User + profile + group membership created with temp credentials → appears in coach roster. Full chain works.
- **Coach live session:** start → LIVE timer → roster (6, incl. newly approved swimmer) → toggle attendance → 1–5 rating → end with confirm → status Completed, filter counts update, absence notifications fired (bell badge 5).
- **Data propagation:** coach-recorded attendance/rating immediately visible on coach swimmer detail, swimmer dashboard, swimmer sessions ("✓ Present"), and the mobile-facing `/swimmer/sessions` endpoint (status=Completed).
- **Account deletion lifecycle:** request (200, 30-day window) → login blocked with 403 `pending_deletion` → manager sees "1 member scheduled for deletion" banner on Swimmers page → reactivate (requires email+password — good) → login restored.
- **Branding:** corporate edit → live phone preview updates → PUT 200 → public `/branding/{slug}` reflects change instantly (cache bust works) → club login page shows updated branding. Reverted after test.
- **Version gate:** `X-App-Version: 0.5.0` → `force_update: true` correctly.

## Cross-System Consistency (Future Academy)

| Check | Result |
|---|---|
| Approved swimmer name portal ↔ mobile-facing API | ✅ identical ("QA Audit Swimmer") |
| Branding change → public branding API (mobile source) | ✅ instant (cache busted); mobile applies on next app launch (force-refresh on launch by design) |
| Coach ends session in portal → swimmer sessions endpoint | ✅ status "Completed" |
| Member counts | ⚠️ club detail 11 = analytics 11 = actual; corporate dashboard says 1 and clubs list says 0 (finding H3) |
| Swimmer XP | ⚠️ stored profile `xp_points`=0 vs computed 85 (finding M2) |

## Mobile Flow Audit

_(Method: API-level simulation of every mobile-facing endpoint + full code-contract review of the SwimmingApp source against backend controllers. No simulator walkthrough — findings below are code-verified.)_

### Mobile HIGH findings

**MH1. Mobile users are silently logged out every 24 hours.** Login never sends the `X-Platform` header (`src/api/services/auth.service.ts:14-20`, `src/api/client.ts`) — only the version check does. Backend `AuthController` grants 30-day tokens only when `X-Platform` is `ios`/`android`, so every mobile session gets the web 24h expiry; the 401 interceptor then wipes storage and force-logs the user out daily. Fix is a one-line default header on the axios instance.

**MH2. The force-update screen crashes exactly when it's needed.** Mobile expects `update_url: {ios, android}` (`app.service.ts:11`, `ForceUpdateScreen.tsx:14`) but the backend returns `store_url` (single string). When `force_update` becomes true, `updateUrl.ios` throws on `undefined` and the app crashes instead of showing the update prompt. Currently masked because `force_update` is false.

**MH3. Mobile realtime is entirely dead code — two independent breaks.**
  1. Echo auth endpoint is `${apiUrl}/broadcasting/auth` without the `/api/v1` prefix (`src/services/echo.service.ts:50`) → always 404.
  2. Even if fixed: mobile subscribes to `private-swimmer.{userId}` and listens for 9 events (`SessionStarted`, `SessionCompleted`, `AttendanceRecorded`, …) — the backend defines **none** of them; `routes/channels.php` has no `swimmer.{id}` channel and `app/Events/` contains only `NewRegistrationSubmitted`.
  So the checklist item "coach starts session → swimmer's app reflects live" **cannot pass via WebSocket**; the app only updates via refetch-on-focus/polling. Currently silent because the placeholder `EXPO_PUBLIC_REVERB_APP_KEY=your-reverb-key` disables Echo altogether.

**MH4. Wrong password on mobile wipes the saved club + branding.** The 401 interceptor (`src/api/client.ts:55-67`) treats a failed login as session expiry: clears all storage including the persisted club slug and branding cache, resetting a shared-build user to CraveClubs defaults mid-screen. (Direct mobile twin of portal finding H2.)

### Mobile MEDIUM findings

- **MM1. Branded builds don't enforce club membership at login.** Mobile sends only `{email, password}`; backend validates club membership only when `club_slug` is present. Any club's user can log into any branded club app. (Data stays scoped to their own club — an isolation-UX issue, not a leak.)
- **MM2. Reactivated accounts lose all feature flags until app restart.** `/account/reactivate` returns a raw user without the `features` key that login includes; `hasFeature()` then returns false for everything until the next `/auth/me`. Reactivation token also gets 24h expiry (no explicit mobile expiry).
- **MM3. Production config landmines:** hardcoded Railway hostname fallback baked into `echo.service.ts:44`; the base `production` EAS profile sets no `EXPO_PUBLIC_API_URL`, so a plain production shared build silently targets the (different) `api.craveclubs.com` fallback; `.env` Reverb key is a placeholder.
- **MM4. `ClubEntryScreen` is dead code** — imported but never rendered; shared builds skip club entry and only resolve a slug after login/registration. Either wire it in or remove it.

### Mobile confirmed-correct (code-verified against backend)

Club selection list (`GET /clubs`, field mapping incl. `#`-handling), branding fetch/normalize/cache (`toHex` correctly re-adds the `#` the backend strips), **registration submit payload matches backend validation exactly** (string `sport_ids`, string `years_experience`/`weekly_frequency`, boolean flags, optional guardian fields), registration lookup endpoints, all swimmer screens (dashboard/sessions/stats/evaluations/leaderboard/training-plan/weekly-report), all coach flows (start/complete session payloads, roster, attendance incl. `end_time` + nested `group`), account deletion trio, push token registration, notifications (paths + `meta.unread_count`), `X-Sport-Module` header. Live API simulation additionally confirmed: version gate fires (`force_update: true` for 0.5.0), swimmer login returns SWIMMER role token, session status propagates to `/swimmer/sessions`.

## What's Working Well

- Multi-tenant scoping discipline is genuinely strong — every controller read verified, all 241 backend tests green, live probes clean. This is the hardest thing to get right in a shared-DB SaaS and it's right.
- The registration → approval → account → group → live session → attendance → evaluation → swimmer-visible-progress chain works end-to-end without a single failure.
- Account deletion lifecycle (request/block/banner/reactivate) is complete and the reactivation correctly demands the password.
- Branding pipeline (edit → cache bust → public API → login page) is instant and consistent, with a nice live preview.
- Role fencing is airtight at the API layer (401/403s exactly where expected), and the login rate limiter works.
- Coach live-session UI (roster, timer, tap attendance, inline ratings, session plan sidebar) is polished and fast.

## Test Artifacts / Residue (local dev DB only)

- "QA Test Club" (club id 2) + `manager@qatestclub.test`
- "QA Audit Swimmer" registration (approved) + user `swimmer_201001234567@club1.craveclubs.local`
- One session (Mar 20) marked Completed with 1 attendance + rating 4
- Branding display name was changed and reverted

Run `php artisan migrate:fresh --seed` in `backend/` to reset if desired.
