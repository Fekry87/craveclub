# Club Management System (CraveClubs)

## Architecture
- Two-tier SaaS: Corporate (CraveClubs) tier manages multiple Club tiers
- Backend: PHP 8.2 + Laravel 12 + SQLite (`backend/`)
- Frontend: React 19 + Vite (`frontend/`)
- Mobile: SwimmingApp — React Native + Expo SDK 54 (`../Club App/SwimmingApp/`)
- Single DB (not database-per-tenant) — `club_id` column scopes all tenant data
- `ClubContext` middleware sets `app('current_club_id')` from authenticated user
- Auth: Token-based (Laravel Sanctum `createToken()`), NOT session/cookie-based
- Dual-scope tokens in localStorage: `crave_corporate_token` and `crave_club_token`
- `statefulApi()` is commented out in `backend/bootstrap/app.php` — do NOT re-enable
- CORS `supports_credentials` must stay `false` (no cookies); `allowed_origins` includes both `localhost` and `127.0.0.1`
- API base URL is dynamic: `http://${window.location.hostname}:8000/api/v1` — works on both `localhost` and `127.0.0.1`; override with `VITE_API_URL` env var
- Real-time: Laravel Reverb WebSockets — `broadcast()->toOthers()` OUTSIDE DB transactions
- Private channels scoped by club: `private-club.{club_id}` (authorized for CLUB_MANAGER and COACH roles)
- Broadcasting auth: `POST /api/v1/broadcasting/auth` under `auth:sanctum` middleware

## Common Commands
- `cd backend && php artisan test` — run all tests (32 tests)
- `cd backend && php artisan serve` — start API server (port 8000)
- `cd frontend && npm run dev` — start Vite dev server (port 5173)
- `cd backend && php artisan cache:clear` — clear cache (needed after rate limit changes)
- `cd backend && php artisan migrate:fresh --seed` — reset DB with seed data
- `cd backend && php artisan reverb:start` — start WebSocket server (port 8080)
- Demo club slug is `future-academy` — use `/portal/future-academy` to login (manager@futureacademy.com / Password123!)

## Key Patterns
- Club-scoped controllers: always query with `->where('club_id', app('current_club_id'))` and `abort(404)` if record's `club_id` doesn't match
- `BelongsToClub` trait auto-scopes via global scope + auto-fills `club_id` on create — used on older models (CoachProfile, SwimmerProfile, etc.)
- New CRUD controllers (Branch, Sport, SubscriptionPlan): manual scoping pattern without the trait — scope in controller, not model
- `SubscriptionPlan.is_popular` is exclusive: when setting `true`, clear all other plans for that club first
- `CoachSchedule` upsert pattern: `updateOrCreate(['coach_id', 'day_of_week'], ['slots' => ...])` for schedule management
- Registration approval chain: `registration.coach_id` → `coach_profiles.id` → `user_id` → `groups.coach_user_id` — used to auto-assign swimmers to groups
- User model `'password' => 'hashed'` cast auto-hashes plain passwords on create — no need to call `Hash::make()`
- Migration numbering: sequential from `2024_01_01_000043_` — check last number before adding new migrations
- Route middleware stacking: parent group has `throttle:200,1` — do NOT add extra throttle to child groups
- All React page components must have `.catch()` on API calls and null guards before accessing API state
- All `async` form handlers (handleSave, handleDelete, etc.) MUST use try/catch with error state — bare `await` silently fails on 422/500
- `Button` component supports `disabled` prop — use with `saving` state to prevent double-submit
- Show Laravel 422 validation errors: `Object.values(err.response.data.errors).map(arr => arr[0])`
- ErrorBoundary hierarchy: top-level ErrorBoundary + RouteErrorBoundary per-page (wraps `<Outlet />`)
- Feature-gating: `feature:` middleware on backend, `FeatureRoute` component on frontend
- Scope detection from URL: `/login`, `/corporate/*` → corporate; `/portal/*`, `/club/*`, `/coach/*`, `/swimmer/*` → club
- Registration wizard steps: no `<form>` tags — use `type="button"` on buttons, `onClick` handlers with validation
- Registration state: `RegistrationContext` with `useReducer` + `sessionStorage` persistence (key: `crave_registration_draft`)
- Registration context stores human-readable names (`branchName`, `planName`, `planPrice`, `coachName`) alongside IDs for the review step
- Registration routes use own layout (WizardLayout) — NOT wrapped in `<Layout />`, but still inside `ProtectedRoute`
- Registration success page (`/club/registration/success`) is OUTSIDE `RegistrationProvider` — context is reset in Step8 before navigating
- Registration success data passed via `sessionStorage` key `registration_success` (JSON with swimmerName, branchName, coachName, planName) — set before context reset, read and removed on mount

