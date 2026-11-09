# Doctor Tracker — Project Plan

**Status:** Awaiting approval before implementation
**Sources of truth:** `recuirements.txt` (functionality), Figma design (visuals), `.cursorrules` (development rules)
**Note:** `requirements.md` does not exist in the workspace; the functional requirements file is `recuirements.txt`.

---

## 1. Project Understanding

Doctor Tracker is a secure administrative portal for managing doctors and their patients. It requires:

- Authenticated access only; no public registration UI.
- Dashboard with totals, patients-per-doctor, date-based statistics and charts.
- Doctor management: create, list, search, filter, sort, paginate, view assigned patients, add patients under a doctor, edit doctors.
- Patient management: list all, search, filter, sort, paginate, edit, delete.
- Patient creation only from a doctor's profile, with the doctor preselected and locked.
- Responsive, modern UI matching the supplied Figma design.
- Performance-oriented MongoDB queries with proper indexes.
- Complete README with setup, architecture, technical decisions, screenshots and assumptions.

### Figma screens reviewed

| Screen | Node ID |
|---|---|
| Administrator sign-in | `3:30087` |
| Dashboard overview | `3:30152` |
| Doctors directory | `3:30366` |
| Doctor detail — Maya Patel | `3:30645` |
| Patients directory | `3:30897` |
| Add doctor — validation | `3:31205` |
| Add patient — Maya Patel | `3:31530` |
| Edit patient — Amelia Wright | `3:31843` |
| Delete patient — confirmation | `3:32214` |
| Mobile dashboard | `3:32547` |
| Mobile doctors directory | `3:32679` |
| Mobile patients directory | `3:32781` |

### Design system extracted

| Token | Value |
|---|---|
| Surface | `#fffffe` |
| App background | `#f6f8f8` |
| Border | `#dfe6e7` |
| Heading / ink | `#203438` |
| Body text | `#687b80` |
| Muted text | `#8a999d` |
| Primary | `#157d78` |
| Primary hover / dark | `#11645f` |
| Primary soft | `#e8f4f1` |
| Neutral soft | `#f0f4f4` |
| Login panel | `#143d3d` |
| Login muted | `#a6c4c1` |
| Error | `#bc4946` |
| Error soft | `#fcf0ee` |
| Chart secondary | `#8db6b0` |
| Chart faint | `#d6e3e1` |
| Font | Inter, weights 400 / 500 / 600 |

Layout details:

- Desktop sidebar: 224px.
- Utility bar: 76px.
- Desktop content padding: 32px.
- Mobile header: 72px.
- Mobile content padding: 20px.
- Mobile bottom navigation: 78px.
- Radii: inputs/buttons 7px, cards 12px, badges 5px, avatars fully rounded.
- Tables: 44px header, 68px rows, 8 rows per page by default.
- Login: 496px split identity panel, 420px login form.
- No raster imagery in the design; all visuals map to Lucide React icons.

---

## 2. Technology Stack

| Layer | Choice |
|---|---|
| Monorepo | npm workspaces: `client`, `server`, `packages/*` |
| Frontend | Next.js 16.4 App Router, React 19, JavaScript only |
| Styling | Tailwind CSS 4 + daisyUI 5 |
| Icons | Lucide React only |
| Server state | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| Animation | Motion (`motion/react`) |
| Charts | Recharts 3 |
| Backend | Express 5, Node.js 22, ES modules |
| Database | MongoDB 7 native driver only, no ODM |
| Authentication | Better Auth 1.7 with MongoDB adapter |
| Validation | Shared Zod schemas in `packages/validation` |
| Tooling | ESLint 9, Prettier, npm workspaces, concurrently |

### Deliberate stack decisions

- **No TypeScript.** All files are `.js` with `jsconfig.json` path aliases.
- **No Mongoose/Prisma.** The native `mongodb` driver is used exclusively.
- **No Next.js CRUD route handlers.** Only the Better Auth handler exists in Next.js.
- **HeroUI is omitted.** The design has no widget that justifies the extra bundle and Tailwind 4 compatibility risk. daisyUI 5 + native accessible controls covers every screen.
- **Next.js 16 proxy note.** `middleware.js` is deprecated in Next.js 16 and renamed to `proxy.js`. The project will use `client/proxy.js` for the optimistic cookie redirect. The authoritative session checks remain in the protected layout and on the Express API.
- **Single Better Auth config.** `packages/auth` owns the only auth configuration and is never imported into browser-bundled code.
- **Single MongoClient per process.** `packages/auth` owns the shared client; `server/src/db/mongo.js` reuses that DB for application collections.

