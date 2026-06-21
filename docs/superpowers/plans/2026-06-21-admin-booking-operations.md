# Admin Booking Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Alenalinery owner dashboard into a mobile-first tool for managing, creating, rescheduling, and completing bookings without allowing overlaps.

**Architecture:** Keep all reads and mutations inside Next.js server routes and components on the Cloudflare Worker, using the existing server-only Supabase service-role client. The browser renders UI and calls protected routes. PostgreSQL remains the source of truth for booking integrity: existing create_booking stays public-booking source, create_admin_booking marks a manual booking, and reschedule_booking moves an appointment atomically.

**Tech Stack:** Next.js 16, React 19, TypeScript, shadcn/ui, Tailwind CSS, date-fns, date-fns-tz, Supabase PostgREST/RPC, PostgreSQL migrations, Vitest, OpenNext, Cloudflare Workers.

---

## Rules That Must Not Change

- Keep SUPABASE_SERVICE_ROLE_KEY only in the Cloudflare Worker secret store and ignored local env files.
- Keep Europe/Kyiv as the business time zone from src/lib/timezone.ts.
- Preserve Booking_active_occupied_range_excl as final protection from overlaps.
- Preserve public POST /api/bookings behavior and WEBSITE source.
- Do not introduce Prisma, pg, database TCP, browser service-role access, payments, bot notifications, store, portfolio, catalogue editing, or drag-and-drop calendar.

## File Map

| Path | Responsibility |
| --- | --- |
| src/lib/admin/booking-status.ts | New pure lifecycle and allowed transition map. |
| src/lib/validation/admin.ts | Validate manual booking and reschedule payloads. |
| src/lib/data/supabase.ts | Full admin record shape, status update enforcement, RPC calls, delete block. |
| src/lib/booking/create-supabase-booking.ts | Select public or admin creation RPC. |
| supabase/migrations/20260621150000_admin_booking_operations.sql | New create_admin_booking and reschedule_booking RPCs. |
| src/app/api/admin/bookings/route.ts | Keep GET; add protected POST manual creation. |
| src/app/api/admin/bookings/[id]/route.ts | Guarded notes and lifecycle PATCH. |
| src/app/api/admin/bookings/[id]/reschedule/route.ts | Guarded atomic reschedule PATCH. |
| src/app/api/admin/schedule/[id]/route.ts | Guarded DELETE schedule block. |
| src/components/admin-booking-sheet.tsx | Mobile details, notes, contact, status and reschedule sheet. |
| src/components/admin-bookings-workspace.tsx | Date agenda, filtering, selected booking and refresh. |
| src/components/admin-manual-booking-sheet.tsx | Admin-created booking form. |
| src/components/admin-shell.tsx | Mobile bottom navigation. |
| src/components/schedule-editor.tsx | Confirmation and delete block action. |
| src/app/admin/(protected)/page.tsx | Today workspace. |
| src/app/admin/(protected)/bookings/page.tsx | Selected-day agenda. |
| tests/admin-booking-status.test.ts | Lifecycle tests. |
| tests/admin-validation.test.ts | Input tests. |
| tests/admin-api.test.ts | API guard and error-mapping tests. |
| tests/supabase-admin-booking-rpc.sql | Local RPC smoke tests. |

### Task 1: Define booking lifecycle and input validation

**Files:**
- Create: src/lib/admin/booking-status.ts
- Modify: src/lib/validation/admin.ts
- Create: tests/admin-booking-status.test.ts
- Create: tests/admin-validation.test.ts

- [ ] **Step 1: Add failing lifecycle tests.**

Create tests asserting:
- PENDING_CONFIRMATION permits CONFIRMED, CANCELLED and NO_SHOW.
- CONFIRMED permits COMPLETED, CANCELLED and NO_SHOW.
- PENDING_PAYMENT permits CONFIRMED, CANCELLED and EXPIRED.
- COMPLETED, CANCELLED, NO_SHOW and EXPIRED have no allowed next state.
- completed to confirmed throws BookingStatusTransitionError.

Use this exact expected map:

```ts
const transitions = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  EXPIRED: [],
} as const;
```

Also test bookingRescheduleSchema accepts { date: "2026-06-24", time: "13:30" } and rejects malformed date or time. Test adminBookingCreateSchema requires UUID serviceId, ISO date, 24-hour time, name and phone.

- [ ] **Step 2: Run only new tests and confirm failure.**

Run:

```bash
npm test -- tests/admin-booking-status.test.ts tests/admin-validation.test.ts
```

Expected: failure due to missing modules/exports.

- [ ] **Step 3: Implement src/lib/admin/booking-status.ts.**