## Key Files
- `backend/app/Traits/BelongsToClub.php` — auto club-scoping trait (global scope + creating hook)
- `backend/app/Http/Controllers/Api/BranchController.php` — reference CRUD controller with manual club-scoping pattern
- `backend/app/Http/Controllers/Api/PublicRegistrationController.php` — public registration endpoint, fires `NewRegistrationSubmitted` broadcast
- `backend/app/Events/NewRegistrationSubmitted.php` — Reverb broadcast event for real-time registration notifications
- `backend/routes/channels.php` — private channel authorization (`club.{clubId}`)
- `backend/database/seeders/DemoSeeder.php` — all seed data (club, users, coaches, swimmers, branches, sports, plans, schedules)
- `backend/routes/api.php` — all API routes, middleware stacking, broadcasting auth
- `backend/bootstrap/app.php` — app config (statefulApi commented out)
- `backend/config/cors.php` — CORS settings
- `frontend/src/api/axios.js` — axios instance with dynamic base URL + dual-scope token logic
- `frontend/src/api/registration.js` — registration wizard API (plans, coaches, schedule, submit) using public endpoints with `X-Club-Slug` header
- `frontend/src/contexts/AuthContext.jsx` — auth state management
- `frontend/src/contexts/RegistrationContext.jsx` — registration wizard state (useReducer + sessionStorage + Outlet)
- `frontend/src/lib/echo.js` — Laravel Echo instance factory (Reverb broadcaster, uses `crave_club_token`)
- `frontend/src/components/Layout.jsx` — main layout with RouteErrorBoundary
- `frontend/src/components/ErrorBoundary.jsx` — error boundaries
- `frontend/src/components/ui/FormControls.jsx` — shared FormField, Button, Input, Select, TextArea components
- `frontend/src/components/ui/Modal.jsx` — Modal and ModalActions components
- `frontend/src/pages/registration/components/WizardLayout.jsx` — registration wizard wrapper (dark theme, progress bar, back button)
- `frontend/src/pages/registration/components/WizardProgressBar.jsx` — animated progress bar (step N/8, gradient fill)
- `frontend/src/pages/registration/steps/Step1_BasicProfile.jsx` — first wizard step (avatar, name, phone, gender, DOB)
- `frontend/src/pages/registration/steps/Step7_CoachSelection.jsx` — coach list, bio modal, schedule viewer with time slot selection
- `frontend/src/pages/registration/RegistrationSuccess.jsx` — post-submission confirmation page with animated checkmark
- `frontend/src/pages/club/Registrations.jsx` — real-time registrations page (Reverb WebSocket, toast, browser notifications, approve/reject actions)
- `backend/app/Http/Controllers/Api/RegistrationController.php` — registration CRUD + approve/reject with auto User+SwimmerProfile+GroupMembership creation
- `frontend/src/pages/club/SubscriptionPlansPage.jsx` — subscription plan management (CRUD, toggle, reorder, feature-gated)
- `frontend/src/api/subscriptionPlans.js` — subscription plans API module

## Registration Wizard Routes
```
/club/registration            → Step1_BasicProfile
/club/registration/physical   → Step2_PhysicalInfo
/club/registration/sport      → Step3_SportType
/club/registration/experience → Step4_ExperienceLevel
/club/registration/branch     → Step5_BranchSelection
/club/registration/plan       → Step6_SubscriptionPlan
/club/registration/coach      → Step7_CoachSelection
/club/registration/review     → Step8_ReviewPayment
/club/registration/success    → RegistrationSuccess (outside RegistrationProvider)
```
Steps 1–8 wrapped in `ProtectedRoute roles={['CLUB_MANAGER']}` + `RegistrationProvider` (renders `<Outlet />`).
Success page wrapped in `ProtectedRoute` only (no RegistrationProvider — context already reset).

## Gotchas
- Never stack `throttle` middleware on nested route groups — causes premature 429 errors
- API state initialized as `null` will crash React render if accessed before load completes — always add null guards
- `async onClick` handlers with bare `await` (no try/catch) silently swallow errors — buttons appear broken
- `Button` component spreads `{...props}` AFTER `style` — never pass `style` prop directly, it overrides internal styles
- Login endpoint has its own `throttle:10,1` — separate from authenticated routes
- Club portal login is at `/portal/:slug`, corporate login at `/login` — different auth flows
- Coach schedule FK references `coach_profiles` table (not `users`) — `coach_id` points to `coach_profiles.id`
- `broadcast()->toOthers()` must be called OUTSIDE DB transactions — transactions hold locks and delay the broadcast
- Registration wizard steps must NOT use `<form>` tags — use `type="button"` on all buttons to prevent accidental submits
- `RegistrationProvider` renders `{children || <Outlet />}` — works both as a wrapper component and as a route layout element
- Registration wizard uses public API endpoints (not authenticated) — `club.header` middleware resolves club from `X-Club-Slug` header; no authenticated POST route for `/registrations` exists
- `clearRegistrationDraft()` from RegistrationContext clears the `crave_registration_draft` sessionStorage key — always use this function, not hardcoded key
- `localhost` and `127.0.0.1` are different origins for CORS — both must be in `allowed_origins` in `backend/config/cors.php`
- API calls via `api` (axios instance) must NOT include `/v1/` prefix — base URL already has `/api/v1`, so `/v1/club/...` becomes `/api/v1/v1/club/...`
- `Registration` model requires `sport_ids` (NOT NULL) — always include when creating registrations programmatically
