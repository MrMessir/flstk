-- Security fixes: atomic duel quota, room revision, profile INSERT guard,
-- lesson_progress writes only via service role / RPC.

-- ---------------------------------------------------------------------------
-- Atomic free-duel slot consumption (no read-modify-write race)
-- ---------------------------------------------------------------------------
create or replace function public.consume_duel_slot(p_user_id uuid, p_limit integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('utc', now()))::date;
  v_count integer;
begin
  if p_limit < 0 then
    return jsonb_build_object('ok', false, 'error', 'bad_limit');
  end if;

  if p_limit = 0 then
    return jsonb_build_object('ok', false, 'count', 0, 'limit', 0);
  end if;

  insert into public.duel_usage (user_id, day, count)
  values (p_user_id, v_day, 1)
  on conflict (user_id, day) do update
    set count = public.duel_usage.count + 1
    where public.duel_usage.count < p_limit
  returning count into v_count;

  if v_count is null then
    select u.count into v_count
    from public.duel_usage u
    where u.user_id = p_user_id and u.day = v_day;
    return jsonb_build_object(
      'ok', false,
      'count', coalesce(v_count, p_limit),
      'limit', p_limit
    );
  end if;

  return jsonb_build_object('ok', true, 'count', v_count, 'limit', p_limit);
end;
$$;

revoke all on function public.consume_duel_slot(uuid, integer) from public;
grant execute on function public.consume_duel_slot(uuid, integer) to service_role;

-- Optimistic locking uses existing duel_rooms.updated_at (app-side compare).

-- ---------------------------------------------------------------------------
-- Protect privileged profile fields on INSERT (not only UPDATE)
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- JWT отсутствует (service role / миграции) — полные права
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.role := 'user';
      new.plan := 'free';
      new.is_banned := false;
    end if;
    return new;
  end if;

  if not public.is_admin() then
    new.role := old.role;
    new.plan := old.plan;
    new.is_banned := old.is_banned;
    new.email := old.email;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- lesson_progress: clients may read; writes go through app API (service role)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can insert own progress" on public.lesson_progress;
drop policy if exists "Users can update own progress" on public.lesson_progress;
