create schema if not exists extensions;

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "btree_gist" with schema extensions;

create type public."Role" as enum ('ADMIN');
create type public."BookingStatus" as enum (
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'PENDING_PAYMENT',
  'EXPIRED'
);
create type public."PaymentStatus" as enum ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type public."BookingSource" as enum ('WEBSITE', 'ADMIN');

create table public."Profile" (
  "id" uuid primary key references auth.users(id) on delete cascade,
  "role" public."Role" not null default 'ADMIN',
  "displayName" text not null,
  "createdAt" timestamptz(3) not null default current_timestamp,
  "updatedAt" timestamptz(3) not null default current_timestamp
);

create table public."ServiceCategory" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "slug" text not null unique,
  "description" text,
  "sortOrder" integer not null default 0,
  "isActive" boolean not null default true,
  "createdAt" timestamptz(3) not null default current_timestamp,
  "updatedAt" timestamptz(3) not null default current_timestamp
);

create table public."Service" (
  "id" uuid primary key default gen_random_uuid(),
  "categoryId" uuid not null references public."ServiceCategory"("id") on delete restrict on update cascade,
  "name" text not null,
  "slug" text not null unique,
  "description" text not null,
  "basePriceUah" integer not null,
  "durationMinutes" integer not null,
  "bufferBeforeMinutes" integer not null default 0,
  "bufferAfterMinutes" integer not null default 0,
  "requiresConsultation" boolean not null default false,
  "requiresDeposit" boolean not null default false,
  "depositAmountUah" integer,
  "isActive" boolean not null default true,
  "sortOrder" integer not null default 0,
  "createdAt" timestamptz(3) not null default current_timestamp,
  "updatedAt" timestamptz(3) not null default current_timestamp,
  constraint "Service_positive_values_check"
    check (
      "basePriceUah" >= 0
      and "durationMinutes" > 0
      and "bufferBeforeMinutes" >= 0
      and "bufferAfterMinutes" >= 0
    )
);

create table public."Client" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "phone" text not null unique,
  "email" text,
  "instagram" text,
  "telegram" text,
  "notes" text,
  "createdAt" timestamptz(3) not null default current_timestamp,
  "updatedAt" timestamptz(3) not null default current_timestamp
);

create table public."WorkingHours" (
  "id" uuid primary key default gen_random_uuid(),
  "weekday" integer not null unique,
  "startTime" varchar(5) not null,
  "endTime" varchar(5) not null,
  "isWorkingDay" boolean not null default true,
  "createdAt" timestamptz(3) not null default current_timestamp,
  "updatedAt" timestamptz(3) not null default current_timestamp,
  constraint "WorkingHours_weekday_check" check ("weekday" between 0 and 6),
  constraint "WorkingHours_time_order_check" check ("startTime" < "endTime")
);

create table public."ScheduleBlock" (
  "id" uuid primary key default gen_random_uuid(),
  "startAt" timestamptz(3) not null,
  "endAt" timestamptz(3) not null,
  "reason" text,
  "createdAt" timestamptz(3) not null default current_timestamp,
  "updatedAt" timestamptz(3) not null default current_timestamp,
  constraint "ScheduleBlock_time_order_check" check ("startAt" < "endAt")
);

create table public."Booking" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" uuid not null references public."Client"("id") on delete restrict on update cascade,
  "serviceId" uuid not null references public."Service"("id") on delete restrict on update cascade,
  "startAt" timestamptz(3) not null,
  "endAt" timestamptz(3) not null,
  "occupiedFrom" timestamptz(3) not null,
  "occupiedUntil" timestamptz(3) not null,
  "status" public."BookingStatus" not null default 'PENDING_CONFIRMATION',
  "totalPriceUah" integer not null,
  "depositAmountUah" integer not null default 0,
  "paymentStatus" public."PaymentStatus" not null default 'NOT_REQUIRED',
  "clientComment" text,
  "adminNotes" text,
  "source" public."BookingSource" not null default 'WEBSITE',
  "createdAt" timestamptz(3) not null default current_timestamp,
  "updatedAt" timestamptz(3) not null default current_timestamp,
  "cancelledAt" timestamptz(3),
  constraint "Booking_time_order_check"
    check ("occupiedFrom" <= "startAt" and "startAt" < "endAt" and "endAt" <= "occupiedUntil"),
  constraint "Booking_money_check" check ("totalPriceUah" >= 0 and "depositAmountUah" >= 0)
);

create index "ServiceCategory_isActive_sortOrder_idx" on public."ServiceCategory" ("isActive", "sortOrder");
create index "Service_categoryId_idx" on public."Service" ("categoryId");
create index "Service_isActive_sortOrder_idx" on public."Service" ("isActive", "sortOrder");
create index "Client_phone_idx" on public."Client" ("phone");
create index "ScheduleBlock_startAt_endAt_idx" on public."ScheduleBlock" ("startAt", "endAt");
create index "Booking_startAt_idx" on public."Booking" ("startAt");
create index "Booking_status_startAt_idx" on public."Booking" ("status", "startAt");
create index "Booking_clientId_idx" on public."Booking" ("clientId");
create index "Booking_serviceId_idx" on public."Booking" ("serviceId");

alter table public."Booking"
  add constraint "Booking_active_occupied_range_excl"
  exclude using gist (
    tstzrange("occupiedFrom", "occupiedUntil", '[)') with &&
  ) where ("status" in ('PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED'));

alter table public."Profile" enable row level security;
alter table public."ServiceCategory" enable row level security;
alter table public."Service" enable row level security;
alter table public."Client" enable row level security;
alter table public."WorkingHours" enable row level security;
alter table public."ScheduleBlock" enable row level security;
alter table public."Booking" enable row level security;

revoke all on table public."Profile", public."Client", public."WorkingHours", public."ScheduleBlock", public."Booking" from anon, authenticated;
grant select on table public."ServiceCategory", public."Service" to anon, authenticated;

create policy "Active service categories are publicly readable"
  on public."ServiceCategory" for select to anon, authenticated
  using ("isActive" = true);

create policy "Active services are publicly readable"
  on public."Service" for select to anon, authenticated
  using ("isActive" = true);

create policy "Owners can read their profile"
  on public."Profile" for select to authenticated
  using ("id" = (select auth.uid())::uuid);