Export:
- bookingStatuses tuple containing all current database enum values.
- BookingStatus type derived from the tuple.
- getAllowedBookingStatuses(status).
- BookingStatusTransitionError with Ukrainian message "Недопустима зміна статусу запису."
- assertBookingStatusTransition(current, next), which rejects same-state and absent-map transitions.

In src/lib/validation/admin.ts import bookingStatuses and replace the inline enum with z.enum(bookingStatuses). Add:

```ts
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const bookingRescheduleSchema = z.object({
  date: z.string().regex(datePattern),
  time: z.string().regex(timePattern),
});

export const adminBookingCreateSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(datePattern),
  time: z.string().regex(timePattern),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  email: z.string().trim().email().optional().or(z.literal("")),
  instagram: z.string().trim().max(100).optional().or(z.literal("")),
  telegram: z.string().trim().max(100).optional().or(z.literal("")),
  clientComment: z.string().trim().max(1000).optional().or(z.literal("")),
});
```

Phone normalization stays in normalizeUkrainianPhone; do not duplicate it in Zod.

- [ ] **Step 4: Run focused tests.**

Run:

```bash
npm test -- tests/admin-booking-status.test.ts tests/admin-validation.test.ts
```

Expected: all lifecycle and validation cases pass.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/admin/booking-status.ts src/lib/validation/admin.ts tests/admin-booking-status.test.ts tests/admin-validation.test.ts
git commit -m "feat(admin): define booking lifecycle rules"
```

### Task 2: Create safe database RPCs

**Files:**
- Create: supabase/migrations/20260621150000_admin_booking_operations.sql
- Create: tests/supabase-admin-booking-rpc.sql

- [ ] **Step 1: Write local SQL smoke test first.**

The script must run only against local Supabase. It must:
1. select one active Service ID;
2. create a future manual booking through create_admin_booking;
3. assert source equals ADMIN;
4. reschedule that same booking to another valid free time;
5. assert startAt changed;
6. try an identical move and assert BOOKING_RESCHEDULE_NO_CHANGE;
7. delete the test Booking and Client by phone.

Never run this script against the linked project.

- [ ] **Step 2: Implement create_admin_booking.**

Create a function with exactly the same nine arguments as create_booking:
service id, date, time, client name, phone, email, Instagram, Telegram and client comment.

Inside one transaction:
1. call public.create_booking with those values;
2. update only returned Booking row, set source to ADMIN;
3. return the updated Booking row.

End migration with:

```sql
revoke all on function public.create_admin_booking(uuid, date, time without time zone, text, text, text, text, text, text) from public;
grant execute on function public.create_admin_booking(uuid, date, time without time zone, text, text, text, text, text, text) to service_role;
```

- [ ] **Step 3: Implement reschedule_booking.**

Create public.reschedule_booking with booking UUID, Kyiv date and local time. It returns setof public."Booking", is plpgsql and sets search_path to public, extensions.

Implement in this order:
1. reject null parameters with INVALID_RESCHEDULE_INPUT;
2. select Booking for update; unknown id raises BOOKING_NOT_FOUND;
3. permit only PENDING_CONFIRMATION, PENDING_PAYMENT, CONFIRMED; other statuses raise BOOKING_NOT_RESCHEDULABLE;
4. load existing Service without filtering isActive;
5. convert requested Kyiv local date/time to timestamptz;
6. reject past date/time with BOOKING_IN_PAST;
7. reject same start time with BOOKING_RESCHEDULE_NO_CHANGE;
8. derive endAt, occupiedFrom, occupiedUntil from Service duration and buffers;
9. validate WorkingHours day and full occupied range;
10. reject intersecting ScheduleBlock;
11. reject intersecting active Booking with a different id;
12. update startAt, endAt, occupiedFrom, occupiedUntil and return the row;
13. translate exclusion_violation into BOOKING_CONFLICT.

Active conflicts are PENDING_CONFIRMATION, PENDING_PAYMENT, CONFIRMED and COMPLETED, matching the existing exclusion constraint.

- [ ] **Step 4: Apply and test locally.**

Run:

```bash
npx supabase start
npm run db:reset
npx supabase db execute --local --file tests/supabase-admin-booking-rpc.sql
```

Expected: migration applies; script exits 0. If the chosen date is outside seeded working hours, fix test date calculation, not the RPC validation.

- [ ] **Step 5: Verify permissions.**

Run in the local SQL editor:

```sql
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('create_booking', 'create_admin_booking', 'reschedule_booking')
order by routine_name, grantee;
```

Expected: only service_role has EXECUTE on each RPC.

- [ ] **Step 6: Commit.**

```bash
git add supabase/migrations/20260621150000_admin_booking_operations.sql tests/supabase-admin-booking-rpc.sql
git commit -m "feat(db): add admin booking RPCs"
```

### Task 3: Extend data access and APIs

**Files:**
- Modify: src/lib/data/supabase.ts
- Modify: src/lib/booking/create-supabase-booking.ts
- Modify: src/app/api/admin/bookings/route.ts
- Modify: src/app/api/admin/bookings/[id]/route.ts
- Create: src/app/api/admin/bookings/[id]/reschedule/route.ts
- Create: src/app/api/admin/schedule/[id]/route.ts
- Create: tests/admin-api.test.ts

- [ ] **Step 1: Write failing API tests.**

Mock getAdminProfileForApi and repository functions. Assert:
- every admin mutation returns 401 before parsing body without an admin;
- invalid manual booking body returns 400;
- manual creation returns 201 with booking;
- invalid status transition returns 400 and repository update is not called;
- malformed reschedule returns 400;
- BookingConflictError while rescheduling returns 409;
- unknown booking returns 404;
- unauthenticated schedule DELETE returns 401;
- authenticated schedule DELETE returns 204.

- [ ] **Step 2: Expand AdminBookingRecord in src/lib/data/supabase.ts.**

Use this record shape:

```ts
type AdminBookingRecord = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  source: "WEBSITE" | "ADMIN";
  totalPriceUah: number;
  clientComment: string | null;
  adminNotes: string | null;
  cancelledAt: Date | null;
  client: { id: string; name: string; phone: string; instagram: string | null; telegram: string | null };
  service: { id: string; name: string; durationMinutes: number; basePriceUah: number };
};
```

Update getAdminBookings to select all fields and batch-load Client/Service fields. Add ascending boolean option for day agenda. Add getAdminBookingById, rescheduleAdminBooking and deleteScheduleBlock. Keep data helpers server-only.

When updateAdminBooking receives a status:
1. read current booking;
2. assert lifecycle transition;
3. only set cancelledAt when target is CANCELLED;
4. let note-only updates leave cancelledAt unchanged;
5. reject absent mutation values.

Map database RPC codes to BookingConflictError, BookingValidationError or a dedicated not-found error before route code handles them.

- [ ] **Step 3: Add source-aware creation.**

Change createSupabaseBooking to accept source argument defaulting to WEBSITE. Use create_booking for WEBSITE and create_admin_booking for ADMIN. Preserve the existing payload normalization and errors.

Add POST to /api/admin/bookings:
1. check admin;
2. parse adminBookingCreateSchema;
3. call createSupabaseBooking(payload, ADMIN);
4. return booking with 201;
5. map validation to 400, conflict to 409, unexpected to 500.

GET remains the existing authenticated list endpoint.

- [ ] **Step 4: Add reschedule and block deletion routes.**

PATCH /api/admin/bookings/[id]/reschedule:
- check admin;
- validate route UUID and bookingRescheduleSchema;
- return 200 booking, 400 validation, 404 not found, 409 conflict;
- never return raw Supabase error text.

DELETE /api/admin/schedule/[id]:
- check admin;
- validate UUID;
- delete block;
- return 204 without body;
- return 404 for absent block.

Keep PATCH /api/admin/bookings/[id] for notes/status. It must return 400 for invalid lifecycle change.

- [ ] **Step 5: Run route tests.**

Run:

```bash
npm test -- tests/admin-api.test.ts tests/admin-routes.test.ts tests/create-booking.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/data/supabase.ts src/lib/booking/create-supabase-booking.ts src/app/api/admin/bookings src/app/api/admin/schedule tests/admin-api.test.ts
git commit -m "feat(admin): add booking operations APIs"
```

### Task 4: Build mobile workspace

**Files:**
- Create: src/components/admin-booking-sheet.tsx
- Create: src/components/admin-bookings-workspace.tsx
- Create: src/components/admin-manual-booking-sheet.tsx
- Modify: src/components/admin-shell.tsx
- Modify: src/app/admin/(protected)/page.tsx
- Modify: src/app/admin/(protected)/bookings/page.tsx
- Modify: src/components/booking-status-badge.tsx

- [ ] **Step 1: Implement contact-safe helpers.**

AdminBookingView must serialize Date values to ISO strings before passing server data into client components. Add getTelegramHref(handle), stripping one leading at-sign and returning an external URL only if the remaining username matches letters, digits and underscore, length 5 through 32. Phone uses a tel link.

- [ ] **Step 2: Implement AdminBookingSheet.**

Use shadcn Sheet, AlertDialog, Textarea, Button, Badge, Separator, Calendar and Popover. Sheet opens from the bottom on mobile.

It renders Kyiv date/time, service duration/price, client name, phone, optional comment, call link, conditional Telegram link and editable admin notes.

It supplies:
- explicit save notes action;
- buttons only for getAllowedBookingStatuses;
- cancellation AlertDialog;
- mode details or reschedule in the same sheet, never a nested sheet;
- reschedule date picker and available slots from existing /api/availability;
- reschedule PATCH request;
- destructive alert with returned message after any failed mutation;
- Sonner toast and router.refresh after successful mutation.

- [ ] **Step 3: Implement AdminManualBookingSheet.**

Load services from /api/services and slots from existing /api/availability. Form required values: service, Kyiv date/time, name, phone. Optional: Instagram, Telegram, comment. POST to /api/admin/bookings. Disable submit while pending, retain values on error, close and refresh only after 201.

Do not calculate duration, price, client ID or availability in browser code.

- [ ] **Step 4: Implement AdminBookingsWorkspace.**

Props: serializable bookings, selected date, title, whether manual create is shown.

Functionality:
- previous/next and calendar date navigation update URL query date;
- filters Active, All, Completed, Cancelled;
- chronological day cards with time, client, service and BookingStatusBadge;
- selected booking opens AdminBookingSheet;
- empty state includes manual create command;
- created/updated booking refreshes server data.

Use /admin with Kyiv today and active/pending items. Use /admin/bookings as selected-day agenda with all status filters.

- [ ] **Step 5: Update mobile navigation and server pages.**

Keep desktop sidebar. On mobile make bottom navigation fixed with Огляд, Записи, Графік, Послуги. Each target is at least 44px and active route has aria-current page. Ensure main has mobile bottom padding so no action overlaps.

Update /admin page to pass today records into workspace. Update bookings page to validate searchParams.date as ISO date, default to today Kyiv, calculate day range with getZonedDateTime and fetch ascending records.

- [ ] **Step 6: Run UI checks.**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run cf:build
```

