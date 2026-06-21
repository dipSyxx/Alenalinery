# Alenalinery

Production foundation for a beauty studio in Uman, Ukraine. The public product is Ukrainian-first; routes, database names, and operating documentation are English.

## Architecture

```text
Browser
  ├─ Supabase Auth ── publishable key
  └─ Next.js on Cloudflare Workers
       ├─ server Supabase client ── service_role secret ── PostgREST / RPC
       └─ Supabase PostgreSQL
            ├─ SQL migrations in supabase/migrations/
            └─ seed data in supabase/seed.sql
```

The Worker is the only application component that performs data mutations. Browser code calls the existing Next.js routes; those routes use HTTPS through `@supabase/supabase-js`, not PostgreSQL TCP, `pg`, or Prisma.

## Booking integrity

`public.create_booking` is a PostgreSQL RPC function called only with the Worker service-role client. In one database transaction it:

- loads the active service and derives duration, buffers, price, and deposit;
- converts the requested Kyiv date/time to `timestamptz`, validates working hours and past times;
- rejects overlaps with schedule blocks and active bookings;
- finds or creates the client by normalized phone; and
- inserts the booking under the partial exclusion constraint on its occupied range.

The pre-insert checks return a useful conflict response. The exclusion constraint is the final guard against two concurrent requests booking the same interval.

All public tables have RLS enabled. `anon` and `authenticated` can only read active services; the booking RPC has no public execute permission. `SUPABASE_SERVICE_ROLE_KEY` is read only by `src/lib/supabase/service.ts`, which is explicitly server-only.

## Environment and Cloudflare secrets

Copy [`.env.example`](.env.example) to `.env.local` for Next.js development, or [`.dev.vars.example`](.dev.vars.example) to `.dev.vars` for Wrangler. Set the service-role value locally; do not commit either ignored file.

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Worker variable and local env | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Worker variable and local env | Public browser/Auth key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker secret and local env | Privileged server-only PostgREST/RPC access. |

The two public variables are declared in [`wrangler.jsonc`](wrangler.jsonc). Before deployment, store the privileged key outside source control:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## Database workflow

The Supabase CLI project is configured in [`supabase/config.toml`](supabase/config.toml). Fresh local databases apply migrations and [`supabase/seed.sql`](supabase/seed.sql) together:

```bash
npm install
npx supabase start
npm run db:reset
```

For a new hosted project, authenticate, link it, then push migrations and the representative operational seed data:

```bash
npx supabase login
npx supabase link --project-ref koceyimuvlntuaptfijk
npx supabase db push --linked --include-seed
```

For an existing database that already received the former Prisma migrations, first back it up and confirm its schema matches the checked-in baseline. Then record only the equivalent baseline as applied, so `db push` applies the new trigger/RPC migration without recreating tables:

```bash
npx supabase link --project-ref koceyimuvlntuaptfijk
npx supabase migration repair --linked --status applied 20260620233000
npx supabase db push --linked --include-seed
```

Do not run `db:reset --linked`; it destroys remote data.

## Application checks

```bash
npm run lint
npm run typecheck
npm test
npm run cf:build
```

The application intentionally does not start development or preview servers as part of these checks.

## Create the first admin

Create the owner account in Supabase Auth, then insert its Auth UUID into the profile table from the Supabase SQL editor:

```sql
insert into public."Profile" ("id", "displayName")
values ('<supabase-auth-user-uuid>', 'Олена');
```

The profile defaults to the `ADMIN` role. Sign in at `/admin/login`.

## Booking status lifecycle

```text
PENDING_CONFIRMATION → CONFIRMED → COMPLETED
         │                    │
         ├──→ CANCELLED       ├──→ NO_SHOW
         └──→ PENDING_PAYMENT → EXPIRED / CONFIRMED
```

Payments, notifications, portfolio media, products, and richer CRM workflows remain future additions. New server-side extensions must continue to use the service-role client or narrowly permissioned Supabase RPC functions; never add database TCP clients to the Worker.
