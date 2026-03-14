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
- CORS `supports_credentials` must stay `false` (no cookies); `allowed_origins` includes both `localhost` and `127.0.0.1`; methods/headers are explicit whitelists (not wildcards)
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP — added by `SecurityHeaders` middleware
- Structured exception handler in `bootstrap/app.php`: ValidationException→422, AuthenticationException→401, NotFoundHttpException→404, Throwable→500
- Health check: `GET /api/v1/health` — returns `{status, database, timestamp}` with DB connectivity test
- Docker: PHP 8.2 FPM Alpine backend + MySQL 8.0 + Redis 7 Alpine (see `docker-compose.yml`)
- API base URL is dynamic: `http://${window.location.hostname}:8000/api/v1` — works on both `localhost` and `127.0.0.1`; override with `VITE_API_URL` env var
- Real-time: Laravel Reverb WebSockets — `broadcast()->toOthers()` OUTSIDE DB transactions
- Private channels scoped by club: `private-club.{club_id}` (CLUB_MANAGER only), `private-club.{club_id}.coach` (COACH + CLUB_MANAGER)
- Broadcasting auth: `POST /api/v1/broadcasting/auth` under `auth:sanctum` middleware
- SoftDeletes on 8 critical models: Club, User, CoachProfile, SwimmerProfile, Group, TrainingSession, Registration, SubscriptionPlan — `deleted_at` column added via migration 000054
- AuditService: `AuditService::log($action, $model, $modelId, $metadata, $clubId)` — writes to `storage/logs/audit.log` (daily, 90-day retention)
- Audit logging on: registration.approved, registration.rejected, swimmer.deleted, coach.deleted, club.deleted, leaderboard.settings_changed, features.updated
- White-label branding: Club model has display_name, cover_url, favicon_url, app_name, support_email, support_phone, social_links (JSON), custom_domain, is_domain_active, branding_tier (shared|branded)
- Public branding API: `GET /api/v1/branding/{slug}` — cached 1hr, busted on update; returns club branding + feature flags
- Training Engine: TrainingPlan → TrainingPlanAssignment → RecurringSchedule → SessionGeneratorService pipeline
- TrainingPlan extended fields: duration_weeks, sessions_per_week, goals, difficulty_level (beginner|intermediate|advanced), is_template, coach_user_id, phases (JSON)
- TrainingPlanAssignment: links plan to group or individual swimmer with start/end dates, status (active|paused|completed|cancelled), coach_notes
- RecurringSchedule: defines repeating session pattern (days_of_week JSON [0-6], period_start/end, start_time, duration_minutes) with status (draft|active|completed)
- SessionGeneratorService: idempotent bulk session generator — computes dates from schedule, excludes holidays, skips existing, inserts in chunks of 100 within DB::transaction
- ScheduleHoliday: per-schedule exclusion dates — adding holiday auto-cancels any generated session on that date
- Training plans feature-gated: `feature:training_plans` middleware on backend, `FeatureRoute` on frontend
- Weekly Report: SwimmerWeeklyReportService computes attendance, evaluations, plan phase, risk signals (red/yellow/green) per swimmer per week
- Weekly report risk signals: red (missed all of 2+ sessions), yellow (<60% attendance or avg rating <2.5), green (default) — Arabic reason strings
- Weekly report endpoints: swimmer (no risk), coach (own group swimmers), manager (all club swimmers) — `?week=YYYY-WNN` optional param
- Public sports API: `GET /api/v1/sports` and alias `GET /api/v1/public/sports` — both under `club.header` middleware, no auth required
- Sport Module Architecture: Corporate creates SportModule catalog → assigns to clubs via club_sport_modules → Manager sees sport cards dashboard → sport.context middleware sets app('current_sport_module_id') → all entities (Group, TrainingSession, TrainingPlan, Registration) have nullable sport_module_id
- Sport-scoped routes: GET/POST /api/v1/club/{sportSlug}/groups|sessions|swimmers|coaches|training-plans require sport.context middleware — resolves slug to sport_module_id
- Backward compat: all existing /club/* routes work unchanged — sport_module_id is always nullable, never required on existing endpoints
- SessionManagementController.sessionStore() infers sport_module_id from group if not provided explicitly
- TrainingPlanController.coachPlans() filters by sport_module_id if current_sport_module_id is bound, otherwise returns all (backward compat)
- Registration.sport_module_id resolved from club's first active sport module in PublicRegistrationController.store()

## Common Commands
- `cd backend && php artisan test` — run all tests (146 tests)
- `cd frontend && npx vitest run` — run all frontend tests (22 tests)
- `cd backend && php artisan serve` — start API server (port 8000)
- `cd frontend && npm run dev` — start Vite dev server (port 5173)
- `cd backend && php artisan cache:clear` — clear cache (needed after rate limit changes)
- `cd backend && php artisan migrate:fresh --seed` — reset DB with seed data
- `cd backend && php artisan reverb:start` — start WebSocket server (port 8080)
- `docker compose up -d` — start all services (backend, MySQL, Redis) via Docker
- Demo club slug is `future-academy` — use `/portal/future-academy` to login (manager@futureacademy.com / Password123!)

## Key Patterns
- Club-scoped controllers: always query with `->where('club_id', app('current_club_id'))` and `abort(404)` if record's `club_id` doesn't match
- `BelongsToClub` trait auto-scopes via global scope + auto-fills `club_id` on create — used on older models (CoachProfile, SwimmerProfile, etc.)
- New CRUD controllers (Branch, Sport, SubscriptionPlan): manual scoping pattern without the trait — scope in controller, not model
- Cross-tenant FK validation: all `exists:` rules use `Rule::exists('table', 'col')->where('club_id', app('current_club_id'))` — prevents referencing records from other clubs
- `assertOwnership()` helper in ClubController: `abort_if($model->club_id !== app('current_club_id'), 404)` — first line of every show/update/destroy method
- God controller split: ClubController → CoachManagementController, SwimmerManagementController, GroupManagementController, SessionManagementController, LeaderboardController, ClubDashboardController
- `SubscriptionPlan.is_popular` is exclusive: when setting `true`, clear all other plans for that club first
- `CoachSchedule` upsert pattern: `updateOrCreate(['coach_id', 'day_of_week'], ['slots' => ...])` — slot format is `{time, is_available, max_capacity}` (NOT `start_time`/`end_time`)
- `SubscriptionPlan` reorder endpoint expects `ordered_ids` field (array of plan IDs in desired order)
- Registration approval chain: `registration.coach_id` → `coach_profiles.id` → `user_id` → `groups.coach_user_id` — used to auto-assign swimmers to groups
- User model `'password' => 'hashed'` cast auto-hashes plain passwords on create — no need to call `Hash::make()`
- Migration numbering: sequential from `2024_01_01_000062_` — check last number before adding new migrations
- Route middleware stacking: parent group has `throttle:by_user` (60/min auth, 20/min guests) — do NOT add extra throttle to child groups
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
- Full-page forms pattern: create/edit use `FormPage`/`FormPageActions` (not `Modal`); delete confirmations and pickers stay as `Modal`
- FormPage early return: `if (showModal) return <FormPage>...</FormPage>` before the list view's `return` — state-based, no routing changes
- Pages with string modal state (`modal = 'create'|'edit'|'delete'|'features'`): each create/edit case gets its own FormPage early return, delete stays as Modal

## Key Files
- `backend/app/Traits/BelongsToClub.php` — auto club-scoping trait (global scope + creating hook)
- `backend/app/Http/Controllers/Api/BranchController.php` — reference CRUD controller with manual club-scoping pattern
- `backend/app/Http/Controllers/Api/PublicRegistrationController.php` — public registration endpoint, fires `NewRegistrationSubmitted` broadcast
- `backend/app/Events/NewRegistrationSubmitted.php` — Reverb broadcast event for real-time registration notifications
- `backend/routes/channels.php` — private channel authorization (`club.{clubId}`)
- `backend/database/seeders/DemoSeeder.php` — all seed data (club, users, coaches, swimmers, branches, sports, plans, schedules)
- `backend/routes/api.php` — all API routes, middleware stacking, broadcasting auth
- `backend/bootstrap/app.php` — app config (statefulApi commented out) + structured exception handler
- `backend/config/cors.php` — CORS settings (explicit methods/headers whitelist)
- `backend/app/Http/Middleware/SecurityHeaders.php` — security headers including CSP
- `backend/Dockerfile` — production Docker image (PHP 8.2 FPM Alpine, composer --no-dev, config/route/view cache)
- `docker-compose.yml` — Docker Compose (backend:8000, MySQL:3306, Redis:6379)
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
- `frontend/src/components/ui/FormPage.jsx` — FormPage and FormPageActions components (full-page replacement for Modal on create/edit)
- `backend/app/Services/AuditService.php` — audit logging service (daily log channel, 90-day retention)
- `backend/app/Http/Controllers/Api/ClubBrandingController.php` — public/corporate/club branding endpoints with caching
- `backend/app/Http/Controllers/Api/CoachManagementController.php` — coach CRUD (split from ClubController)
- `backend/app/Http/Controllers/Api/SwimmerManagementController.php` — swimmer CRUD (split from ClubController)
- `backend/app/Http/Controllers/Api/GroupManagementController.php` — group CRUD (split from ClubController)
- `backend/app/Http/Controllers/Api/SessionManagementController.php` — session CRUD (split from ClubController)
- `backend/app/Http/Controllers/Api/LeaderboardController.php` — leaderboard + tiers (split from ClubController)
- `backend/app/Http/Controllers/Api/ClubDashboardController.php` — dashboard + settings (split from ClubController)
- `backend/app/Models/TrainingPlan.php` — extended plan model (duration, difficulty, phases, is_template, coach assignment)
- `backend/app/Models/TrainingPlanAssignment.php` — plan↔group/swimmer assignment with status enum + getAssigneeLabelAttribute accessor
- `backend/app/Models/RecurringSchedule.php` — repeating session definition (BelongsToClub, days_of_week JSON cast, getDaysOfWeekLabelsAttribute accessor)
- `backend/app/Models/ScheduleHoliday.php` — per-schedule holiday exclusion dates
- `backend/app/Services/SessionGeneratorService.php` — idempotent session generator (generate, computeDates, preview methods)
- `backend/app/Http/Controllers/Api/TrainingPlanController.php` — plan CRUD + assign-to-coach (manager) + assign-to-group/swimmer (coach) + swimmer active plan
- `backend/app/Http/Controllers/Api/RecurringScheduleController.php` — schedule CRUD + preview + generate + holiday management (9 endpoints)
- `frontend/src/api/trainingPlans.js` — training plan API module (manager + coach endpoints)
- `frontend/src/api/recurringSchedules.js` — recurring schedule API module (CRUD + preview + generate + holidays)
- `frontend/src/pages/club/TrainingPlansPage.jsx` — dual-role training plan management (manager: plan cards + assign-to-coach; coach: plans + assignments table with progress bars)
- `frontend/src/pages/club/ScheduleBuilderPage.jsx` — two-column schedule builder (form + calendar preview) with inline WeekdayPicker + ScheduleCalendar components
- `frontend/src/pages/corporate/ClubBrandingPage.jsx` — corporate branding editor with live phone preview (colors, assets, domain, social links)
- `backend/app/Services/SwimmerWeeklyReportService.php` — weekly performance report (attendance, evaluations, plan phase, risk signals)
- `backend/app/Http/Controllers/Api/SwimmerReportController.php` — 3 endpoints: swimmerSelf, coachSwimmer, managerSwimmer
- `backend/app/Http/Middleware/SportContext.php` — resolves sportSlug/sport route param or X-Sport-Module header to app('current_sport_module_id')
- `backend/app/Models/SportModule.php` — platform-wide sport catalog (slug, name, icon, color)
- `frontend/src/contexts/SportModuleContext.jsx` — React context for selected sport (sessionStorage persistence)
- `frontend/src/pages/club/SportModuleDashboard.jsx` — sport picker cards with stats, auto-redirect for single sport clubs
- `frontend/src/api/clubSportModules.js` — API module for club sport module endpoints

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
- Never stack `throttle` middleware on nested route groups — parent already has `throttle:by_user`, causes premature 429 errors
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
- CoachSchedule slot validation requires `time`, `is_available`, `max_capacity` — NOT `start_time`/`end_time`
- SubscriptionPlan reorder uses `ordered_ids` key — NOT `order`
- In tests, models using `BelongsToClub` trait need `::withoutGlobalScopes()` when querying across clubs
- jsdom (Vitest) has `window.innerWidth = 0` — Login page renders mobile layout in tests; use exact placeholders `admin@craveclubs.com` and `Enter your password`
- CI requires `coverage: xdebug` and `--coverage --min=60` — tests fail if coverage drops below 60%
- All CRUD create/edit forms use `FormPage` (not `Modal`) — only delete confirmations, member pickers, and assign modals use `Modal`
- `FormPage` import: available from both `'../components/ui/FormPage'` and barrel `'../components/CrudTable'`
- Branding hex colors stored WITHOUT `#` prefix via API validation (`regex:/^[0-9A-Fa-f]{6}$/`) — but existing seeder/DB values may have `#` prefix from before WL-01
- Branding cache key is `branding_{slug}` — must `Cache::forget()` after any club branding update
- `PlatformController::clubDestroy` cascades soft-deletes: users first, then club — preserves data for recovery
- `social_links` column is JSON cast to array — always pass/receive as `{ instagram: "...", twitter: "...", facebook: "..." }`
- RecurringSchedule `days_of_week` is JSON array of ints 0-6 (0=Sunday, 6=Saturday) — NOT day names
- RecurringSchedule period max 366 days — validated in controller, returns 422 if exceeded
- SessionGeneratorService sets session `status: 'Scheduled'` and `type: 'training'` — title comes from schedule name
- TrainingPlanAssignment prevents duplicate active plans per swimmer — checked in controller before creation
- TrainingPlan `phases` field is JSON — each phase: `{ week_start, week_end, focus, exercises[] }`, each exercise: `{ name, sets, reps, notes }`
- Recurring schedule routes under `/club/recurring-schedules` (not `/club/schedules`) — frontend route is `/club/schedules` but API path differs
- WeekdayPicker and ScheduleCalendar are inline components within ScheduleBuilderPage.jsx (not separate files)
- Schedule builder preview is read-only (no DB writes) — generation is a separate POST step that sets status to 'active'
- Weekly report week format: `YYYY-WNN` (e.g. `2025-W12`) — validated with regex, 422 on invalid; defaults to current week if omitted
- Weekly report swimmer endpoint strips `risk_signal` and `risk_reason` from response — only coaches/managers see risk data
- Weekly report `effectiveSwimmers` accessor is computed per session (group ∪ added − excluded) — service filters sessions where swimmer is in effective roster
- Public sports endpoint at both `/sports` and `/public/sports` — same handler, `club.header` middleware resolves club from `X-Club-Slug` header
- Sport module `sport_module_id` is nullable on all entities — never required for backward compat; existing `/club/*` routes continue to work without sport context
- SportContext middleware checks `sportSlug` route param first, then `sport`, then `X-Sport-Module` header, then `sport_module_id` input
