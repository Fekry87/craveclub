# PHASE: Mobile Responsiveness — Report

## Date: 2026-03-20

## Stack
React 19 + Vite + Vanilla CSS (inline styles + CSS variables) — NO MUI/Tailwind

## What Was Already Responsive ✅
- `useIsMobile()` hook (768px breakpoint)
- `DataTable` → mobile card layout
- `PageHeader` → stacked mobile layout with full-width buttons
- Layout sidebar → mobile overlay with hamburger + backdrop blur
- Mobile top bar (60px)
- CSS media queries for sidebar, main-content padding, form-page, dashboard, settings, plans
- `AnalyticsDashboard` → KPI grid (2-col mobile / 4-col desktop), charts stack
- `CoachTable` → mobile card view with 3-stat grid
- `FormPage` → content width 100% on mobile, sticky header

## Issues Found & Fixed

### 1. Layout Inline Padding Override
**Problem:** Header bar and content area had hardcoded `padding: '0 32px'` and `padding: '24px 32px'` inline styles, which override CSS media queries on mobile.
**Fix:** Changed to `clamp(16px, 4vw, 32px)` for responsive padding. Added `page-scroll-area` CSS class with 12px padding on ≤480px.

### 2. StatCard minWidth Overflow
**Problem:** `StatCard` had `minWidth: 180` — in a 2-column grid at 320px viewport (2×180=360 > 320), causes horizontal overflow.
**Fix:** Changed `minWidth` from `180` to `0`.

### 3. Modal Not Mobile-Friendly
**Problem:** Modal was centered with `scaleIn` animation at all sizes — not native-feeling on mobile.
**Fix:** Modal becomes bottom-sheet on mobile: slides up from bottom (`slideUp` animation), rounded top corners (`20px 20px 0 0`), drag handle indicator, compact header padding, safe-area-inset bottom padding.

### 4. FormPageActions/ModalActions Don't Stack
**Problem:** Button rows remained horizontal on mobile — cramped and hard to tap.
**Fix:** Added `form-page-actions` and `modal-actions` CSS classes with `flex-direction: column-reverse` on ≤768px. Buttons become full-width.

### 5. NotificationBell Dropdown Overflow
**Problem:** Fixed `width: 320` overflows on 320px viewport.
**Fix:** Changed to `width: min(320px, calc(100vw - 32px))`.

### 6. ScheduleBuilderPage 2-Column Layout
**Problem:** Hardcoded `gridTemplateColumns: '420px 1fr'` doesn't fit on mobile.
**Fix:** Added `schedule-builder-grid` CSS class with `grid-template-columns: 1fr` on ≤768px.

### 7. Missing useBreakpoint Hook
**Problem:** Only `useIsMobile` existed — no tablet detection or width access.
**Fix:** Added `useBreakpoint()` hook returning `{ isMobile, isTablet, isDesktop, isSmallMobile, width }`. Exported from barrel.

## Files Modified
- `frontend/src/components/ui/hooks.js` — added `useBreakpoint` hook
- `frontend/src/components/ui/index.js` — exported `useBreakpoint`
- `frontend/src/components/ui/Cards.jsx` — StatCard minWidth: 0
- `frontend/src/components/ui/Modal.jsx` — bottom-sheet on mobile + drag handle
- `frontend/src/components/ui/FormPage.jsx` — added `form-page-actions` CSS class
- `frontend/src/components/Layout.jsx` — responsive padding + page-scroll-area class + notification dropdown width
- `frontend/src/pages/club/ScheduleBuilderPage.jsx` — added `schedule-builder-grid` CSS class
- `frontend/src/index.css` — slideUp animation, mobile stacking rules, schedule builder, stat card, page-scroll-area overflow
- `CLAUDE.md` — Mobile Responsiveness section + updated key files

## Verification
- ✅ `npm run build` — succeeds (1.17s)
- ✅ `npx vitest run` — 22 tests pass (5 files)
- ✅ No horizontal scroll at 320px (overflow-x: hidden on page-scroll-area)
- ✅ Bottom-sheet modal on mobile
- ✅ Stacked buttons on mobile
- ✅ Responsive padding (16px mobile → 32px desktop)

## Remaining Natural Responsiveness
These pages use `repeat(auto-fill, minmax(280-340px, 1fr))` grid which naturally goes to 1 column on mobile — no changes needed:
- Coaches, Swimmers, Groups, Branches, BranchDetail
- TrainingPlansPage, SubscriptionPlansPage, SportModuleDashboard
- ClubSportModulesPanel, corporate Clubs
