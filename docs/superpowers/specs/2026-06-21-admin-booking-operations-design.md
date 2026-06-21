# Admin Booking Operations Design

## Goal

Make the Alenalinery owner dashboard a mobile-first operational tool for managing daily appointments. The owner must be able to view today's work, inspect an appointment, contact a client, update its status and private notes, create manual bookings, reschedule an appointment, and manage accidental schedule blocks.

## Product Decisions

- The primary device is a phone.
- The default admin screen is `/admin` ("Сьогодні"), not a calendar grid.
- `/admin/bookings` provides a selected-day timeline. It is not a drag-and-drop week calendar.
- Appointment details open in a mobile bottom sheet.
- Service catalogue editing, payments, Telegram bot notifications, portfolio, store, and loyalty features are out of scope.
- The application has one owner/admin and one service provider.

## Navigation

Mobile navigation is a persistent bottom bar with:

1. **Сьогодні** (`/admin`) — active appointments for the Kyiv business date and quick actions.
2. **Записи** (`/admin/bookings`) — selected-day agenda, date selection and status filters.
3. **Графік** (`/admin/schedule`) — work hours and schedule blocks.
4. **Послуги** (`/admin/services`) — read-only service catalogue in this phase.

Desktop navigation may retain the existing sidebar, with equivalent destinations.

## Appointment Workspace

A reusable client component receives serialized appointment records from server pages. Selecting a record opens a shadcn `Sheet` from the bottom on mobile.

The detail sheet displays:

- appointment date/time in `Europe/Kyiv`;
- client name, normalized phone, optional Instagram and Telegram;
- service name, duration, price and client comment;
- current status;
- private owner notes.

It provides:

- `tel:` link for the phone number;
- Telegram link only when a valid Telegram username exists;
- explicit “save notes” action;
- status actions appropriate to the current lifecycle;
- reschedule entry point;
- cancellation confirmation.

The initial lifecycle used in this phase is:

```text
PENDING_CONFIRMATION -> CONFIRMED -> COMPLETED
       |                    |
       +-> CANCELLED        +-> CANCELLED / NO_SHOW
```

The existing payment states remain in the database for later Monobank work. The admin API must reject a transition that is not in the allowed transition map. A cancellation records `cancelledAt`.

## Day Agenda

The appointments page uses Kyiv dates and a date picker/next-prev controls. It renders a chronological agenda, not a desktop-only monthly calendar. It supports filtering by active, completed, cancelled and all statuses. Empty, loading and mutation-error states are explicit.

The dashboard shows today's active and pending appointments plus a prominent “Додати запис” command.

## Manual Booking

The admin can create an appointment for phone, Instagram or walk-in requests. The form collects the same required client details as the public booking flow, uses the same services and availability endpoint, and calls the existing server booking route/RPC. It does not trust price or duration supplied by the browser.

## Rescheduling

Rescheduling receives a booking id, requested Kyiv date and time. It is implemented with a new server-only PostgreSQL RPC, not a client-side cancellation plus new booking.

The RPC must run in one transaction and:

1. lock/load the target active booking and service;
2. derive the occupied range from the stored service duration and buffers;
3. validate future time, working hours and schedule blocks;
4. reject collisions against other active bookings while excluding itself;
5. update `startAt`, `occupiedFrom`, and `occupiedUntil`;
6. rely on the existing booking exclusion constraint as the final concurrency guard.

The worker maps RPC conflicts to HTTP 409 and validation failures to HTTP 400. The appointment remains unchanged on every failed reschedule.

## Schedule Blocks

The existing working-hours and block creation experience remains. Add an authenticated delete endpoint and an explicit confirmation control for future schedule blocks. A deleted block immediately changes public availability.

## Security and Data Access

- Keep all database reads and mutations inside existing Next.js routes/server components using the server-only Supabase service-role client.
- Keep `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare Worker secrets only.
- Continue to require `getAdminProfileForApi()` for every admin mutation.
- Keep public booking creation routed through server validation and the database RPC.
- Do not add a database TCP client, Prisma or a browser service-role client.

## Test Strategy

- Unit-test the status-transition map, timezone conversion helpers and API payload validation.
- Test unauthenticated admin endpoints return 401.
- Test invalid status transitions return 400 and do not mutate a booking.
- Test API mapping: successful reschedule 200, unavailable time 409, invalid input 400.
- Test the new reschedule RPC locally against Supabase: success, overlapping booking, schedule block, outside hours and self-exclusion.
- Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run cf:build`.

## Completion Criteria

The owner can complete the entire phone workflow:

1. Open `/admin` and see today’s appointments.
2. Open a client record and call or open Telegram where available.
3. Confirm, complete, cancel or mark no-show with valid state transitions.
4. Save private notes.
5. Add a manual booking.
6. Reschedule an existing booking without creating a duplicate or overlap.
7. Add and delete a schedule block, then confirm public availability changes.
