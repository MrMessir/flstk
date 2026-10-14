-- Refund one free-duel slot (failed join/create after consume, or leave queue unused).

create or replace function public.refund_duel_slot(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('utc', now()))::date;
  v_count integer;
begin
  update public.duel_usage
  set count = greatest(count - 1, 0)
  where user_id = p_user_id and day = v_day and count > 0
  returning count into v_count;

  if v_count is null then
    return jsonb_build_object('ok', true, 'count', 0, 'refunded', false);
  end if;

  return jsonb_build_object('ok', true, 'count', v_count, 'refunded', true);
end;
$$;

revoke all on function public.refund_duel_slot(uuid) from public;
grant execute on function public.refund_duel_slot(uuid) to service_role;
