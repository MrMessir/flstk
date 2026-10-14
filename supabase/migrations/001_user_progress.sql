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
