# Doctor Tracker — Implementation TODO

**Project:** Doctor Tracker administrative portal
**Plan:** [project-plan.md](./project-plan.md)
**Sources of truth:** `recuirements.txt` (functionality), Figma (visuals), `.cursorrules` (development rules)
**Status:** Complete — all phases implemented and verified against the production build.

**Status legend:** `[ ]` pending · `[~]` in progress · `[x]` complete · `[!]` blocked

---

## Backend simplification — single-file index.js (complete)

- [x] Add `nodemon` dev dependency to the server workspace
- [x] Configure `server/package.json`: `nodemon index.js` + env loading
- [x] Create `server/index.js` sections: env, helpers, DB access, indexes
- [x] Port doctors endpoints into `server/index.js`
- [x] Port patients endpoints into `server/index.js`
- [x] Port dashboard endpoints and range logic into `server/index.js`
- [x] Add auth middleware, app assembly, error handling, health check
- [x] Add CLI commands: default API start, `indexes`, `seed`
- [x] Delete `server/src/**` and `server/scripts/**`
- [x] Delete `compose.yaml`
- [x] Update `README.md` — no Docker, single-file backend, nodemon dev flow
- [x] Update `.cursorrules` — single-file backend, no Docker, nodemon
- [x] Run `npm run lint`
- [x] Run `npm run format:check`
- [x] Run `npm run build`
- [x] Run `npm run indexes`
- [x] Run `npm run dev` and verify localhost:3000 + API on 4000 + `/health`
- [x] Verify unauthenticated `/api/v1` returns `401`
- [x] Search for stale references to deleted files, MVC paths, `node --watch`, and Docker

---

## Public site and registration (complete)

- [x] Add a public route group `(public)` serving `/` and `/register`
- [x] Keep `/` public with a professional home page and a Home/Login navbar
- [x] Swap Login for Dashboard in the public navbar when a session is active
- [x] Add a doctor/patient registration toggle with accessible tab behavior
- [x] Reuse shared Zod doctor and patient schemas for public forms and API validation
- [x] Add public read-only doctor options for the patient form
- [x] Add `POST /api/v1/public/registrations/doctors` and `/patients` before `requireAuth`
- [x] Store public submissions in `registration_requests` with `status: "pending"`
- [x] Add public write rate limiting (10 requests per 10 minutes per IP)
- [x] Add `registration_requests` indexes, including the unique pending doctor email guard
- [x] Add the success panel, inline validation, loading and error states
- [x] Update `README.md` and `.cursorrules` for the public flow
- [x] Verify anonymous public routing and that protected API routes still return `401`
- [x] Verify API doctor/patient registration, duplicate email `409`, and unknown doctor `404`
- [x] Browser-verify desktop/mobile home, navbar, tab toggle, validation, and doctor submission
- [x] Browser-verify patient submission end-to-end and a 375px layout with zero horizontal overflow
- [x] Run `npm run lint`, `npm run format:check`, and `npm run build` — all pass
- [x] Remove temporary smoke-test registration documents; a later user-authorized request is pending separately

---

## Bug fixes

- [x] Fix white-page redirect loop caused by a stale Better Auth cookie (`client/proxy.js`)

---

## Phase A — Repository foundation

- [x] Create npm workspaces root (`client`, `server`, `packages/*`)
- [x] Add root `package.json` scripts (`dev`, `build`, `lint`, `format`, `seed`, `indexes`)
- [x] Add dev preflight (`scripts/dev-preflight.mjs`) and `predev` hook
- [x] Add `.gitignore`
- [x] Add Prettier config and ignore file
- [x] Add ESLint flat config (`eslint.config.mjs`, JavaScript only)
- [x] Write `project-plan.md`
- [x] Add root `.env.example`
- [x] Add `compose.yaml` for local MongoDB 8
- [x] Write `README.md`
- [x] Scaffold `client` workspace (Next.js 16, App Router, JavaScript)
- [x] Scaffold `server` workspace (Express 5, ESM)
- [x] Scaffold `packages/validation`
- [x] Scaffold `packages/auth`
- [x] Install all dependencies
- [x] Verify Node/npm versions and workspace resolution

## Phase B — Shared packages

### `packages/validation`

- [x] Common primitives (trimmed strings, phone, object id, pagination, sort/order)
- [x] Doctor create schema
- [x] Doctor update schema
- [x] Doctor list query schema
- [x] Patient create schema
- [x] Patient update schema
- [x] Patient list query schema
- [x] Dashboard range schema
- [x] Auth login schema
- [x] Safe parse helpers and field-level error mapping
- [x] Reject unknown keys and Mongo operators
- [x] Date-order refinement returns a boolean (fixed validation regression)

