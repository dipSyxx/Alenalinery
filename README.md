# Alenalinery

Initial production foundation for a beauty studio in Uman, Ukraine. The public product is Ukrainian-first; technical code, routes, database names, and operational documentation are English.

## What is included

- Premium, responsive public pages: `/`, `/services`, `/booking`, and `/booking/success`.
- Guest booking with service-driven, server-calculated time slots in `Europe/Kyiv`.
- Prisma/PostgreSQL schema, migration, and representative seed data.
- Supabase Auth login plus server-side ADMIN profile authorization for `/admin/*`.
- Admin foundation for today's bookings, bookings list, service catalog, working hours, and schedule blocks.
- Extension seams for payments, notifications, portfolio, products, orders, and client hair history.

The public site deliberately uses labelled image areas rather than invented stock photography. Replace them with the studio's actual media when it is ready.

## Architecture

```text
Public browser
  ├─ GET /api/services ──────────────┐
  ├─ GET /api/availability ──────────┼─ Next.js server ── Prisma ── Supabase PostgreSQL
  └─ POST /api/bookings ─────────────┘        │
                                               └─ Supabase Auth cookies (admin only)
```

- `src/lib/booking/availability.ts` is a pure, unit-tested scheduling engine.
- `src/lib/booking/create-booking.ts` validates data, resolves all service values on the server, checks availability twice, and reuses clients by normalized phone number.
- `src/lib/booking/prisma-repository.ts` maps that domain contract to Prisma transactions.
- `src/lib/auth/admin.ts` validates Supabase Auth claims and the ADMIN `Profile` on every protected server page/API route. `src/proxy.ts` only refreshes sessions and provides a first redirect layer; it is not used as the sole authorization control.
- Prisma is used only in the Next.js server/API layer. There is no Worker implementation in this MVP.

## Booking model and availability rules

The business timezone is `Europe/Kyiv`; all persisted schedule fields use `timestamptz`.

- Slots are generated in 30-minute increments.
- A selectable slot must fit within working hours after applying service duration and both buffers.
- `occupiedFrom` includes a before-buffer and `occupiedUntil` includes the service duration plus after-buffer.
- Existing `PENDING_CONFIRMATION`, `PENDING_PAYMENT`, `CONFIRMED`, and `COMPLETED` bookings block availability. `CANCELLED`, `EXPIRED`, and `NO_SHOW` do not.
- Schedule blocks overlap against the full occupied interval.
- Booking submission repeats the availability check inside a Prisma transaction.
- The migration also adds PostgreSQL `btree_gist` plus a partial exclusion constraint over the active booking range. This is the final concurrency safeguard if two booking requests pass the application check simultaneously.

The client never sends an end time, price, deposit amount, or booking status. The API resolves those values from the active `Service` record.

## Local setup

Prerequisites: Node.js 20.9+ (Node 24 is supported), a Supabase project, and database connection strings with enough privileges to apply the migration.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and replace every placeholder. Do not commit `.env`.

3. Generate Prisma Client, deploy the checked-in migration, and seed the operational defaults:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   npm run db:seed
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Recommended current browser/server Auth key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy alternative if the project has not moved to publishable keys. One public key is required. |
| `DATABASE_URL` | Pooled PostgreSQL connection for Prisma application traffic. |
| `DIRECT_URL` | Direct PostgreSQL connection used by Prisma migrations. |
| `SUPABASE_SERVICE_ROLE_KEY` | Not used by this MVP. Keep server-only if a future server administration task genuinely needs it. |

`SUPABASE_SERVICE_ROLE_KEY` must never use the `NEXT_PUBLIC_` prefix or appear in a client component.

## Supabase setup

1. Create a Supabase project and enable email/password sign-in under **Auth**.
2. Copy the URL and either the recommended publishable key or the legacy anon key into `.env`.
3. Use the direct connection URI for `DIRECT_URL`; use the Supabase pooler URI for `DATABASE_URL` when appropriate for the selected pooler mode.
4. Apply the migration before creating data. It creates the required enums, tables, indexes, RLS policies, `auth.users` foreign key for profiles, and the booking exclusion constraint.
5. Run the seed command. It creates the requested categories, representative services, and Tuesday–Saturday `10:00–18:00` schedule. It never creates customer data.

### RLS and access model

Every `public` schema table has RLS enabled by the migration. `anon` and `authenticated` have read access only to active service categories and active services. They cannot read or write clients, bookings, operating hours, schedule blocks, or profiles through Supabase Data APIs.

Public booking creation always goes through `POST /api/bookings` in Next.js, where Zod validation, price calculation, schedule logic, and transaction checks are enforced.

### Create the first admin

1. Create the owner account in Supabase Auth with email/password.
2. Copy the Auth user's UUID from the Supabase dashboard.
3. Insert the corresponding profile using the SQL editor or a privileged SQL connection:

   ```sql
   insert into public."Profile" ("id", "displayName")
   values ('<supabase-auth-user-uuid>', 'Олена');
   ```

4. Sign in at `/admin/login`.

The profile defaults to `ADMIN`. The data model preserves the `role` enum so additional roles can be introduced later.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run prisma:validate
npm run prisma:generate
npm run db:seed
npm run build
```

## Booking status lifecycle

New website requests begin as `PENDING_CONFIRMATION`.

```text
PENDING_CONFIRMATION → CONFIRMED → COMPLETED
         │                    │
         ├──→ CANCELLED       ├──→ NO_SHOW
         └──→ PENDING_PAYMENT → EXPIRED / CONFIRMED
```

Payments are not implemented yet. `PENDING_PAYMENT`, `PaymentStatus`, and `depositAmountUah` exist so an invoice workflow can be introduced without reshaping booking data.

## Future Monobank / Cloudflare design

No payment processing or Worker deployment exists in this iteration.

1. Monobank will send payment webhooks to a Cloudflare Worker.
2. The Worker will verify the Monobank webhook signature.
3. The Worker will call a protected Next.js API endpoint.
4. That Next.js endpoint will use Prisma to update payment and booking status.
5. The endpoint will be idempotent, keyed by a future unique invoice ID.

Prisma remains in Next.js; it must not run inside the Cloudflare Worker.

## Next steps

- Monobank invoices, deposits, and idempotent webhook processing.
- Telegram/email notifications and booking reminders.
- Studio portfolio backed by Supabase Storage.
- Product catalog, orders, and checkout.
- Client hair history and richer CRM notes.
- Full admin CRUD for services and calendar presentation.
