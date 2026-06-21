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

For a remote database that has `20260620233000` but not `20260621150000`, mark the baseline and push only the new migration:

```bash
npx supabase migration repair --linked --status applied 20260620233000
npx supabase db push --linked
```

Do not run `db:reset --linked`; it destroys remote data.

### Migration `20260621150000` — Admin booking operations

Adds two service-role-only RPCs:

- **`create_admin_booking`** — same 9 arguments as `create_booking`; calls it in a transaction then marks `source = 'ADMIN'` on the inserted row.
- **`reschedule_booking(p_booking_id, p_date, p_time)`** — atomically moves a reschedulable booking to a new slot. Raises: `BOOKING_NOT_FOUND`, `BOOKING_NOT_RESCHEDULABLE`, `BOOKING_IN_PAST`, `BOOKING_RESCHEDULE_NO_CHANGE`, `BOOKING_CONFLICT`.

Both functions: `revoke all from public; grant execute to service_role`. No public endpoint or anonymous client can invoke them.

### Local RPC smoke tests

After `db:reset`, verify the new RPCs against the local stack:

```bash
npx supabase db query --local --file tests/supabase-admin-booking-rpc.sql
```

The script finds an active service, creates a booking via `create_admin_booking`, asserts `source = 'ADMIN'`, reschedules it, asserts the change, verifies the idempotent-reschedule guard, then cleans up.

## Application checks

```bash
npm run lint
npm run typecheck
npm test
npm run cf:build
```

The application intentionally does not start development or preview servers as part of these checks.

### Full local acceptance sequence (feat/admin-booking-operations)

```bash
npm run lint && npm run typecheck && npm test && npm run cf:build
npx supabase db reset --local
npx supabase db query --local --file tests/supabase-admin-booking-rpc.sql
```

All six commands must exit 0 before applying migrations to the hosted project.

## Admin booking operations

Authenticated admins at `/admin` can:

- **Create a booking** — "Новий запис" button opens a sheet: select service, Kyiv date, available slot, then enter client name, phone, and optional Instagram/Telegram/comment. POSTs to `POST /api/admin/bookings`; source is recorded as `ADMIN`.
- **View and manage bookings** — day-navigation workspace at `/admin/bookings`. Tap a card to open the detail sheet: view client contacts, add notes, advance the booking status, or reschedule. Status transitions are enforced by `assertBookingStatusTransition`; rescheduling uses `reschedule_booking` RPC.
- **Delete schedule blocks** — tap the trash icon next to any upcoming block in `/admin/schedule` and confirm; calls `DELETE /api/admin/schedule/[id]`.

All mutation endpoints call `getAdminProfileForApi()` first and return 401 if the session is missing or expired.

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
