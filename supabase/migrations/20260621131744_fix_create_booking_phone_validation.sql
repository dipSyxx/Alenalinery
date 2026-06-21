create or replace function public.create_booking(
  p_service_id uuid,
  p_date date,
  p_time time without time zone,
  p_client_name text,
  p_phone text,
  p_email text default null,
  p_instagram text default null,
  p_telegram text default null,
  p_client_comment text default null
)
returns setof public."Booking"
language plpgsql
set search_path = public, extensions
as $$
declare
  v_service public."Service"%rowtype;
  v_working_hours public."WorkingHours"%rowtype;
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_occupied_from timestamptz;
  v_occupied_until timestamptz;
  v_working_day_start timestamptz;
  v_working_day_end timestamptz;
  v_client_id uuid;
  v_booking public."Booking"%rowtype;
begin
  if p_service_id is null
    or p_date is null
    or p_time is null
    or nullif(btrim(p_client_name), '') is null
    or p_phone is null
    or p_phone !~ '^\+380[0-9]{9}$' then
    raise exception using errcode = 'P0001', message = 'INVALID_BOOKING_INPUT';
  end if;

  select *
  into v_service
  from public."Service"
  where "id" = p_service_id and "isActive" = true;

  if not found then
    raise exception using errcode = 'P0001', message = 'SERVICE_UNAVAILABLE';
  end if;

  v_start_at := (p_date + p_time) at time zone 'Europe/Kyiv';

  if v_start_at < clock_timestamp() then
    raise exception using errcode = 'P0001', message = 'BOOKING_IN_PAST';
  end if;

  select *
  into v_working_hours
  from public."WorkingHours"
  where "weekday" = extract(dow from p_date)::integer;

  if not found or not v_working_hours."isWorkingDay" then
    raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end if;

  v_end_at := v_start_at + make_interval(mins => v_service."durationMinutes");
  v_occupied_from := v_start_at - make_interval(mins => v_service."bufferBeforeMinutes");
  v_occupied_until := v_end_at + make_interval(mins => v_service."bufferAfterMinutes");
  v_working_day_start := (p_date + v_working_hours."startTime"::time) at time zone 'Europe/Kyiv';
  v_working_day_end := (p_date + v_working_hours."endTime"::time) at time zone 'Europe/Kyiv';

  if v_occupied_from < v_working_day_start or v_occupied_until > v_working_day_end then
    raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end if;

  if exists (
    select 1
    from public."ScheduleBlock"
    where "startAt" < v_occupied_until and "endAt" > v_occupied_from
  ) or exists (
    select 1
    from public."Booking"
    where "status" in ('PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED')
      and "occupiedFrom" < v_occupied_until
      and "occupiedUntil" > v_occupied_from
  ) then
    raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end if;

  insert into public."Client" ("name", "phone", "email", "instagram", "telegram")
  values (
    btrim(p_client_name),
    p_phone,
    nullif(btrim(p_email), ''),
    nullif(btrim(p_instagram), ''),
    nullif(btrim(p_telegram), '')
  )
  on conflict ("phone") do nothing
  returning "id" into v_client_id;

  if v_client_id is null then
    select "id" into v_client_id from public."Client" where "phone" = p_phone;
  end if;

  begin
    insert into public."Booking" (
      "clientId",
      "serviceId",
      "startAt",
      "endAt",
      "occupiedFrom",
      "occupiedUntil",
      "status",
      "totalPriceUah",
      "depositAmountUah",
      "paymentStatus",
      "clientComment",
      "source"
    )
    values (
      v_client_id,
      v_service."id",
      v_start_at,
      v_end_at,
      v_occupied_from,
      v_occupied_until,
      'PENDING_CONFIRMATION',
      v_service."basePriceUah",
      case when v_service."requiresDeposit" then coalesce(v_service."depositAmountUah", 0) else 0 end,
      case
        when v_service."requiresDeposit" then 'PENDING'::public."PaymentStatus"
        else 'NOT_REQUIRED'::public."PaymentStatus"
      end,
      nullif(btrim(p_client_comment), ''),
      'WEBSITE'
    )
    returning * into v_booking;
  exception
    when exclusion_violation then
      raise exception using errcode = 'P0001', message = 'BOOKING_CONFLICT';
  end;

  return next v_booking;
end;
$$;

revoke all on function public.create_booking(uuid, date, time without time zone, text, text, text, text, text, text) from public;
grant execute on function public.create_booking(uuid, date, time without time zone, text, text, text, text, text, text) to service_role;
