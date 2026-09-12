# Seven Century Team Attendance

Internal attendance and agent status management for Seven Century Real Estate Brokers LLC. Team Leaders update only their assigned agents; administrators monitor and manage the company. Dubai is the fixed business timezone.

## Architecture

React 19 + Vite + TypeScript PWA → Fastify 5 REST API → Prisma 7 → PostgreSQL. The frontend uses React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, Radix Dialog, and Lucide. Socket.IO sends authenticated administrator clients a small invalidation event after committed changes. All database queries execute in the API.

```
apps/web/src/       React pages, components, API client, responsive styles
apps/api/src/       Auth, attendance, management, history, server configuration
packages/shared/   Status definitions, DTOs, validation and Dubai date helpers
prisma/            Schema, versioned migrations and development seed
scripts/           Optional local PostgreSQL and first-admin setup
tests/             Unit/component, PostgreSQL integration and Playwright tests
docker/            Application image
```

## Requirements and setup

Use Node.js 22.12+ (24 recommended), npm, and PostgreSQL 17+ or Docker. Run commands from the repository root.

```sh
npm install
```

Copy `.env.example` to `.env`, set a random `SESSION_SECRET` (at least 32 characters), and configure PostgreSQL. Development defaults match:

```sh
docker compose up -d postgres
npm run db:generate
npm run db:migrate
```

Alternatively, without Docker, run `node scripts/local-db.mjs` in a separate terminal. It creates a **workspace-local PostgreSQL server**, listening only on `127.0.0.1:55432`, persists data under ignored `.local/postgres`, and creates `.env` with random local credentials only when `.env` does not already exist. It does not overwrite existing environment configuration. Keep this process running. This optional development runtime is not a production database deployment.

For demo data, set `SEED_ALLOW=true` and a strong `DEMO_PASSWORD` in `.env`, then:

```sh
npm run db:seed
npm run dev
```

Open the `WEB_URL` configured in `.env` (normally `http://localhost:5173`, or `http://127.0.0.1:5173` with the local database helper). Use that exact hostname: origin checks intentionally distinguish localhost and 127.0.0.1. Vite proxies `/api` and `/socket.io` to port 3001. These local URLs only work on the computer running the servers.

Seed runs only on an empty database, refuses production, and creates 1 administrator, 3 leaders, 24 agents, 3 teams, and 12 days of attendance. No production passwords are committed.

| Role | Email |
|---|---|
| Admin | admin@sevencentury.test |
| Team Leader | ahmed@sevencentury.test |
| Team Leader | sara@sevencentury.test |
| Team Leader | omar@sevencentury.test |

All demo accounts use `DEMO_PASSWORD`. The optional helper saves generated local demo access in ignored `.local/demo-access.txt`.

## Configuration

| Variable | Purpose |
|---|---|
| DATABASE_URL | PostgreSQL URL, server-only |
| WEB_URL | Exact allowed frontend origin, with no trailing slash |
| API_URL | Documented API origin for operators |
| NODE_ENV | development, test, or production |
| SESSION_SECRET | Random HMAC secret for token hashing; rotation invalidates all sessions |
| COOKIE_DOMAIN | Usually empty; keep frontend and API on one origin |
| PORT / HOST | API listener; local default 3001 / 127.0.0.1 |
| DEMO_PASSWORD / SEED_ALLOW | Explicit development seed controls |
| TEST_DATABASE_URL | Dedicated database named attendance_test; integration tests reset it |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM | Optional real password reset email delivery |

Frontend code contains no database credentials. Do not put secrets in `VITE_*` variables.

## Authentication and security

No public signup. Admins create accounts with an initial password. Passwords are bcrypt-hashed with cost 12; inputs are limited to 72 UTF-8 bytes to avoid bcrypt truncation. Sessions use random 256-bit opaque tokens, stored only in HTTP-only cookies. The database stores HMAC hashes of tokens. Sessions expire after 12 hours; active account and role are read on every authenticated API request. Logout deletes the server session. Profile edits revoke all sessions for that user; password reset revokes sessions too.

Production cookies are Secure and SameSite=Lax. A host-only production cookie uses the `__Host-` prefix. Mutation requests require the exact configured Origin, including login/logout, providing CSRF protection. CORS allows only that origin with credentials. Helmet headers and login/reset rate limits are enabled. No JWTs or credentials are stored in localStorage. API responses are `no-store`; the PWA only precaches static assets.