---

## 3. Architecture

```
Browser
  ├─ Next.js App Router pages
  │    ├─ fetch("/api/v1/...")  →  Next rewrite  →  Express API  →  MongoDB
  │    └─ Better Auth client   →  /api/auth/*     →  Better Auth   →  MongoDB
  └─ All portal pages guarded by server-side session checks
```

- The browser only calls same-origin paths.
- `next.config.mjs` rewrites `/api/v1/:path*` to `${process.env.API_URL}/api/v1/:path*`.
- Better Auth cookies remain first-party because auth is hosted by Next.js.
- Express authenticates every `/api/v1` request using forwarded cookies.
- Server components render shells and enforce route protection.
- Data-heavy views are client components using TanStack Query.
- List filters, search, sort and pagination live in the URL.
- No RSC data fetching is mixed with React Query for the same resource.
- `proxy.js` performs an optimistic cookie redirect only; it is never treated as authorization.

---

## 4. Repository Layout

```
DoctorTracker/
├─ package.json                     # npm workspaces root
├─ eslint.config.mjs
├─ .prettierrc
├─ .env.example                     # every variable for both apps
├─ compose.yaml                     # local MongoDB 8
├─ README.md
├─ project-plan.md
├─ recuirements.txt
├─ .cursorrules
├─ docs/
│  └─ screenshots/                  # real desktop + mobile screenshots
├─ client/
│  ├─ app/
│  │  ├─ layout.js                  # root providers, fonts, metadata
│  │  ├─ page.js                    # redirect to /dashboard
│  │  ├─ globals.css                # Tailwind + daisyUI theme tokens
│  │  ├─ login/page.js
│  │  ├─ (dashboard)/
│  │  │  ├─ layout.js               # server-side session guard + app shell
│  │  │  ├─ dashboard/page.js
│  │  │  ├─ doctors/page.js
│  │  │  ├─ doctors/[id]/page.js
│  │  │  └─ patients/page.js
│  │  ├─ api/auth/[...all]/route.js
│  │  ├─ not-found.js
│  │  └─ error.js
│  ├─ components/
│  │  ├─ layout/                    # app-shell, sidebar, mobile header,
│  │  │                             # bottom nav, tablet drawer, user menu
│  │  ├─ ui/                        # PageHeader, StatCard, EmptyState, ErrorState,
│  │  │                             # TableSkeleton, ConfirmDialog, Pagination,
│  │  │                             # FilterBar, SearchInput, DateRangeFilter,
│  │  │                             # Sheet, FormField, Combobox, Toasts
│  │  ├─ dashboard/
│  │  ├─ doctors/
│  │  └─ patients/
│  ├─ hooks/                        # use-doctors, use-patients, use-dashboard,
│  │                                # use-debounced-value, use-list-state
│  ├─ lib/
│  │  ├─ api-client.js
│  │  ├─ auth-client.js
│  │  ├─ query-client.js
│  │  ├─ query-keys.js
│  │  └─ formatters.js
│  ├─ providers/                    # query + auth providers
│  ├─ proxy.js
│  ├─ next.config.mjs
│  ├─ jsconfig.json
│  └─ .env.example
├─ server/
│  ├─ src/
│  │  ├─ config/env.js
│  │  ├─ db/
│  │  │  ├─ mongo.js                # shared DB accessor
│  │  │  └─ indexes.js
│  │  ├─ middleware/                # require-auth, validate, not-found, error-handler
│  │  ├─ modules/
│  │  │  ├─ doctors/                # routes, controller, service, serializer
│  │  │  ├─ patients/
│  │  │  └─ dashboard/
│  │  ├─ utils/                     # async-handler, api-error, response, pagination, escape-regex
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ scripts/seed.js
│  └─ .env.example
└─ packages/
   ├─ auth/
   │  ├─ index.js
   │  └─ package.json
   └─ validation/
      ├─ index.js
      └─ package.json
```

