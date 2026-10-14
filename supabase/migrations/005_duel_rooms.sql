-- Прод-хранилище дуэлей (вместо локального .data/duels.json)

create table if not exists public.duel_rooms (
  code text primary key,
  status text not null
    check (status in ('waiting', 'ready_check', 'playing', 'finished', 'expired')),
  challenge_id text not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  winner_id uuid,
  players jsonb not null default '[]'::jsonb,
  matchmaking boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists duel_rooms_status_idx on public.duel_rooms (status);
create index if not exists duel_rooms_created_at_idx on public.duel_rooms (created_at desc);
create index if not exists duel_rooms_matchmaking_idx
  on public.duel_rooms (matchmaking, status)
  where matchmaking = true;

create table if not exists public.duel_queue (
  player_id uuid primary key references public.profiles (id) on delete cascade,
  name text not null,
  joined_at timestamptz not null default now()
);

create index if not exists duel_queue_joined_at_idx on public.duel_queue (joined_at);

alter table public.duel_rooms enable row level security;
alter table public.duel_queue enable row level security;

-- Клиентский доступ только через API с service role.
-- Админы могут читать комнаты в SQL Editor / через service.

create policy "Admins read duel rooms"
  on public.duel_rooms for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins read duel queue"
  on public.duel_queue for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
