# MetaPay Agencies

A professional task management SaaS platform for digital agencies in Kenya. Users register, choose a subscription package, pay via Paynecta, and get access to a full task management dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/metapay run dev` — run the frontend (port 23813)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Default Login Credentials

- **Admin:** `admin@metapay.com` / `admin123`
- Admin has full access including the `/admin` panel to manage all users

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (stored in localStorage as `metapay_token`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Database schema (users, packages, subscriptions, tasks)
- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/metapay/src/` — React frontend
- `artifacts/metapay/src/lib/auth.tsx` — Auth context & token management
- `artifacts/metapay/src/pages/` — All pages (login, register, packages, payment, dashboard, tasks, admin)

## Architecture decisions

- JWT tokens stored in localStorage, injected into every API request via `setAuthTokenGetter` from api-client-react
- Paynecta payment URL is embedded in an iframe on the /payment page; account activation happens via webhook POST to `/api/webhooks/paynecta`
- Webhook verifies the `x-webhook-signature` header against `PAYNECTA_WEBHOOK_SECRET`
- On successful payment webhook: subscription status → active, user status → active
- 200 tasks pre-seeded across 10 categories with varied priorities, statuses, assignees, and due dates

## Product

- **Auth flow:** Register → Choose Package → Pay via Paynecta iframe → Account activates → Dashboard
- **Task management:** Create, edit, delete, filter, search, complete tasks
- **Dashboard:** Stats overview (total, completed, pending, in-progress, overdue), recent tasks feed
- **Admin panel:** List all users, change user status (active/inactive/suspended)
- **Packages:** Starter (KES 999/mo), Professional (KES 2,499/mo), Enterprise (KES 4,999/mo)

## Payment Integration

- Provider: Paynecta
- API Key env: `PAYNECTA_API_KEY`
- Webhook Secret env: `PAYNECTA_WEBHOOK_SECRET`
- Payment URL env: `PAYNECTA_PAYMENT_URL` (default: https://paynecta.co.ke/pay/metapay-agencies)
- Webhook endpoint: `POST /api/webhooks/paynecta`
- Reference format: `sub_{subscriptionId}&user={userId}`

## User preferences

- 200 tasks seeded at startup
- Admin default credentials: admin@metapay.com / admin123
- Payment provider: Paynecta (Kenya)
- Webhook secret: stored in PAYNECTA_WEBHOOK_SECRET env var

## Gotchas

- Run `pnpm run typecheck:libs` after any DB schema change before typechecking api-server
- The admin user is seeded with bcrypt hash — password is "admin123"
- Paynecta webhook needs `x-webhook-signature` header matching PAYNECTA_WEBHOOK_SECRET, or no header (permissive)
- After payment, the frontend polls `/api/auth/me` every 3s until `status === "active"`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