Root scripts:

- `npm run dev` — client + server via concurrently
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm run seed -w server`
- `npm run indexes -w server`

---

## 5. Data Model

Exactly the fields defined in `.cursorrules`; no additional document fields.

### `doctors`

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | server-generated |
| `name` | string | required, trimmed, 2–100 |
| `specialization` | string | required, trimmed, 2–100 |
| `hospital` | string | required, trimmed, 2–150 |
| `phone` | string | required, 7–20 |
| `email` | string | required, valid, unique, lowercase |
| `createdAt` | Date | server-set |
| `updatedAt` | Date | server-set |

### `patients`

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | server-generated |
| `name` | string | required, trimmed, 2–100 |
| `age` | number | required integer, 0–130 |
| `gender` | string | required, `male` / `female` / `other` |
| `condition` | string | required, trimmed, 2–150 |
| `phone` | string | required, 7–20 |
| `email` | string | optional, valid |
| `doctorId` | ObjectId | required, references `doctors._id` |
| `createdAt` | Date | server-set |
| `updatedAt` | Date | server-set |

Better Auth owns `user`, `session`, `account`, `verification`; application code never reads or writes those collections directly outside Better Auth.

### Display references

If approved, patient and doctor display IDs will be derived client-side from the ObjectId (for example `PT-4F2A`). No database field is added. They are display references, not searchable sequential IDs.

---

## 6. MongoDB Indexes

### Doctors

```js
{ key: { email: 1 }, name: "uniq_doctor_email", unique: true }
{ key: { createdAt: -1 }, name: "doctors_created_at" }
{ key: { specialization: 1, createdAt: -1 }, name: "doctors_specialization_created_at" }
{ key: { hospital: 1, createdAt: -1 }, name: "doctors_hospital_created_at" }
{ key: { name: "text", specialization: "text", hospital: "text", email: "text" },
  name: "doctors_search" }
```

### Patients

```js
{ key: { doctorId: 1, createdAt: -1 }, name: "patients_doctor_created_at" }
{ key: { condition: 1, createdAt: -1 }, name: "patients_condition_created_at" }
{ key: { createdAt: -1 }, name: "patients_created_at" }
{ key: { name: "text", condition: "text" }, name: "patients_search" }
```

Indexes are created idempotently at startup. Index creation failures are logged clearly but do not take the API down.

---

## 7. API Design

Base path: `/api/v1`
Health check: `GET /health` (no auth)

```
GET    /health

GET    /api/v1/doctors
POST   /api/v1/doctors
GET    /api/v1/doctors/options
GET    /api/v1/doctors/:id
PATCH  /api/v1/doctors/:id
GET    /api/v1/doctors/:id/patients

GET    /api/v1/patients
POST   /api/v1/patients
GET    /api/v1/patients/:id
PATCH  /api/v1/patients/:id
DELETE /api/v1/patients/:id

GET    /api/v1/dashboard/summary
GET    /api/v1/dashboard/patients-per-doctor
GET    /api/v1/dashboard/patients-over-time?range=7d|30d|90d|12m
```

### Conventions

- Success envelope: `{ success: true, data, meta }`
- Error envelope: `{ success: false, error: { code, message, details } }`
- Pagination meta: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`
- List meta also includes indexed distinct filter values: specializations, hospitals, conditions.
- Defaults: `page=1`, `limit=20`; clamp `limit` to `1..100`.
- Status codes: 200 read/update, 201 create, 204 delete, 400 validation, 401 unauthenticated, 404 not found, 409 conflict, 429 rate limited, 500 unexpected.
- Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.
- JSON only for writes; validate `Content-Type`.
- No doctor deletion.
- Duplicate doctor email → `409 CONFLICT`.
- Missing doctor on patient create → `404 DOCTOR_NOT_FOUND`.
- Deleting a patient never modifies the doctor.
- Dates are stored as `Date`, serialized as ISO strings.
- `from`/`to` filters apply to `createdAt`, inclusive UTC day boundaries.
- Search uses MongoDB text indexes and escaped/validated input.
- Sorting is whitelisted: `createdAt`, `name`; order `asc|desc`; default `createdAt desc`.
- Stable pagination always adds `_id` as the final sort tiebreaker.

