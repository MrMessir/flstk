-- Профили пользователей (расширение auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Прогресс по урокам (контент уроков хранится в репозитории, не в БД)
create table if not exists public.lesson_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_id_idx
  on public.lesson_progress (user_id);

create index if not exists lesson_progress_lesson_id_idx
  on public.lesson_progress (lesson_id);

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.lesson_progress for update
  using (auth.uid() = user_id);
-- Автосоздание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
-- Роли, тарифы, учёт дуэлей и настройки приложения

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin')),
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro')),
  add column if not exists is_banned boolean not null default false,
  add column if not exists email text;

create table if not exists public.duel_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default (timezone('utc', now()))::date,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

create index if not exists duel_usage_day_idx on public.duel_usage (day);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('free_duel_daily_limit', '3'::jsonb)
on conflict (key) do nothing;

alter table public.duel_usage enable row level security;
alter table public.app_settings enable row level security;

create policy "Users read own duel usage"
  on public.duel_usage for select
  using (auth.uid() = user_id);

create policy "Users upsert own duel usage"
  on public.duel_usage for insert
  with check (auth.uid() = user_id);

create policy "Users update own duel usage"
  on public.duel_usage for update
  using (auth.uid() = user_id);

-- Настройки читают все авторизованные; пишет только admin (через service role / RPC)
create policy "Authenticated read settings"
  on public.app_settings for select
  to authenticated
  using (true);

-- Админы видят все профили
create policy "Admins read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins read all duel usage"
  on public.duel_usage for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
-- Email в профиле + обновление триггера регистрации

alter table public.profiles
  add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

-- ========== 007_security_fixes.sql ==========
-- Security fixes: atomic duel quota, room revision, profile INSERT guard,
-- lesson_progress writes only via service role / RPC.

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

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop policy if exists "Users can insert own progress" on public.lesson_progress;
drop policy if exists "Users can update own progress" on public.lesson_progress;

-- ========== 008_refund_duel_slot.sql ==========
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
