# PHASE: Arabic + English i18n — CraveClubs Portal

## Status: COMPLETE

**Date:** 2026-03-20
**Build:** Passes (1.26s, 225 modules, 72 chunks)
**Tests:** 22/22 passing (5 test files)

---

## What Was Done

### Step 1: Dependencies Installed
- `i18next` — core translation framework
- `react-i18next` — React bindings
- `i18next-browser-languagedetector` — auto-detect language from localStorage/navigator

### Step 2: Translation Files Created
- `frontend/src/locales/en/common.json` — ~200 English keys organized into: nav, sections, roles, actions, status, auth, dashboard, swimmers, coaches, groups, sessions, registrations, subscriptions, analytics, leaderboard, branches, branding, settings, corporate, club, notifications, pageDescriptions, empty, loading, errors, language, time
- `frontend/src/locales/ar/common.json` — complete Arabic mirror of all English keys

### Step 3: i18n Configuration
- `frontend/src/i18n/index.js` — i18next init with LanguageDetector, fallbackLng: 'en', localStorage persistence via `craveclubs_lang` key

### Step 4: RTL Direction Provider
- `frontend/src/providers/DirectionProvider.jsx` — sets `document.documentElement.dir`, `document.documentElement.lang`, and body font family based on language. Provides `useDirection()` hook returning `{ direction, isRtl }`

### Step 5: Language Switcher
- `frontend/src/components/LanguageSwitcher.jsx` — globe icon toggle button with compact (icon-only) and full (icon + text) variants. Shows "EN" when Arabic active, "ع" when English active

### Step 6: Entry Points Updated
- `frontend/index.html` — added `dir="ltr"` to html tag, IBM Plex Sans Arabic font link
- `frontend/src/main.jsx` — imports `./i18n`, wraps App in `<DirectionProvider>`
- `frontend/src/App.jsx` — PageLoader reads localStorage for loading text (pre-i18n init)

### Step 7: Components & Pages Updated

**Core Components:**
- `Layout.jsx` — nav labels (allNavItems + CLUB_MANAGER_NAV) use translation keys, section headers translated, NotificationBell fully translated, timeAgo localized, LanguageSwitcher added to header bar, brandTagline translated, sign out button translated
- `PageHeader.jsx` — page descriptions use `t('pageDescriptions.X')` with fallback
- `DataTable.jsx` — empty state, edit/delete buttons translated

**Pages Updated (50+ files):**

| Section | Files | Strings Translated |
|---------|-------|--------------------|
| Login | Login.jsx, ClubLogin.jsx | Auth forms, demo accounts, error messages |
| Club Manager | Dashboard, Swimmers, Coaches, Groups, Sessions, Settings, ManagerHomePage, Registrations, SubscriptionPlansPage, Plans, Skills, TrainingPlansPage, ScheduleBuilderPage, AnalyticsDashboard, CoachPerformancePage, CoachDetailPage, ClubBrandingPage, SessionDetailPage, Leaderboard, BranchesPage, BranchDetail, SportModuleDashboard | All CRUD labels, form fields, empty states, loading states, action buttons |
| Coach | Dashboard, Sessions, Groups, Swimmers, Settings, SessionLive, SwimmerDetail | Session management, evaluation forms, attendance |
| Swimmer | Dashboard, Sessions, Evaluations, Leaderboard | Personal dashboard, session views |
| Corporate | Dashboard, Clubs, Settings, SportModulesPage, ClubDetail, ClubBrandingPage, ClubSportModulesPanel | Platform admin views |
| Registration | Steps 1-8, WizardLayout, WizardProgressBar, RegistrationSuccess | Full wizard flow |
| Public | ClubPage | Public club landing |
| Platform (Legacy) | Dashboard, Clubs | Backward-compat views |

### Step 8: RTL Layout Fixes
Added to `index.css`:
- Arabic font family (`IBM Plex Sans Arabic`) for body and Outfit-styled elements in RTL mode
- Sidebar border flip (right→left)
- Nav link direction and hover transform flip
- Active nav indicator repositioned to right edge
- `.rtl-flip` utility class for directional icons
- Table header text alignment (right-aligned in RTL)
- Notification dropdown position flip
- Table row hover border flip

### Step 9: Test Fix
- Added `import '../i18n'` to `frontend/src/test/setup.js` so i18n loads in test environment
- All 22 tests pass

---

## Architecture Decisions

1. **No MUI/Emotion**: Spec assumed MUI v7 + Emotion cache + stylis-plugin-rtl. Adapted to plain CSS since codebase uses custom CSS design system
2. **Simplified DirectionProvider**: Sets `document.documentElement.dir` and font directly instead of MUI ThemeProvider
3. **Static nav objects with translation keys**: Nav items store key strings (e.g., `'nav.dashboard'`) resolved via `t()` at render time
4. **localStorage for PageLoader**: Reads `craveclubs_lang` directly since i18n may not be initialized when Suspense fallback renders
5. **Fallback language**: English (`en`) is the fallback; Arabic detection via `navigator.language` or explicit user toggle

## Files Created
- `frontend/src/locales/en/common.json`
- `frontend/src/locales/ar/common.json`
- `frontend/src/i18n/index.js`
- `frontend/src/providers/DirectionProvider.jsx`
- `frontend/src/components/LanguageSwitcher.jsx`

## Files Modified
- `frontend/index.html`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/index.css`
- `frontend/src/test/setup.js`
- `frontend/src/components/Layout.jsx`
- `frontend/src/components/ui/PageHeader.jsx`
- `frontend/src/components/ui/DataTable.jsx`
- 50+ page files across all role sections

## Known Limitations
- Some deeply nested page-specific strings (e.g., analytics chart labels, branding color picker labels, complex modal text) remain as English hardcoded strings — they can be extracted to translation keys incrementally
- RTL CSS uses class-based selectors which may not affect all inline-styled elements — directional inline styles (marginLeft, paddingRight, etc.) would need logical property conversion for full RTL support
- Font family override in RTL mode targets body and common classes but inline `fontFamily` styles in JSX take precedence — these would need per-component updates for pixel-perfect Arabic typography