### List query parameters

- Doctors: `page, limit, search, specialization, hospital, from, to, sort, order`
- Patients: `page, limit, search, condition, doctorId, from, to, sort, order`

### Doctor list

- Page doctors first, then `$lookup` patients for those IDs and count.
- Doctors with zero patients show `0`, never disappear.
- No count query per doctor.
- `GET /doctors/:id` also returns `patientCount`.
- `GET /doctors/options` returns lightweight options, limit ≤ 50, registered before `/:id`.

### Patient list

- `$lookup` minimal doctor summary `{ id, name, specialization }`.
- No full doctor documents per row.
- The same list service powers `GET /doctors/:id/patients`.

### Dashboard

- `summary`: exact totals, average patients per doctor, new doctors/new patients in range, previous-period comparison.
- `patients-per-doctor`: one pipeline, top 10, doctor lookup and count, sorted descending.
- `patients-over-time`: current and previous period buckets, zero-filled in JS.
  - 7d → daily buckets
  - 30d / 90d → weekly buckets
  - 12m → monthly buckets
  - UTC grouping documented in README.
- Latest dashboard registrations reuse `GET /patients?limit=4&sort=createdAt&order=desc`; no invented dashboard endpoint.

### Validation

- Shared Zod schemas from `packages/validation`.
- `.strict()` request bodies; unknown fields rejected.
- Trim strings; enforce min/max lengths.
- Parse and type-check query parameters before services see them.
- Validate `from <= to`.
- Validate ObjectIds; `400` for malformed, `404` for missing.
- Reject keys containing `$` or dots.
- Never pass raw bodies/queries into MongoDB filters.
- Field-level validation details returned on `400`.
- No stack traces or raw Mongo errors in responses.

### Security

- Express `helmet`.
- Explicit CORS allowlist from `CORS_ORIGINS`, `credentials: true`; never `*`.
- `express-rate-limit` globally and stricter on writes; custom `RATE_LIMITED` envelope.
- Request body size limit 1mb.
- `x-powered-by` disabled.
- PII is never logged.
- `MONGODB_URI`, `BETTER_AUTH_SECRET` are never exposed to the browser.
- Only `NEXT_PUBLIC_*` variables can be read by client code.

---

## 8. Authentication and Authorization

### Better Auth configuration

- One configuration in `packages/auth/index.js`.
- MongoDB adapter from `better-auth/adapters/mongodb` with the native driver.
- Email/password enabled; no public registration page.
- Admin user provisioned by `server/scripts/seed.js` through Better Auth's server API; never by manual password hashing.
- Required env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `MONGODB_URI`, `MONGODB_DB`.
- `trustedOrigins` includes the client origin.
- Secure cookies in production.
- MongoClient and auth instance cached via `globalThis` across dev hot reloads.

### Next.js side

- `client/app/api/auth/[...all]/route.js` uses `toNextJsHandler(auth)`.
- `client/lib/auth-client.js` uses `createAuthClient` from `better-auth/react`.
- Login page redirects already-authenticated users to `/dashboard`.
- Protected layout performs `auth.api.getSession({ headers: await headers() })`.
- Unauthenticated users are redirected to `/login`.
- `proxy.js` may use `getSessionCookie` for an optimistic redirect only.
- Login uses `authClient.signIn.email`, field-level errors, pending state, then `router.replace("/dashboard")` + `router.refresh()`.
- Client `AuthProvider` uses `authClient.useSession()` and handles session expiry.
- Sign-out calls `authClient.signOut` and redirects to `/login`.
- Sign-out is available in the desktop sidebar and the avatar menu.
- “Remember my email” stores the email in localStorage only.

### Express side

- `requireAuth` middleware calls `auth.api.getSession` with `fromNodeHeaders(req.headers)`.
- Applied to every `/api/v1` route except `GET /health`.
- Never accepts a user ID from the request body; identity comes from the session.
- Cookies are forwarded through the Next.js rewrite; no custom cookie parsing or JWT decoding.

---

## 9. Pages and Routes

| Route | Description |
|---|---|
| `/` | Redirects to `/dashboard` |
| `/login` | Login screen; redirects signed-in users to dashboard |
| `/dashboard` | Workspace overview |
| `/doctors` | Doctor directory |
| `/doctors/[id]` | Doctor profile + assigned patients |
| `/patients` | Patient directory |
| `/api/auth/[...all]` | Better Auth handler only |

