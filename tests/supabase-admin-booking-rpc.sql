-- Local-only smoke test for admin booking RPCs.
-- Run only against a local Supabase instance with seeded data.
-- Usage: npx supabase db execute --local --file tests/supabase-admin-booking-rpc.sql
--
-- Never run this file against the linked (production) project.

do $$
declare
  v_service_id   uuid;
  v_booking      public."Booking"%rowtype;
  v_booking_id   uuid;
  v_start_at_1   timestamptz;
  v_start_at_2   timestamptz;
  v_test_phone   text := '+380500000099';
  v_test_date_1  date;
  v_test_date_2  date;
begin
  -- 1. Find an active service to book.
  select "id"
  into v_service_id
  from public."Service"
  where "isActive" = true
  limit 1;

  if v_service_id is null then
    raise exception 'Smoke test: no active service found in local seed data.';
  end if;

  -- Use a working Tuesday at a reasonable time. The seed sets weekday 2 (Tuesday)
  -- as a working day. Adjust the date to a Tuesday safely in the future.
  v_test_date_1 := current_date + ((2 - extract(dow from current_date)::int + 7) % 7 + 7);
  v_test_date_2 := v_test_date_1;

  -- 2. Create a manual booking via create_admin_booking.
  select *
  into v_booking
  from public.create_admin_booking(
    v_service_id,
    v_test_date_1,
    '11:00'::time,
    'Тест Адмін',
    v_test_phone,
    null, null, null, null
  );

  v_booking_id  := v_booking."id";
  v_start_at_1  := v_booking."startAt";

  -- 3. Assert source = ADMIN.
  if v_booking."source" <> 'ADMIN' then
    raise exception 'Smoke test: expected source=ADMIN, got %', v_booking."source";
  end if;

  -- 4. Reschedule to a different valid free slot.
  select *
  into v_booking
  from public.reschedule_booking(v_booking_id, v_test_date_2, '13:00'::time);

  v_start_at_2 := v_booking."startAt";

  -- 5. Assert startAt changed.
  if v_start_at_1 = v_start_at_2 then
    raise exception 'Smoke test: expected startAt to change after reschedule.';
  end if;

  -- 6. Try identical reschedule => should raise BOOKING_RESCHEDULE_NO_CHANGE.
  begin
    perform public.reschedule_booking(v_booking_id, v_test_date_2, '13:00'::time);
    raise exception 'Smoke test: expected BOOKING_RESCHEDULE_NO_CHANGE but no error was raised.';
  exception
    when others then
      if sqlerrm <> 'BOOKING_RESCHEDULE_NO_CHANGE' then
        raise exception 'Smoke test: expected BOOKING_RESCHEDULE_NO_CHANGE, got: %', sqlerrm;
      end if;
  end;

  -- 7. Clean up: delete test booking and client.
  delete from public."Booking" where "id" = v_booking_id;
  delete from public."Client" where "phone" = v_test_phone;

  raise notice 'Smoke test PASSED: create_admin_booking and reschedule_booking work correctly.';
end;
$$;