Expected: all pass. At 375px verify bottom bar, action buttons and sheet do not overlap. At 1440px verify sidebar and agenda remain usable.

- [ ] **Step 7: Commit.**

```bash
git add src/components/admin-booking-sheet.tsx src/components/admin-bookings-workspace.tsx src/components/admin-manual-booking-sheet.tsx src/components/admin-shell.tsx src/app/admin/'(protected)'/page.tsx src/app/admin/'(protected)'/bookings/page.tsx src/components/booking-status-badge.tsx
git commit -m "feat(admin): add mobile booking workspace"
```

### Task 5: Finish schedule management and production QA

**Files:**
- Modify: src/components/schedule-editor.tsx
- Modify: README.md

- [ ] **Step 1: Add a delete action for each future block.**

Render an accessible Trash2 button and AlertDialog per block. Confirmation text:

```text
Видалити блокування?
Цей час знову стане доступним для онлайн-запису, якщо він входить у робочі години.
[Скасувати] [Видалити]
```

Call DELETE /api/admin/schedule/id. Disable only active action. On 204 show "Блокування видалено." and refresh. On error show returned message or "Не вдалося видалити блокування."

- [ ] **Step 2: Update README.**

Document local migration, linked migration push, secret requirement and this acceptance sequence: manual create, confirm, notes, reschedule, cancel/no-show and block deletion. State explicitly: never run db:reset --linked.