### Login

- Split-panel layout matching Figma.
- Email/password, show/hide password, inline errors, pending state.
- Remember-my-email checkbox.
- Error alert uses soft red design token.
- No registration, forgot-password or social login flows.
- Responsive: left panel hides below 1024px.

### Dashboard

- Page header with range filter.
- KPI cards: total doctors, total patients, patients per doctor.
- New-patient count shown in the patient registrations summary.
- Patient registrations chart.
- Doctor workload top 5 with “other doctors” summary.
- Latest patient registrations table on desktop.
- Sidebar counts from dashboard summary.
- Range stored in URL, e.g. `?range=30d`.

### Doctors

- Page header with Add doctor.
- Search by doctor name/email.
- Date-added filter, specialization filter, hospital filter.
- Sortable name/date columns.
- Page-size selector and pagination.
- Desktop table + mobile/tablet cards.
- Row action: View patients with patient count.
- Add doctor sheet with validation.
- Edit doctor action.
- No delete doctor.

### Doctor detail

- Back link to All doctors.
- Doctor header card: avatar, name, specialization, derived doctor reference,
  hospital, email, phone, added date, assigned patient total.
- Scoped patient list with same filters/pagination pattern.
- Add patient sheet with doctor preselected and locked.
- Remove patient confirmation.
- Edit patient action.
- Missing doctor → not-found state.

### Patients

- Page header.
- Search, date-added, condition and doctor filters.
- Sort, page-size selector and pagination.
- Desktop table + mobile/tablet cards.
- Patient row links to assigned doctor.
- Edit patient sheet.
- Delete patient confirmation modal showing patient name.
- Guidance: patients are registered from their doctor’s profile.

---

## 10. Reusable Components

### Layout

- `AppShell`
- `Sidebar`
- `MobileHeader`
- `MobileBottomNav`
- `TabletDrawer`
- `UserMenu`
- `Breadcrumbs`
- `WorkspaceFooter`

### UI primitives

- `PageHeader`
- `StatCard`
- `EmptyState`
- `ErrorState`
- `TableSkeleton`
- `CardListSkeleton`
- `ChartSkeleton`
- `ConfirmDialog`
- `Pagination`
- `FilterBar`
- `SearchInput`
- `DateRangeFilter`
- `FilterSelect`
- `Sheet`
- `FormField`
- `Combobox`
- `Badge`
- `Avatar`
- `ToastProvider` / `useToast`

### Doctors

- `DoctorsView`
- `DoctorTable`
- `DoctorCard`
- `DoctorForm`
- `AddDoctorSheet`
- `EditDoctorSheet`
- `DoctorHeaderCard`
- `DoctorPatientsView`

### Patients

- `PatientsView`
- `PatientTable`
- `PatientCard`
- `PatientForm`
- `AddPatientSheet`
- `EditPatientSheet`
- `DeletePatientDialog`
- `PatientIdentity`
- `PatientMetadata`

### Dashboard

- `DashboardView`
- `KpiGrid`
- `RegistrationsChart`
- `WorkloadChart`
- `RecentRegistrations`
- `RangeSelect`

One table/pagination pattern is reused across doctors, doctor-scoped patients and the global patient list. No duplicated table variants.

---

## 11. Frontend Data Flow

### API client

- `client/lib/api-client.js` wraps `fetch("/api/v1/...", { credentials: "include" })`.
- Parses the success/error envelope.
- Throws a typed `ApiError` for non-2xx or `success: false`.
- Supports `AbortSignal`.

### TanStack Query

- Query keys live in `client/lib/query-keys.js` and include every filter/pagination value.
- Defaults: `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`.
- Paginated tables use `placeholderData: keepPreviousData`.
- Mutations invalidate related lists, doctor counts, patient counts and dashboard keys.
- 401 responses route the user back to login.
- No client-side computation of totals or dashboard aggregates from full datasets.

### URL state