### `packages/auth`

- [x] Shared environment validation
- [x] Trim env values at runtime so stray whitespace cannot break sessions
- [x] Single `MongoClient` singleton (dev hot-reload safe)
- [x] Better Auth instance with MongoDB adapter
- [x] Email/password provider configuration
- [x] Trusted origins and secure cookie settings
- [x] Server session helper for Express
- [x] Export configuration for the Next.js auth route handler
- [x] Confirm no server secrets reach client bundles
- [x] Secure cookies gated on an HTTPS `BETTER_AUTH_URL` (local HTTP fixed)

## Phase C — Backend API

### Foundation

- [x] Fail-fast environment validation (originally `server/src/config/env.js`, now in `packages/auth` + `server/index.js`)
- [x] Shared Mongo client reused for application collections (now via `getDb()` in `server/index.js`)
- [x] Idempotent index creation (now `ensureIndexes()` in `server/index.js`)
- [x] Express app assembly and entry point (now the single-file `server/index.js`)
- [x] Helmet, CORS allowlist, JSON limits, `x-powered-by` disabled
- [x] Global and write-specific rate limiting
- [x] Async handler, `ApiError`, response envelope, pagination helpers
- [x] 404 and centralized error handler (no stack traces / PII leaks)
- [x] `GET /health` (unauthenticated)

### Auth middleware

- [x] `requireAuth` using Better Auth session + forwarded cookies
- [x] Identity only from session, never request body
- [x] Apply to every `/api/v1` route

### Doctors module

- [x] `GET /api/v1/doctors` with search, filters, sort, pagination, patient counts
- [x] `POST /api/v1/doctors` with duplicate email → 409
- [x] `GET /api/v1/doctors/options` (registered before `/:id`)
- [x] `GET /api/v1/doctors/:id` with patient count
- [x] `PATCH /api/v1/doctors/:id`
- [x] `GET /api/v1/doctors/:id/patients`
- [x] `$facet` page + total, `$lookup` counts, projections only
- [x] Distinct filter options returned in list meta
- [x] Date range filters on `createdAt` (UTC, inclusive)
- [x] Add administrator-only doctor deletion, blocked while patients remain assigned

### Patients module

- [x] `GET /api/v1/patients` with search, filters, sort, pagination
- [x] `POST /api/v1/patients` with doctor existence check → 404
- [x] `GET /api/v1/patients/:id`
- [x] `PATCH /api/v1/patients/:id`
- [x] `DELETE /api/v1/patients/:id` → 204
- [x] Patient rows include minimal doctor summary via `$lookup`
- [x] Condition and doctor filter options in list meta

### Dashboard module

- [x] `GET /api/v1/dashboard/summary`
- [x] `GET /api/v1/dashboard/patients-per-doctor` (single pipeline, top 10)
- [x] `GET /api/v1/dashboard/patients-over-time` (7d / 30d / 90d / 12m)
- [x] Previous-period comparison
- [x] UTC bucketing and zero-filled buckets
- [x] No N+1 queries

### Seed and verification

- [x] Seed admin through Better Auth server API (no manual hashing)
- [x] Seed 24 doctors / 384 patients with Figma-like distribution
- [x] Relative dates so dashboard ranges stay populated
- [x] `npm run seed` and `npm run indexes` work
- [x] API smoke tests: health, auth required, CRUD, pagination, filters, errors

## Phase D — Frontend foundation

- [x] Next.js client configuration (`next.config.mjs`, rewrites, `jsconfig.json`)
- [x] Tailwind CSS 4 + daisyUI 5 setup
- [x] Custom daisyUI theme with Figma design tokens
- [x] Inter font, metadata, root layout
- [x] Providers: TanStack Query, Auth, Toast
- [x] `api-client.js` with envelope parsing, `ApiError`, abort support
- [x] `auth-client.js` with a same-origin Better Auth React client
- [x] `query-keys.js`
- [x] `formatters.js` (dates, numbers, initials, age, gender, display references)
- [x] `proxy.js` optimistic cookie redirect (Next.js 16 convention)
- [x] Better Auth route handler at `app/api/auth/[...all]/route.js`
- [x] Protected `(dashboard)/layout.js` server-side session guard
- [x] `not-found.js` and `error.js`

## Phase E — Shared UI and layout

