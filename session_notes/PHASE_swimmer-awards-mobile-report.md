# PHASE: Swimmer Awards (Man of the Day / Week / Month) — Mobile

**Date:** 2026-09-18 · **Repo:** Fekry87/craveclubs-mobile · **PR:** [#27](https://github.com/Fekry87/craveclubs-mobile/pull/27) (squash-merged to `main`) · **Backend:** craveclub#49 (already on `main`)

## Audit findings (Step 1)

Every file named in the phase was read in full before writing. What the audit changed about the plan:

- The backend's award endpoints are **role-prefixed**, not bare `/awards`: `POST /coach/awards`, `GET /swimmer/awards/pending`, `POST /swimmer/awards/{id}/seen`, `GET /swimmer/awards/recent`. All three list calls answer `{ data: [...] }`. Field names matched the phase exactly (`award_id, swimmer_id, swimmer_name, swimmer_avatar_url, award_type, xp_value, is_mine`), plus `awarded_by` and `awarded_at` which the types carry too.
- All award routes sit behind `feature:leaderboard` (403 without it), so the coach's trophy button is gated on `user.features.leaderboard_enabled`, which the app already uses to show the Leaderboard tab.
- The live event is `.SwimmerAwarded` on a **new** private channel `club.{club_id}.members`, not on `swimmer.{id}`. Its payload has no avatar and no `is_mine`, so the listener refetches the pending queue instead of building a card from the event.
- `sessionSummary.store.ts` owns its own fetch (`triggerRefreshForCompletion`) and refuses to replace a visible popup; the award store follows that shape rather than the phase's sketch (`setQueue`), so the realtime listener and the Home hook can both trigger it.
- There is no toast component in the app; the coach flow confirms with `Alert.alert`. A blocking alert would interrupt attendance-taking, so the row itself confirms the award with a tinted pill (the app's status-pill pattern) and the sheet shows errors inline.
- `WelcomeConfetti` is hard-wired to one global storage key, so only its animation technique was copied; the component and its key are untouched.
- The app never renders `avatar_url` anywhere; leaderboard avatars are `SeaCharacter`. `AwardAvatar` draws the photo when it is an http(s) URL and falls back to that swimmer's `SeaCharacter` (also on load failure).
- The roster in `CoachSessionAttendanceScreen` is reachable from the Schedule tab's day sheet ("Record attendance" / "View attendance"); the Sessions tab's detail page has a different, read-only roster (`SwimmerRosterItem`) that this phase did not touch.

## What shipped

| Area | Files |
|---|---|
| API | `src/api/endpoints.ts` (`SWIMMER.AWARDS_PENDING / AWARD_SEEN / AWARDS_RECENT`, `COACH.AWARDS`), `src/api/services/award.service.ts` (`getPending`, `markSeen`, `getRecent`), `coachService.giveAward(swimmerId, type)` |
| Types | `models.types.ts`: `AwardType`, `SwimmerAwardInterface`, `PendingAwardInterface`, `XpBreakdownInterface.award_xp` |
| Store / hook | `src/store/awardCelebration.store.ts` (`queue`, `current`, `fetchPending`, `dismissCurrent`, `reset` — reset on logout and account deletion like every other store), `src/hooks/useAwardCelebrationDetector.ts` (`checkForAwards`) |
| Coach | `components/features/coach/AwardSheet/` (FormSheet + three `SelectCard`s, "Give award", inline 422/403/generic error), trophy button + "awarded" pill per row in `CoachSessionAttendanceScreen` |
| Swimmer | `components/features/notifications/AwardCelebrationCard/` rendered from `HomeScreen`; `checkForAwards()` called right after `checkForCompletions()` in both `fetchDashboard` and `silentPoll` |
| Realtime | `useRealtime` joins `private-club.{club_id}.members`, `.SwimmerAwarded` → `fetchPending()`; leaves the channel on cleanup |
| Leaderboard | 4th `XpStat` "Awards" (`trophy-fill`, `warningDark`/`warningDim`), `components/features/leaderboard/RecentAwards/` + `AwardAvatar/`, fetched in the same `Promise.all` as the leaderboard with its own `.catch(() => [])` |
| Shared | `src/utils/awards.ts` (labels, short labels, icons, hints, `firstNameOf`, `isRenderableAvatar`) |

### Behaviour notes
- **Popup sequencing**: `AwardCelebrationCard` is `visible={current !== null && !summaryVisible}`. When a session summary and an award are both pending, the summary shows first and the award appears once it is dismissed; they never overlap.
- **Dismiss**: "Bravo 👏" advances the queue locally first, then posts `seen`. If the post fails the same award simply returns on the next open (the server is the source of truth). Backdrop tap and Android back do not dismiss.
- **Queue**: `fetchPending` never replaces a card that is on screen; the card shows "N more to celebrate" when more are queued, and the entry animation re-runs per award (keyed on `award_id`) so each winner gets their own moment.
- **Coach gate**: the trophy button is hidden when `leaderboard_enabled` is false; a 403 from the server reads "Awards are not enabled for this club." and a 422 shows the server's own message ("You can only award swimmers in your own groups.").

## Wording decision (flagged, not guessed silently)
The phase asked whether "Man of the …" should become gender-neutral. The award's **name** stays "Man of the Day / Week / Month" because that is what the portal, the club's Leaderboard settings and the backend call it, and renaming only the app would make the same award read differently in the two places. The copy *around* the name is built from the swimmer's name and reads the same for everyone ("Ali, that's you" · "Nour Ibrahim — give them a hand"). If the product name should change, it is a one-place edit in `utils/awards.ts` plus the portal's `awards.*` i18n keys.

## Live broadcast listener
Added (Step 6 not skipped). `useRealtime` already had the pattern for `swimmer.{id}`; the club channel was one more `echo.private(...)` plus a `leave` in cleanup. Not exercised end-to-end here because the local environment has no Reverb server; the on-focus / poll path is what was verified.

## Verification
- `npx tsc --noEmit` → 0 errors.
- iOS simulator (iPhone 17, Expo Go) against the local sqlite API. A scratch copy of the app seeded locally minted Sanctum tokens through a verify-only `EXPO_PUBLIC_DEV_TOKEN` hook in `restoreSession`, so no password was typed anywhere; the real app folder was never touched.
  - **Coach** (user 3, Academy Elite): Schedule → today's session → Record attendance → Start session → trophy button on each row → sheet → "Man of the Week" → Give award → row shows the "Man of the Week" pill. DB row: `swimmer_id 1, week, 150 XP, awarded_by 3`. A second award (Nour, day, 50 XP) was posted with the same coach token.
  - **Swimmer** (user 5, Ali Hassan): Home showed "You're Man of the Week!" with "1 more to celebrate" and +150 XP; Bravo advanced to "Man of the Day!" for Nour Ibrahim; both `swimmer_award_views` rows were written and `pending` answered `[]`. Leaderboard: Awards pill = 150 (`my_xp.award_xp`), Recent Awards listed both rows newest first with Day/Week pills and +XP.
- Cleanup: awards, views and verification tokens deleted; session 7 restored to its original date/status; `RecalculateSwimmerXp` re-run so stored `xp_points` are back to 85 / 0; Metro and the local API stopped.

## Definition of done
- [x] Coach can give an award from the attendance roster, matching existing UI patterns
- [x] `awardCelebration.store.ts` mirrors `sessionSummary.store.ts`
- [x] `useAwardCelebrationDetector` mirrors `useSessionCompletionDetector`'s trigger pattern
- [x] `AwardCelebrationCard` shows on Home for any unseen award, queued if multiple
- [x] "Bravo 👏" calls the seen endpoint and advances the queue
- [x] Confetti present without touching `WelcomeConfetti`'s one-time behaviour
- [x] Live broadcast listener added
- [x] Leaderboard 4th `award_xp` pill
- [x] Leaderboard "Recent Awards" hall of fame
- [x] `npx tsc --noEmit` passes with 0 errors
- [x] On `main` (PR #27 squash-merged; local folder fast-forwarded)

## Follow-ups (not in scope)
- The coach's session **detail** page (Sessions tab) has its own read-only roster without the trophy button; awards are given from the attendance screen only, as specified.
- Reverb is not running locally, so the `.SwimmerAwarded` path should be watched once in production the first time a coach gives an award.