- Search, filters, sort, page and page size live in the query string.
- Search input is local while typing, debounced ~350ms, then written to the URL.
- Local input syncs when the URL changes via back/forward navigation.
- Changing any filter/search/sort resets `page` to 1.
- Page-size changes preserve filters.
- Uses `useSearchParams`, `useRouter`, `usePathname`, `router.replace(..., { scroll: false })`.
- Pages using search params are wrapped in Suspense with skeleton fallbacks.

### Forms

- React Hook Form + Zod resolver using shared schemas.
- Visible labels, inline errors and a form-level error summary.
- Submit disabled while pending, with spinner.
- Double-submit prevented.
- Optional empty email normalized to `undefined`.
- Successful mutations close the sheet, invalidate queries and show a toast.
- Deletes always require confirmation and wait for the server; no optimistic delete.

### Formatting

- Single `lib/formatters.js` for dates, date ranges, numbers, initials, age, gender and display references.
- Dates use `Intl.DateTimeFormat`, formatted consistently with UTC to avoid hydration differences.
- No `new Date()` during render for display.
- No emoji or non-Lucide icons.

---

## 12. Responsive Design Strategy

Test widths: 375px, 768px, 1280px and 1440px.

### Desktop ≥1024px

- Fixed 224px sidebar.
- 76px utility bar with breadcrumbs, admin badge, avatar and account menu.
- Full tables with 8 rows per page.
- 3 KPI cards in a row.
- Side-by-side charts.
- Right-side sheets for add/edit forms.

### Tablet 768–1023px

- Top header with hamburger opening a daisyUI drawer sidebar.
- No bottom navigation.
- Two-column card lists instead of desktop tables.
- Stacked dashboard charts.
- Right-side sheets remain, sized to the viewport.

### Mobile <768px

- Figma-style top header with brand and avatar.
- Fixed bottom navigation: Dashboard, Doctors, Patients.
- 20px page padding.
- Two KPI cards plus full-width patients-per-doctor strip.
- Card lists with actions in the card footer.
- Back/Next pagination.
- Full-screen forms and sheets.
- Delete confirmation centered and scroll-safe.
- Sign-out available through the avatar menu.

### Tables

- Desktop tables become cards below 1024px.
- Primary actions remain visible without horizontal scrolling.
- Horizontal scroll is allowed only as a secondary fallback for unusually wide content.

### Login

- Split layout at ≥1024px.
- Below 1024px, hide the identity panel and show a compact brand header with the same form.

---

## 13. Motion and Accessibility

### Motion

- Use `motion/react` for page/section entrance, sheet/dialog content and subtle feedback.
- Durations 150–300ms, ease-out.
- Respect `useReducedMotion`.
- No animations in tables or forms that cause layout shift.
- Motion never hides loading or error states.

### Accessibility

- Semantic HTML, correct `<button>` vs `<a>` usage.
- Visible labels and focus rings.
- `aria-describedby` for field errors.
- `aria-live` for toasts.
- Keyboard-operable dialogs; Esc closes and focus returns.
- Native `<dialog>` for modal focus trapping.
- Charts include `accessibilityLayer` and a screen-reader summary or table fallback.
- Active navigation uses `aria-current="page"`.
- Loading, empty and error states announced appropriately.

---

## 14. Dashboard Aggregation Details

### Summary

- Exact `countDocuments` for doctors and patients in `Promise.all`.
- Average patients per doctor computed from the aggregate result.
- New doctors/new patients in the selected range.
- Previous-period totals for deltas.

### Patients per doctor

- One pipeline: group patients by `doctorId` → lookup doctors → project
  name/specialization/count → sort count desc → limit 10.
- No query in a loop.
- Client shows top 5, then summarizes the remaining doctors using totals.

### Patients over time

- Current and previous period buckets.
- `$dateTrunc`/`$dateToString` with UTC.
- Zero-fill missing buckets in JS.
- Range allowlist: `7d`, `30d`, `90d`, `12m`.

### No server-side data caching

- React Query `staleTime` handles client caching.
- If server caching is added later, invalidation must be documented.

---

## 15. Environment Variables

### Root `.env.example`

Documents every variable for both apps.

