-- Hardening: is_admin() без рекурсии RLS, защита role/plan/ban,
-- duel_usage только через service role.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- Переписываем admin-политики без self-join на profiles
drop policy if exists "Admins read all profiles" on public.profiles;
drop policy if exists "Admins update all profiles" on public.profiles;
drop policy if exists "Admins read all duel usage" on public.duel_usage;
drop policy if exists "Admins read duel rooms" on public.duel_rooms;
drop policy if exists "Admins read duel queue" on public.duel_queue;

create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins update all profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins read all duel usage"
  on public.duel_usage for select
  using (public.is_admin());

create policy "Admins read duel rooms"
  on public.duel_rooms for select
  using (public.is_admin());

create policy "Admins read duel queue"
  on public.duel_queue for select
  using (public.is_admin());

-- Клиент не может писать в счётчик дуэлей (только service role / bypass RLS)
drop policy if exists "Users upsert own duel usage" on public.duel_usage;
drop policy if exists "Users update own duel usage" on public.duel_usage;

-- Пользователь не повышает себе role / plan / is_banned / email
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
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileges();
