# Pilot Readiness — KSA Swimming Academy (first real club)

_Session: 2026-09-04 · branch `staging`_

## Decisions (from the grilling sessions)

| Question | Decision |
|---|---|
| What "next" serves | **Go live with one real club** — product is not the bottleneck, a real user is |
| Who | A warm-path **swimming club in Saudi Arabia (KSA)**; landing it is the actual task |
| Commercial terms | **Free 4-week pilot** → feedback + testimonial + one referral |
| Surface | **Portal-first** (manager + coach on web); mobile store launch is fast-follow |
| Sequencing | **Set the meeting first**, pre-build the branded demo club 2–3 days before it |
| Kafka | **No.** Redis queue + Reverb + scheduler already cover async/realtime; Kafka adds ops burden for zero user-visible gain |
| System design | Already over-built for a pilot (stateless, Redis, read-replica ready, backups, Sentry). Only ceiling: single-instance Reverb — irrelevant at this scale |
| "Publish" bar | **Safe to onboard the pilot club** on the current Railway deployment |
| PDPL (Saudi data law) | **Disclose and defer**: record consent at registration + privacy notice; be transparent that data is hosted outside KSA. Data residency becomes a real decision only if an academy makes it a condition |
| Security | Fix anything CRITICAL/HIGH the readiness check found; park the rest |

## Fixed this session

### Arabic / KSA demo-readiness
- Currency `EGP` → `SAR` everywhere via `common.currency` (`ر.س` in Arabic) — wizard Step6/Step8, Subscription Plans page (which previously showed no currency at all)
- Phone placeholders `+20 …` → `+966 5x xxx xxxx` via `forms.phonePlaceholder` (wizard Step1, club Branches, corporate + club Branding)
- Dates follow the active language via `frontend/src/lib/dates.js` (Dashboard session cards, Sessions, Training Plans, Registrations) — Gregorian + Latin digits enforced for Arabic
- Four manager pages that leaked English in Arabic mode now fully use `t()`: **Analytics, Registrations, Subscription Plans, Club Branding** (+ Sport Module empty state)
- RTL: table headers `textAlign:'start'`, toggle knobs + search icon use `insetInlineStart` so they mirror correctly

### PDPL
- `registrations.consent_given_at` (migration 000071); API accepts optional `consent_given`; Step8 requires a consent checkbox and shows a privacy notice (bilingual)
- 2 new backend tests (consent recorded / nullable for older clients)

### Security (from the publish-readiness check)
- **CRITICAL** `mtdowling/jmespath.php` code-injection CVE → upgraded to 2.9.2
- **HIGH** 41 advisories → `composer update` of Laravel (12.50 → 12.69), Symfony, Guzzle, commonmark → `composer audit` now clean
- **HIGH** HSTS never fired behind Railway's proxy → `trustProxies()` added in `bootstrap/app.php`
- **MEDIUM** server fingerprinting → `expose_php = Off` + nginx `server_tokens off` in the Dockerfile

Verified: backend 244/244 tests, Pint clean; production health green; Telescope hidden; metrics endpoint locked; no secrets in git history.

## Still open (deliberately)

- **Pre-build the branded demo club** — waits for the meeting date + the club's name/logo/colors
- **Mobile app**: send `consent_given: true` from the registration screen (backend already accepts it); TestFlight/internal build only if the pilot needs swimmers on phones
- **`npm audit`** (retry succeeded): 25 vulns — 2 critical (vitest, dev-only), 17 high incl. production-bundle `axios`, `react-router` open-redirect, `ws` via laravel-echo — all `npm audit fix`-able; applied in this session (see commit)
- Remaining wizard steps (1–7) still have some hardcoded English labels; the manager pages used in a live demo are clean
- `api.craveclubs.com` custom domain (NXDOMAIN) — configure in Railway when ready
- Frontend ESLint has pre-existing `react-hooks` errors (not in CI) — untouched