### Client `.env.example`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://127.0.0.1:4000
BETTER_AUTH_SECRET=replace-with-strong-secret
BETTER_AUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=doctor_tracker
```

Only `NEXT_PUBLIC_APP_URL` is exposed to the browser.

### Server `.env.example`

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=doctor_tracker
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
BETTER_AUTH_SECRET=replace-with-strong-secret
BETTER_AUTH_URL=http://localhost:3000
SEED_ADMIN_NAME=Alex Lee
SEED_ADMIN_EMAIL=alex.lee@example.com
SEED_ADMIN_PASSWORD=replace-with-strong-password
```

Both apps must use the same `BETTER_AUTH_SECRET` and MongoDB connection. README documents this.

---

## 16. Seed Data and Demo Workspace

- Local MongoDB 8 via `compose.yaml`; Atlas supported by changing `MONGODB_URI`.
- Admin provisioned through Better Auth: Alex Lee.
- Figma-like demo data: 24 doctors and 384 patients.
- Top doctor counts match the design narrative: 28, 24, 22, 20, 18, 18, 16, 16.
- Dates are relative to the seed run so dashboard ranges are always populated.
- Existing demo data can be rebuilt by the seed script.
- Seed data is fictional; no real patient information.
- All seed credentials come from env variables; no secrets committed.

---

## 17. README Deliverables

`README.md` will include:

1. Elevator pitch.
2. Setup guide:
   - Prerequisites
   - Install
   - Environment files
   - MongoDB via Docker or Atlas
   - Seed
   - Run client and server
   - Default login instructions
3. System architecture:
   - Client/server/auth/DB flow
   - Folder overview
4. Two technical decisions in depth:
   - Native MongoDB driver + aggregation-first queries over an ODM
   - URL state + TanStack Query over a global client store
5. Real screenshots under `docs/screenshots/`:
   - Desktop dashboard
   - Desktop doctors
   - Desktop patients
   - Desktop doctor detail
   - Mobile dashboard
   - Mobile doctors
   - Mobile patients
6. API summary table.
7. Assumptions and trade-offs:
   - Dates map to `createdAt`
   - Admin provisioning
   - No doctor deletion
   - Age instead of date of birth (pending approval)
   - Derived display references (pending approval)
   - UTC date buckets
   - No public registration page
   - Demo data is fictional
8. Version compatibility notes.

---

## 18. Build Plan

### Phase A — Foundation

1. Initialize npm workspaces.
2. Add root scripts, ESLint, Prettier.
3. Create `.env.example` files.
4. Add MongoDB Docker Compose.
5. Scaffold Next.js client and Express server.

### Phase B — Shared packages

1. `packages/validation` with doctor, patient, list-query, auth and dashboard schemas.
2. `packages/auth` with the single Better Auth configuration and MongoClient singleton.

### Phase C — Backend

1. Environment validation.
2. Database access and idempotent indexes.
3. Express app assembly.
4. Auth middleware.
5. Doctors module.
6. Patients module.
7. Dashboard module.
8. Seed script.
9. API smoke tests.

### Phase D — Frontend foundation

1. daisyUI theme and design tokens.
2. Inter font and metadata.
3. Providers (Query, Auth, Toast).
4. API client, query keys, formatters.
5. Login flow.
6. Protected app shell and navigation.
7. Shared UI primitives.

### Phase E — Features

1. Dashboard.
2. Doctors list, search, filters, sort, pagination.
3. Add/edit doctor.
4. Doctor detail and scoped patients.
5. Add/edit/delete patient.
6. Global patients directory.

### Phase F — Polish

1. Responsive pass at 375 / 768 / 1280 / 1440.
2. Motion and reduced-motion pass.
3. Accessibility pass.
4. Loading/empty/error states.
5. Visual comparison against Figma.
6. Real screenshots.

### Phase G — Verification

1. `npm run lint`.
2. `npm run build`.
3. Seed and run both apps.
4. API functional tests.
5. Browser functional tests.
6. README finalization.
7. Report completed features and remaining issues.

---

## 19. Quality Checklist

### Functionality

