# PHASE: Swimmer Awards (Man of the Day / Week / Month) — Backend + Portal

**Date:** 2026-09-17 · **Branch:** `staging` · **Status:** complete, verified locally (394 backend tests, 22 frontend tests, Pint clean, Vite build clean)

## What shipped

### Data
| Migration | Change |
|---|---|
| `000079_add_award_xp_to_leaderboard_settings_table` | `award_day_xp` (50) · `award_week_xp` (150) · `award_month_xp` (400) |
| `000080_create_swimmer_awards_table` | Award log: `club_id`, `swimmer_id`, `award_type` (day/week/month), `xp_value` snapshot, `awarded_by`; indexes on `(club_id, swimmer_id)` and `(club_id, created_at)`. No uniqueness — several swimmers can hold the same title in the same period. |
| `000081_create_swimmer_award_views_table` | Per-viewer dismissal of the celebration card; unique `(award_id, viewer_user_id)`. |

`xp_value` is captured at award time. Editing point values later never rewrites historical awards (pinned by `test_award_xp_is_a_snapshot_that_survives_later_setting_changes`).

### Models
- `SwimmerAward` (`BelongsToClub`, `TYPES` const, `swimmer()`, `awardedBy()`, `views()`).
- `SwimmerAwardView` (no timestamps, `viewed_at`).
- `LeaderboardSetting`: new fillable/casts + `getAwardXpFor(type)`. Also gained `$attributes` defaults mirroring the migration — `firstOrCreate` returned a model **without** DB defaults, so a brand-new club read `null` for every XP value until reloaded. This was a latent bug affecting the existing rating/attendance fields too.

### XP integration (`award_xp`)
- `XpCalculationService::computeForSwimmer()` — one `SUM(xp_value)` query, new `award_xp` key (always present, `0` when none), folded into `total_xp`. 5-minute cache unchanged.
- `XpCalculationService::getTopSwimmers()` — one batched `whereIn … GROUP BY swimmer_id` query (4 batch queries total, still no N+1).
- `SwimmerApiController::computeSwimmerXp()` — the controller keeps its own copy of the calculation for the mobile profile/leaderboard; it now returns `award_xp` too, so the mobile `XpStat` row can show the 4th pill.
- `RecalculateSwimmerXp` is dispatched after every award so the stored `xp_points` (rank source) stays in sync.

### Endpoints
| Method | Path | Who | Notes |
|---|---|---|---|
| `POST` | `/club/awards` | CLUB_MANAGER (`feature:leaderboard`) | Any swimmer in the club |
| `POST` | `/coach/awards` | COACH (`feature:coach_portal` + `feature:leaderboard`) | Only swimmers in groups where `coach_user_id === user.id`, else 422 on `swimmer_id` |
| `GET` | `/club/awards/recent`, `/coach/awards/recent`, `/swimmer/awards/recent` | all roles | Club-wide hall of fame, newest first, last 30, includes seen awards |
| `GET` | `/swimmer/awards/pending` | SWIMMER | Unseen by this viewer, oldest first, capped at 10, `is_mine` flag |
| `POST` | `/swimmer/awards/{id}/seen` | SWIMMER | Idempotent; foreign-club ids are 404 |
| `PUT` | `/club/leaderboard/settings` | CLUB_MANAGER only (unchanged middleware) | Now accepts `award_day_xp` / `award_week_xp` / `award_month_xp` (`sometimes`, 0–9999) |

Body for giving: `{ "swimmer_id": 12, "award_type": "week" }` → `201 { message, award: { award_id, swimmer_id, swimmer_name, swimmer_avatar_url, award_type, xp_value, awarded_by, awarded_at } }`.

The award endpoints live in one controller, `SwimmerAwardController`, rather than being spread across `SwimmerApiController` / `LeaderboardController`, so the give/celebrate/feed logic and its `present()` shape stay in a single place.

### Real-time
`App\Events\SwimmerAwarded` mirrors `SessionStarted` (Dispatchable / InteractsWithSockets / SerializesModels, `broadcastAs`, `broadcastWith`). It broadcasts on a **new** private channel `club.{clubId}.members`, authorised in `routes/channels.php` for any user whose `club_id` matches (the existing `club.{id}` channel is manager-only and `club.{id}.coach` excludes swimmers). Payload: `award_id, swimmer_id, swimmer_name, award_type, xp_value, awarded_at`. Wrapped in try/catch like the session events, so Reverb being down never fails the award.

### Portal
- `frontend/src/components/AwardModal.jsx` — shared `AwardModal` (radio-style picker for Day/Week/Month, `apiErrorMessage` banner, disabled-while-saving) and `AwardButton`.
- Manager `club/Swimmers.jsx` — "Award" action on every swimmer card, posts to `/club/awards`, success toast "X is now Man of the Week (+150 XP)".
- Coach `coach/SwimmerDetail.jsx` — "Give Award" next to "Rate & Comment", posts to `/coach/awards`.
- Manager `club/Leaderboard.jsx` — new "Award XP" card with the three point inputs, sent on the existing Save XP Rules call; formula preview now reads `+ Award XP`.
- i18n: new `awards.*` tree in both `en` and `ar` (key trees verified identical).

### Tests — `tests/Feature/SwimmerAwardTest.php` (19 tests)
Manager awards any club swimmer · coach awards own-group swimmer · coach blocked outside own groups (422, nothing written) · cross-club swimmer rejected · invalid type rejected · swimmers cannot give awards (403) · XP matches configured per-type value · snapshot survives setting changes · `award_xp` present and zero without awards · award XP ranks in `getTopSwimmers()` · award XP reaches manager overview and swimmer leaderboard · same title to several swimmers · broadcast on `private-club.{id}.members` with the right payload · pending until that viewer marks seen (other viewers unaffected, double-dismiss harmless) · pending/recent/seen isolated per club · recent is permanent and newest-first for all roles · manager can set point values · coach gets 403 on settings · defaults 50/150/400.

Whole suite: **394 passed** (was 375).

## Browser verification (worktree dev servers, demo club)
- Manager → Swimmers → Award → Man of the Week → `POST /club/awards` 201, toast shown, Leaderboard Settings overview "Highest XP 150".
- Manager → Leaderboard Settings → set Man of the Week to 175 → `PUT` 200, value survives reload.
- Coach → swimmer in own group → Give Award → 201, toast "Ali Hassan is now Man of the Day (+50 XP)". Same token against a Rising Stars swimmer → 422 "You can only award swimmers in your own groups."
- Swimmer token: pending listed both awards with `is_mine` correct; `seen` removed only that one; recent kept both newest-first; `/swimmer/leaderboard` `my_xp.award_xp = 50`.

## Notes for the mobile app
- Poll `GET /swimmer/awards/pending` on app open, show one card per item, call `POST /swimmer/awards/{id}/seen` on dismiss.
- Subscribe to `private-club.{club_id}.members` and listen for `.SwimmerAwarded` for the live version.
- `GET /swimmer/awards/recent` feeds the hall-of-fame section; `my_xp.award_xp` is the 4th `XpStat` pill.
- `swimmer_avatar_url` is the swimmer user's `avatar` (null when the swimmer has no login or no avatar — `swimmer_profiles` has no avatar column).

## Follow-ups (not in scope)
- Portal has no hall-of-fame view yet (`/club/awards/recent` and `/coach/awards/recent` exist for it).
- Coach `Swimmers.jsx` list has no per-row award button; the action is on the detail page.
