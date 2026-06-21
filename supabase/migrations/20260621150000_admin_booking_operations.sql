-- Migration: admin booking operations
-- Adds create_admin_booking (wraps create_booking and marks source ADMIN)
-- and reschedule_booking (atomic rescheduling with conflict detection).

-- ─── create_admin_booking ────────────────────────────────────────────────────

create or replace function public.create_admin_booking(
  p_service_id      uuid,
  p_date            date,
  p_time            time without time zone,
  p_client_name     text,
  p_phone           text,
  p_email           text default null,
  p_instagram       text default null,
  p_telegram        text default null,
  p_client_comment  text default null
)
returns setof public."Booking"
language plpgsql
set search_path = public, extensions
as $$
declare
  v_booking public."Booking"%rowtype;
begin
  -- Delegate all validation and conflict detection to create_booking.
  select *
  into v_booking
  from public.create_booking(
    p_service_id,
    p_date,
    p_time,
    p_client_name,
    p_phone,
    p_email,
    p_instagram,
    p_telegram,
    p_client_comment
  );

  -- Mark the booking as admin-originated.
  update public."Booking"
  set "source" = 'ADMIN'
  where "id" = v_booking."id"
  returning * into v_booking;

  return next v_booking;
end;
$$;

revoke all on function public.create_admin_booking(uuid, date, time without time zone, text, text, text, text, text, text) from public;
grant execute on function public.create_admin_booking(uuid, date, time without time zone, text, text, text, text, text, text) to service_role;

-- ─── reschedule_booking ──────────────────────────────────────────────────────

create or replace function public.reschedule_booking(
  p_booking_id  uuid,
  p_date        date,
  p_time        time without time zone
)
returns setof public."Booking"
language plpgsql
set search_path = public, extensions
as $$
declare
  v_booking           public."Booking"%rowtype;
  v_service           public."Service"%rowtype;
  v_working_hours     public."WorkingHours"%rowtype;
  v_new_start_at      timestamptz;
  v_new_end_at        timestamptz;
  v_new_occ_from      timestamptz;
  v_new_occ_until     timestamptz;
  v_working_day_start timestamptz;
  v_working_day_end   timestamptz;
begin
  -- 1. Reject null parameters.
  if p_booking_id is null or p_date is null or p_time is null then
    raise exception using errcode = 'P0001', message = 'INVALID_RESCHEDULE_INPUT';
  end if;

  -- 2. Lock and load the booking row.
  select *
  into v_booking
  from public."Booking"
  where "id" = p_booking_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'BOOKING_NOT_FOUND';
  end if;

  -- 3. Only reschedulable statuses may be moved.
  if v_booking."status" not in (
    'PENDING_CONFIRMATION',
    'PENDING_PAYMENT',
    'CONFIRMED'
  ) then
    raise exception using errcode = 'P0001', message = 'BOOKING_NOT_RESCHEDULABLE';
  end if;

  -- 4. Load the service (without isActive filter).
  select *
  into v_service
  from public."Service"
  where "id" = v_booking."serviceId";

  -- 5. Convert requested Kyiv local date/time to timestamptz.
  v_new_start_at := (p_date + p_time) at time zone 'Europe/Kyiv';

  -- 6. Reject past date/time.
  if v_new_start_at < clock_timestamp() then
    raise exception using errcode = 'P0001', message = 'BOOKING_IN_PAST';
  end if;

  -- 7. Reject same start time (no-op move).
  if v_new_start_at = v_booking."startAt" then
    raise exception using errcode = 'P0001', message = 'BOOKING_RESCHEDULE_NO_CHANGE';
  end if;

  -- 8. Derive endAt, occupiedFrom, occupiedUntil.
  v_new_end_at    := v_new_start_at + make_interval(mins => v_service."durationMinutes");
  v_new_occ_from  := v_new_start_at - make_interval(mins => v_service."bufferBeforeMinutes");
  v_new_occ_until := v_new_end_at   + make_interval(mins => v_service."bufferAfterMinutes");

  -- 9. Validate working hours for the target day.
  select *
  into v_working_hours
  from public."WorkingHours"
  where "weekday" = extract(dow from p_date)::integer;

  if not found or not v_working_hours."isWorkingDay" then
    raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end if;

  v_working_day_start := (p_date + v_working_hours."startTime"::time) at time zone 'Europe/Kyiv';
  v_working_day_end   := (p_date + v_working_hours."endTime"::time)   at time zone 'Europe/Kyiv';

  if v_new_occ_from < v_working_day_start or v_new_occ_until > v_working_day_end then
    raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end if;

  -- 10. Reject intersecting ScheduleBlock.
  if exists (
    select 1
    from public."ScheduleBlock"
    where "startAt" < v_new_occ_until and "endAt" > v_new_occ_from
  ) then
    raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end if;

  -- 11. Reject intersecting active Booking (excluding the booking being rescheduled).
  if exists (
    select 1
    from public."Booking"
    where "id" <> p_booking_id
      and "status" in ('PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED')
      and "occupiedFrom" < v_new_occ_until
      and "occupiedUntil" > v_new_occ_from
  ) then
    raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end if;

  -- 12. Update the booking and return the updated row.
  begin
    update public."Booking"
    set
      "startAt"       = v_new_start_at,
      "endAt"         = v_new_end_at,
      "occupiedFrom"  = v_new_occ_from,
      "occupiedUntil" = v_new_occ_until
    where "id" = p_booking_id
    returning * into v_booking;
  exception
    -- 13. Translate exclusion_violation into BOOKING_CONFLICT.
    when exclusion_violation then
      raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end;

  return next v_booking;
end;
$$;

revoke all on function public.reschedule_booking(uuid, date, time without time zone) from public;
grant execute on function public.reschedule_booking(uuid, date, time without time zone) to service_role;
