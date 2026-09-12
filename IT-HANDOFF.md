# Seven Century Attendance — IT handoff

Start with this file, then read `README.md` for the full architecture and setup.

## What is included

- React/Vite frontend and installable PWA configuration.
- Node.js/Fastify API with HTTP-only session cookies, role and team authorization.
- Prisma schema and two PostgreSQL migrations.
- Development seed: four users, three teams, 24 agents and 12 days of sample records.
- Dockerfile, local Docker Compose, environment template, and tests.

The source archive intentionally excludes `.env`, passwords, local database contents, `node_modules`, build output, and Git history. All sample people and attendance are demo data. Do not copy the running demo database into production.

## 1. Upload to a private GitHub repository

Extract the ZIP into a new folder and create an empty private GitHub repository in the company's organization. From the extracted folder:

```sh
git init
git add .
git commit -m "Initial Seven Century attendance application"
git branch -M main
git remote add origin <YOUR_PRIVATE_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Review the staged files before committing. Keep `.env`, `.local`, database dumps, and credentials out of GitHub. `.gitignore` is included. No repository has been created or pushed as part of this handoff.

## 2. Hosting requirements

Use a host supporting a persistent **Node.js 24 process**, PostgreSQL, HTTPS, and WebSocket connections. Uploading only the frontend files to ordinary static/PHP hosting is insufficient.

Recommended topology:

```
https://attendance.your-company-domain.com
              |
       HTTPS reverse proxy
              |
       Fastify on port 3001
       /          built React app
       /api       REST API
       /socket.io realtime
              |
       private PostgreSQL
```

Keep the database off the public internet. Use one API instance initially. Multiple API instances require a shared Socket.IO adapter and rate-limit store.

## 3. Configure and deploy

Install dependencies including development tools for the build:

```sh
npm ci
```

Copy `.env.example` to a private `.env`, or configure equivalent environment variables in the host. Set:

```dotenv
NODE_ENV=production
DATABASE_URL=postgresql://APP_USER:STRONG_PASSWORD@PRIVATE_DB_HOST:5432/attendance
WEB_URL=https://attendance.your-company-domain.com
API_URL=https://attendance.your-company-domain.com
HOST=127.0.0.1
PORT=3001
SESSION_SECRET=GENERATE_A_LONG_RANDOM_SECRET
COOKIE_DOMAIN=
SEED_ALLOW=false
```

`WEB_URL` must exactly match the browser origin, with no trailing slash. Use `HOST=0.0.0.0` only when the container or hosting platform requires it. Do not set `MOBILE_PREVIEW_ORIGIN` in production; it is a development-only option. Generate the session secret using a password manager or:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Apply migrations with a migration-capable database account, then build:

```sh
npm run db:migrate
npm run build
```

Create the first production administrator on the empty database. Supply `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` securely as environment variables, then run:

```sh
npm exec tsx -- scripts/bootstrap-admin.ts
```

Remove these three bootstrap variables afterward. Do not run the development seed in production. Start the app with a process supervisor or your host's service manager:

```sh
npm start
```

Configure TLS and WebSocket forwarding in the reverse proxy. The application serves the frontend and API from the same origin, which is required by its cookie/origin design. Run the service from the repository root so it can find `apps/web/dist`.

The Dockerfile builds and runs the same application. Docker Compose is primarily a local development convenience; replace its development database password before using it in any shared environment. Run migrations as a release step, not concurrently from multiple app containers.

## 4. Email and operational setup

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` for actual password-reset email delivery. Without SMTP, the endpoint returns a generic response but sends no message. Verify sender authentication and delivery before onboarding staff.

After signing in as the initial administrator, create real leaders, teams and agents through the application. Create accounts with strong initial passwords and distribute them through the company's approved channel. Configure the attendance deadline in Settings. Dubai remains the fixed business timezone.

Set up PostgreSQL backups and restore tests, TLS to a remote database, service restart on reboot, log retention, and health monitoring at `/api/health`. Use a restricted database account for normal application runtime and a separate account for migrations. Configure trusted reverse-proxy handling for your exact topology if per-client-IP rate limiting is needed; the current server does not blindly trust forwarded headers.

## 5. Verification status and release checklist

Verified during development:

- 9 unit/component tests passed.
- 11 Fastify integration tests passed against real local PostgreSQL.
- Production build passed before the final mobile-origin addition.
- TypeScript check passed after the mobile-origin addition.
- Admin login/dashboard and Team Leader login were checked in the browser.
- A Team Leader status change saved, incremented completion, and persisted after reload at a 390px mobile viewport.

Still required by IT before production release:

- Run the checks below on the final extracted source and target environment.
- Run the authored Playwright suite. Its launch was blocked by the development environment's automatic approval/usage review, so the full suite has **not** been verified.
- Test SMTP reset delivery, real-device network access, HTTPS cookies, PWA installation, WebSocket delivery, backup/restore, and your reverse proxy configuration.
- Review and approve the implementation for your organization's production security requirements.

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Integration tests require a separate disposable database named `attendance_test`; they truncate its test data. E2E tests require the running seeded development app, `DEMO_PASSWORD`, and Microsoft Edge, or adjustment of `playwright.config.ts` to installed Chromium. Never run test seed/reset workflows against production.

This is a source-code handoff, not an already-hosted production service. The private Wi-Fi URL used for the demo is temporary and is not the production address.