- [ ] Unauthenticated access redirects to login.
- [ ] Login invalid shows a safe error.
- [ ] Login valid redirects to dashboard.
- [ ] Sign-out clears the session.
- [ ] Session expiry redirects to login.
- [ ] Create doctor validates all fields.
- [ ] Duplicate doctor email returns a clear conflict.
- [ ] Edit doctor updates the profile.
- [ ] Doctor search, filters, sort, page size and pagination work.
- [ ] Filters persist in the URL and survive refresh/back.
- [ ] Doctor detail shows the correct assigned patient count.
- [ ] Add patient locks the doctor.
- [ ] Edit patient updates both the patient directory and doctor list.
- [ ] Delete patient requires confirmation and updates counts.
- [ ] Patients page search/filter/sort/pagination works.
- [ ] Dashboard totals update after mutations.
- [ ] Range switch updates summary and charts.
- [ ] Empty filters show a useful empty state.
- [ ] API failure shows an error state with retry.

### Security

- [ ] No TypeScript or type-only tooling.
- [ ] No Mongoose/Prisma/ORM.
- [ ] No business CRUD in Next.js route handlers.
- [ ] No secrets in client bundles.
- [ ] All inputs validated server-side.
- [ ] All `/api/v1` routes authenticated.
- [ ] CORS is an explicit allowlist.
- [ ] No raw Mongo errors exposed.
- [ ] No public registration page.
- [ ] No doctor deletion.

### Performance

- [ ] Indexes exist for every filter/sort path.
- [ ] List queries use projections.
- [ ] Page + total use `$facet`.
- [ ] Doctor patient counts use one lookup, not N+1.
- [ ] Patient rows use projected doctor summaries.
- [ ] No unbounded `find()`.
- [ ] Search is debounced and abortable.
- [ ] No unnecessary global state.
- [ ] Charts are client-only and can be dynamically imported.

### UI/UX

- [ ] Matches Figma colors, typography, spacing and hierarchy.
- [ ] Responsive at 375 / 768 / 1280 / 1440.
- [ ] Tables become cards on small screens.
- [ ] Every async view has loading, empty, error and success states.
- [ ] Keyboard-accessible dialogs and controls.
- [ ] Reduced motion respected.
- [ ] Real screenshots captured for README.
- [ ] Lint and production build pass.

---

## 20. Open Decisions Requiring Approval

These are the only places where the Figma, the specification and `.cursorrules` disagree. Recommended choices are marked.

### 20.1 Patient date of birth vs age

- Figma: “Date of birth”.
- Spec: required integer `age`; no date-of-birth field.
- **Recommended:** use an “Age” input and display “45 years”. Do not add a date-of-birth field.

### 20.2 Patient and doctor display IDs

- Figma: sequential `PT-0384` and `D-024`.
- Spec: no ID fields.
- **Recommended:** derive a short display reference from the ObjectId (e.g. `PT-4F2A`); no schema change; search remains name/email/condition based.
- Alternative: add proper sequence fields (requires approving extra schema fields).

### 20.3 Dashboard KPI cards

- Figma: 3 cards + new-patient count in the registrations summary.
- `.cursorrules`: 4 cards including “new patients in range”.
- **Recommended:** keep the Figma 3-card layout and show new patients prominently in the registrations card.
- Alternative: add a fourth KPI card, changing the layout.

### 20.4 Chart types

- Figma: grouped weekly bars and horizontal workload bars.
- `.cursorrules`: line/area chart for patients over time.
- **Recommended:** match Figma using Recharts grouped bars and horizontal workload bars.
- Alternative: replace the registrations chart with a line/area chart.

### 20.5 Doctor edit and patient edit on doctor detail

- Figma omits both actions.
- `.cursorrules` puts doctor edit in scope and expects patient edit from doctor detail.
- **Recommended:** add compact secondary “Edit” actions, styled consistently with the design.

### 20.6 Local MongoDB

- **Recommended:** Docker Compose MongoDB 8 with Atlas supported by environment variable.
- Alternative: connect directly to an existing Atlas cluster.

### 20.7 Seed dataset

- **Recommended:** 24 doctors / 384 patients to match the Figma demo.
- Alternative: a smaller dataset for faster local runs.

### 20.8 Registration API

- No public registration page will exist.
- Better Auth email/password sign-up remains enabled at the API level so the seed script can provision the admin through Better Auth, as required by `.cursorrules`.
- This trade-off will be documented in the README.

---

## 21. Approval

No implementation will begin until the plan and the open decisions in section 20 are approved.

Reply with:

- **“Approved — use all recommendations”**, or
- your choices for decisions 20.1–20.7.
