# PHASE report — Group type, capacity & weekly schedule

**Branch:** `staging` · **Date:** 2026-09-17 · **Scope:** backend + manager portal (mobile consumes the new public endpoint)

## What shipped

A group now carries its own fixed weekly template: a **type** (`daily | three_days | two_days | private`), a **capacity**, the **days it meets** (0–6, Sunday first) and a **start/end time**. A coach can never be booked into two groups that share a day and overlap in time. Registrations can name the group the applicant chose, capacity is enforced under a row lock at approval, and a plan/group frequency mismatch is surfaced as a warning rather than a block.

### Backend

| Piece | File |
|---|---|
| Shared vocabulary for plans *and* groups | `app/Enums/TrainingType.php` (`ALL`, `DAY_COUNTS` — daily/private free-form, three_days 3, two_days 2 — `expectedDayCount()`) — `SubscriptionPlan::TRAINING_TYPES` now points at it |
| `groups` columns | migration `000077`: `group_type`, `capacity`, `days_of_week` (json), `start_time`, `end_time` |
| `registrations.group_id` | migration `000078`: nullable FK → groups, `nullOnDelete` |
| Model | `Group`: fillable + casts, `remaining_spots` (uses `swimmers_count`/loaded relation when present, so lists don't N+1), `isFull()`, `days_of_week_labels`; `Registration::group()` |
| Validation | `StoreGroupRequest` (all schedule fields required) / `UpdateGroupRequest` (partial updates judged against the stored group) / shared `GroupDayCount` rule |
| Conflict rule | `app/Services/GroupScheduleConflictService.php` — shared day **and** overlapping time; half-open ranges so 17–18 and 18–19 do not clash; `minutes()` normalises `H:i` vs `H:i:s` |
| Controller | `GroupManagementController`: `scheduleConflict()` guard on `groupStore`, `sportStore`, `groupUpdate` → **422** with `message` + `conflicting_group {id, name, days_of_week, days_of_week_labels, start_time, end_time}` |
| Public API | `GET /api/v1/clubs/{slug}/groups[?sport=slug]` (`PublicController::clubGroups`, throttled with its siblings) → `{data: {three_days: [...], private: [...]}}`; each group: `id, name, group_type, coach_name, coach_user_id, days_of_week, days_of_week_labels, start_time, end_time, capacity, remaining_spots, is_full`. Groups without a schedule are not offered. |
| Registration | `PublicRegistrationController::store` accepts optional `group_id` (club-scoped, not deleted) and answers 422 early when the group is already full |
| Approval | `RegistrationController::approveRegistration`: places the swimmer in `registration.group_id` if set, else the coach's group (old behaviour); the group row is `lockForUpdate()`-ed and seats counted inside the transaction; a full group throws `GroupFullException` → **422** `{group_full: true}` with nothing created; response gains `group_name, group_type, plan_training_type, type_mismatch_warning` |

### Portal

- `club/Groups.jsx`: type select (reuses `subscriptions.types.*` labels), capacity, seven-day pill picker, start/end time. Client-side rule mirrors the backend (day count per type, end after start) and blocks submit with the same wording; a backend 422 (conflict) renders through `apiErrorMessage` with the clashing group's days and window. List gains **Schedule** and **Capacity** columns (`taken/capacity · Full`), the mobile card gains the same rows, and the previously blank swimmers column now shows the count.
- `club/Registrations.jsx`: the approve-success view names the group and shows an amber caution banner when `type_mismatch_warning` is true.
- i18n: `groups.*` (type, capacity, days, times, rules, dayNames 0–6) and `registrations.typeMismatch` added to **both** dictionaries; key trees verified identical.

## Tests — `tests/Feature/GroupScheduleTest.php` (16 tests, 65 assertions)

- daily and private accept any day count (at least one); three_days needs exactly 3; two_days exactly 2; end must follow start
- same coach + same day + non-overlapping → 201; overlapping → 422 with `conflicting_group`, nothing created; different days → 201 whatever the time; different coaches never conflict
- editing a group does not conflict with itself; editing into another group's slot → 422
- `remaining_spots` decreases as members join; `isFull()` flips at capacity
- public endpoint groups by type, exposes `remaining_spots`/`is_full`/labels, hides unscheduled groups, and is scoped to the slug's club
- **capacity under lock:** two pending registrations into a capacity-1 group — first approval seats the swimmer, second gets 422 `group_full`, creates no user/profile, stays pending
- plan `daily` into a `three_days` group → approved **with** `type_mismatch_warning: true`
- no chosen group → falls back to the coach's group (legacy flow intact)

`ManagementCrudTest::manager_can_create_group` updated to the new contract (schedule fields are part of creating a group).

**Full suite:** 375 passed · Pint clean · frontend 22 tests pass · build clean · ESLint on touched files: 0 problems.

## Decisions & deviations from the brief

- **`training_type` already existed** on `subscription_plans` (migration `000075`, merged in #41 while this phase was being scoped), so no second migration; the enum was created and the model constant re-pointed at it.
- **Coach-created groups** (`CoachApiController::groupStore`) still validate name/description only, so a coach can create a group with no schedule. Such groups are simply not offered to applicants and never conflict. Follow-up: add the schedule fields to the coach form.
- **Concurrency test** is a two-sequential-approvals test on a capacity-1 group (SQLite in-memory can't run two transactions truly concurrently); the `lockForUpdate()` + in-transaction count is what makes the real race safe on MySQL.
- Existing groups keep `group_type = daily` (column default) and no schedule until a manager edits them; `UpdateGroupRequest` only enforces the day-count rule when `group_type` or `days_of_week` is being changed, so renaming an old group does not fail.

## Follow-ups

1. Coach portal group form: same fields and rules.
2. Portal registration wizard (Step 7): offer groups from the new endpoint alongside coaches and send `group_id`.
3. Mobile: consume `GET /clubs/{slug}/groups` and send `group_id` on registration.