- [ ] **Step 3: Run complete local verification.**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run cf:build
npx supabase db reset --local
npx supabase db execute --local --file tests/supabase-admin-booking-rpc.sql
```

Expected: all commands exit 0.

- [ ] **Step 4: Apply safe remote migration and check privileges.**

After reviewing migration diff:

```bash
npx supabase db push --linked
```

Verify routine privileges in Supabase SQL editor. create_admin_booking and reschedule_booking must have EXECUTE only for service_role.

- [ ] **Step 5: Deploy and execute live acceptance tests.**

Verify:
1. unauthenticated GET /api/admin/bookings returns 401;
2. owner mobile /admin shows today records;
3. manual booking returns 201 and source ADMIN;
4. conflicting move returns 409 and leaves original time unchanged;
5. only valid status actions display;
6. notes survive refresh;
7. deleting a future block changes /api/availability;
8. Cloudflare logs have no missing-secret, database or unhandled errors.

- [ ] **Step 6: Commit.**

```bash
git add src/components/schedule-editor.tsx README.md
git commit -m "feat(admin): manage schedule blocks from mobile"
```

## Plan Self-Review

- Spec coverage: navigation, today/day agenda, details, contacts, notes, lifecycle, manual creation, atomic rescheduling, schedule deletion, security, tests and production checks are all assigned.
- Scope: no payments, catalogue editor, bot, store, portfolio or drag-and-drop calendar.
- Consistency: BookingStatus has one lifecycle module; client UI receives AdminBookingView; reschedule uses bookingRescheduleSchema and server-only repository/RPC code.
- Safety: public booking stays unchanged; every new admin mutation checks getAdminProfileForApi; PostgreSQL remains final overlap guard.