- [x] Design-token audit against Figma (colors, type, radii, spacing)
- [x] `AppShell`
- [x] `Sidebar` with live counts and active state
- [x] `MobileHeader`
- [x] `MobileBottomNav` (Dashboard / Doctors / Patients)
- [x] `TabletDrawer`
- [x] `UserMenu` with sign-out
- [x] `PageHeader`
- [x] `StatCard`
- [x] `EmptyState` / `ErrorState`
- [x] Table, card and chart skeletons
- [x] `ConfirmDialog` (native `<dialog>`, focus trap, Esc, focus return)
- [x] `Pagination`
- [x] `FilterBar`, `SearchInput`, `DateRangeFilter`, `FilterSelect`
- [x] `Sheet` (right-side desktop, full-screen mobile)
- [x] `FormField`, `Combobox`, `Badge`, `Avatar`
- [x] Toast provider + `useToast`
- [x] Motion with `useReducedMotion`
- [x] Accessible charts (summary/table fallback)
- [x] Pagination labels always visible (removed invalid `xs` breakpoint)
- [x] Doctor actions column widened so “View patients” stays on one line
- [x] Mobile doctor cards, filter order and date-filter truncation refined

## Phase F — Pages and features

### Login

- [x] Split-panel Figma layout (496px identity panel)
- [x] Email/password fields, show/hide password
- [x] Inline + form-level errors, pending state
- [x] Remember-my-email (email only, never password)
- [x] Redirect signed-in users to `/dashboard`
- [x] Responsive compact brand header below 1024px
- [x] “Doctor Tracker” wordmark readable on the dark identity panel

### Dashboard

- [x] Page header with range selector (`7d`, `30d`, `90d`, `12m`)
- [x] KPI cards (3-card Figma layout; new-patient count highlighted)
- [x] Patient registrations chart (grouped bars)
- [x] Doctor workload chart (horizontal bars, top 5 + remainder)
- [x] Latest patient registrations
- [x] Live sidebar counts
- [x] Loading / empty / error states

### Doctors directory

- [x] Page header with Add doctor
- [x] Search (debounced, abortable, URL state)
- [x] Date-added, specialization and hospital filters
- [x] Sortable name/date, page-size selector, pagination
- [x] Desktop table + mobile/tablet cards
- [x] Add doctor sheet with validation
- [x] Edit doctor sheet
- [x] Duplicate email conflict feedback
- [x] Row action: View patients with count

### Doctor detail

- [x] Back link and doctor header card
- [x] Contact details, derived reference, added date, patient total
- [x] Scoped patient list with filters/pagination
- [x] Add patient sheet with doctor locked
- [x] Edit patient action
- [x] Remove patient confirmation
- [x] Missing doctor not-found state

### Patients directory

- [x] Page header
- [x] Search, date-added, condition and doctor filters
- [x] Sort, page size, pagination
- [x] Desktop table + mobile/tablet cards
- [x] Assigned doctor link
- [x] Edit patient sheet
- [x] Delete patient confirmation with patient name
- [x] Guidance that patients are registered from a doctor profile

## Phase G — Responsive, motion and accessibility

- [x] Desktop 1440px pass
- [x] Desktop 1280px pass
- [x] Tablet 768px pass (drawer nav, card lists, stacked charts)
- [x] Mobile 390px pass (bottom nav, sheets, safe scrolling)
- [x] Mobile 375px pass
- [x] Tables become cards below 1024px
- [x] Login split layout breakpoint
- [x] Keyboard navigation audit
- [x] Focus rings and focus return
- [x] `aria-live` toasts, `aria-current` navigation
- [x] Dialog focus trapping
- [x] Reduced-motion support
- [x] Chart accessibility summaries
- [x] Color contrast check

## Phase H — Documentation and delivery

- [x] Professional `README.md`
  - [x] Overview and screenshots
  - [x] Tech stack
  - [x] Architecture diagram
  - [x] Setup (prerequisites, install, env, MongoDB, seed, run)
  - [x] Default login instructions
  - [x] Folder structure
  - [x] API summary
  - [x] Data model and indexes
  - [x] Auth flow
  - [x] Technical decisions (native driver, URL state + React Query)
  - [x] Assumptions and trade-offs
  - [x] Verification results
- [x] Add demo screenshots to `docs/screenshots/` (14 real captures)
- [x] Document Atlas seeding, dev preflight, and dev/production port guidance
- [x] Record known issues / next steps
- [x] Update this TODO file to final state

## Phase I — Quality gate

- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Dev preflight passes and Next.js starts on port 3000
- [x] Atlas workspace seeded (24 doctors / 384 patients / 1 admin)
- [x] Production server boots
- [x] Login invalid → safe error
- [x] Login valid → dashboard
- [x] Sign-out clears session
- [x] Unauthenticated/expired session redirects to login
- [x] Create doctor validation and duplicate email
- [x] Edit doctor updates lists
- [x] Doctor search/filter/sort/pagination
- [x] Filters persist in URL through refresh/back
- [x] Doctor detail correct patient count
- [x] Add patient with locked doctor
- [x] Edit patient updates both directories
- [x] Delete patient updates counts
- [x] Patients search/filter/sort/pagination
- [x] Dashboard totals update after mutations (384 → 385 → 384)
- [x] Range switch updates summary/charts
- [x] Loading / empty / error states verified
- [x] Final visual comparison against Figma
- [x] Report completed features and remaining issues

---

## Verification record

| Check                                                       | Result                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                              | Passes                                                                                                                       |
| `npm run format:check`                                      | Passes                                                                                                                       |
| `npm run build`                                             | Production build passes                                                                                                      |
| Dev preflight (`node scripts/dev-preflight.mjs`)            | Passes; env values match; ports 3000/4000 free                                                                               |
| `npm run dev`                                               | Next.js on 3000; API health 200; no CORS/401 errors                                                                          |
| Production client + API boot                                | Both boot and serve requests                                                                                                 |
| `npm run indexes` / `npm run seed`                          | 24 doctors, 384 patients, admin provisioned (Atlas)                                                                          |
| API smoke suite                                             | 26/26 checks passed                                                                                                          |
| Playwright UI CRUD suite                                    | 12/12 checks passed                                                                                                          |
| Final auth/URL/validation suite                             | 8/8 checks passed                                                                                                            |
| Responsive overflow suite (1440, 1280, 1024, 768, 390, 375) | 24/24 checks passed                                                                                                          |
| Dashboard mutation sync                                     | 3/3 checks passed                                                                                                            |
| Dashboard chart render (default + 90d)                      | 4/4 checks passed                                                                                                            |
| Public API pass                                             | Options 200; registrations 201; duplicate 409; unknown doctor 404; protected route 401                                       |
| Public browser pass                                         | Home/nav at 1440, 390, and 375; tabs, 25 doctor options, 5 validation errors, doctor success panel, signed-in Dashboard swap |
| Public patient submission                                   | End-to-end success panel; no console errors; zero overflow at 375px; test row removed                                        |
| Browser console errors                                      | None in final runs                                                                                                           |
| Screenshots                                                 | 14 real captures: 1440 × 1000, 768 × 1024, 390 × 844                                                                         |

The verification scripts were temporary development aids and are not part of the committed source tree. The application, seed data, and screenshots are real; no test results are fabricated.

## Implementation notes and deviations

- **`proxy.js` instead of `middleware.js`** — Next.js 16.4 deprecates `middleware.js` in favour of `proxy.js`.
- **HeroUI omitted** — daisyUI 5 + native accessible components cover the design without an extra dependency.
- **MongoDB must be a replica set** — Better Auth uses transactions, which a standalone `mongod` cannot provide. This project uses MongoDB Atlas or an existing replica set; Docker is not used.
- **`better-auth` is not externalized** in `serverExternalPackages`; externalizing it caused duplicate React resolution during prerender. `mongodb` remains externalized.
- **Secure cookies are protocol-aware** — enabled only for an HTTPS `BETTER_AUTH_URL`, so local `next start` over HTTP works.
- **Env values are trimmed at runtime** — trailing whitespace in `BETTER_AUTH_SECRET` or URLs cannot silently break sessions. The dev preflight still warns when whitespace is present.
- **Auth is same-origin** — the browser client uses the current origin instead of a hardcoded port, so a port change cannot cause CORS failures. The dev preflight still blocks port 3000 conflicts so the documented workflow stays on 3000.
- **Age instead of date of birth**, derived `D-XXXX` / `PT-XXXX` references, three KPI cards, and Figma chart types follow the approved plan choices.

## Known limitations and next steps

- Better Auth’s email/password sign-up API remains enabled so the seed script can provision the administrator. A real deployment should disable or protect that endpoint at the infrastructure level.
- There is one administrator role; there is no per-doctor ownership model, role matrix, or audit log.
- Public registrations are stored in `registration_requests` as pending documents. Administrators review them at `/registration_request`; approval transactionally creates the matching directory record and deletes the request. Pending-request Delete removes only that request, never a same-email directory record. Doctor deletion is blocked while assigned patients or pending patient requests remain.
- Display references are four-hex ObjectId suffixes, not sequential IDs; a collision is theoretically possible at very large scale.
- Rate limiting uses the default in-memory store, so limits are per process. Use a shared store for multi-instance deployments.
- `npm run seed` replaces the doctors and patients collections; it is a demo utility, not a production migration path.
- The project directory is not a Git repository. Initializing Git and adding CI (lint, build, smoke tests) is recommended before further work.
