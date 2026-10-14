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
