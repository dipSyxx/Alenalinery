do $migration$
declare
  v_function_definition text;
begin
  select pg_get_functiondef(
    'public.create_booking(uuid, date, time without time zone, text, text, text, text, text, text)'::regprocedure
  )
  into v_function_definition;

  if position(
    $old$case when v_service."requiresDeposit" then 'PENDING' else 'NOT_REQUIRED' end,$old$
    in v_function_definition
  ) > 0 then
    v_function_definition := replace(
      v_function_definition,
      $old$case when v_service."requiresDeposit" then 'PENDING' else 'NOT_REQUIRED' end,$old$,
      $new$case
        when v_service."requiresDeposit" then 'PENDING'::public."PaymentStatus"
        else 'NOT_REQUIRED'::public."PaymentStatus"
      end,$new$
    );

    execute v_function_definition;
  end if;
end;
$migration$;

revoke all on function public.create_booking(uuid, date, time without time zone, text, text, text, text, text, text) from public;
grant execute on function public.create_booking(uuid, date, time without time zone, text, text, text, text, text, text) to service_role;