Team Leader resource scopes are enforced in API middleware and Prisma queries. They cannot query admin routes or edit history. Attendance update transactions re-check the active actor and current team ownership, then update current status and insert history atomically with serializable isolation and bounded retries. A PostgreSQL trigger rejects audit UPDATE and DELETE. Administrators cannot deactivate or demote themselves. Historical team/leader identifiers are snapshotted in daily records, preserving filter membership after transfers; names and job titles display their current values.

The initial production administrator is created on an empty migrated database using environment variables `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` with `npm exec tsx -- scripts/bootstrap-admin.ts`. Remove those bootstrap variables afterward. Never run the demo seed in production.

## Attendance and API

Business dates are derived on the server in `Asia/Dubai`. Fetching today's attendance inserts missing records with `NOT_UPDATED` using a unique agent/date key. It never overwrites yesterday. A date included with an update is only a freshness check, so an open screen cannot silently write to the next day. Current totals exclude inactive agents; historical records remain. A deactivated team blocks its leader's access, while its active agents remain visible to admins for reassignment.

Main API modules:

- `/api/auth/login`, `/logout`, `/me`, `/forgot-password`, `/reset-password`
- `/api/me/team`, `/api/me/team/attendance`
- `PATCH /api/attendance/:agentId`
- `/api/admin/dashboard`, `/attendance`, `/team-completion`
- `/api/admin/teams`, `/agents`, `/users` (GET, POST and PATCH by ID)
- `/api/admin/settings` (GET, PATCH)
- `/api/admin/history`, `/api/admin/agents/:id/history`, `/api/admin/agents/:id/history/:date`

Attendance/history support filters and pagination. CSV export respects current attendance filters and escapes formulas. Dashboard totals and team completion update through Socket.IO with 30-second polling as fallback. Team Leaders support multiple assigned teams. The deadline is informational and never prevents changes.

Routes: `/login`, `/forgot-password`, `/reset-password`, `/today`, `/team`, `/profile`, and `/admin/dashboard`, `/admin/attendance`, `/admin/teams`, `/admin/teams/:id`, `/admin/agents`, `/admin/users`, `/admin/settings`, `/admin/history`, `/admin/history/:agentId`.

## Password reset email

Set the SMTP variables to activate Nodemailer delivery. Tokens expire after 30 minutes, are hashed in the database, are single-use, and are not logged. Without SMTP, requests deliberately return the same generic response but no email is sent. Configure and verify your company's mail sender before onboarding production users. No automatic attendance emails are sent.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Unit/component tests cover Dubai boundaries, classifications, completion, validation, CSV escaping, and the status sheet. Integration tests use Fastify inject and real PostgreSQL; set `TEST_DATABASE_URL` to a disposable database named **attendance_test**. They apply migrations when empty and truncate only that dedicated database. They cover authentication, authorization, concurrency, immutable history, filters, and logout.

Playwright tests require the seeded development database and running frontend/API. They use installed Microsoft Edge headlessly on Windows. On another OS, remove `channel: 'msedge'` from `playwright.config.ts` and install Chromium with `npx playwright install chromium`. E2E tests update one demo agent and restore its prior status, leaving audit entries as expected. Never point them at production.

## Build and deployment

`npm run build` compiles the API to `dist/` and the frontend to `apps/web/dist`. `npm start` serves both via Fastify. Use `NODE_ENV=production`, set `WEB_URL` to your exact HTTPS origin, and run migrations as a separate release step. Host the Node service and PostgreSQL on infrastructure supporting long-lived processes and Socket.IO. The supplied Dockerfile runs the compiled application; `docker compose --profile app up --build` is available for local container verification. In production terminate TLS at a reverse proxy and forward WebSocket upgrades. Bind the API to `0.0.0.0` only where required by the hosting platform.

Use a restricted application database account, a separate migration account, managed backups, and TLS to remote PostgreSQL. The app currently targets one API instance; multi-instance deployments need a shared rate limiter and Socket.IO adapter. Configure proxy trust to your known proxy topology before enabling forwarded-IP rate limiting. Do not blindly trust arbitrary forwarded headers.

The PWA is installable on HTTPS and localhost. Static shell caching does not make attendance writes offline-capable. Mobile users must reconnect before saving. Replace the provided brand icon with your approved logo if desired.

## Screenshots and future scope

Screenshot slot: `docs/screenshots/` can hold approved mobile Today and desktop Dashboard captures. The current interface uses a black sidebar, white surfaces, gold accents, text status badges, and an accessible mobile status sheet.

Future modules can extend the existing users, teams, and agents: listing targets, performance reporting, and leader scorecards. Payroll, CRM, agent login, GPS, approvals, chat, and commission tracking are intentionally outside this version.
