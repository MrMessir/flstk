-- Попытки прохождения тестов. Результат считает сервер, пользователь только читает.
create table if not exists public.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  correct int not null check (correct >= 0),
  total int not null check (total > 0),
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_lesson_idx
  on public.quiz_attempts (user_id, lesson_id, passed);

alter table public.quiz_attempts enable row level security;

create policy "Users read own quiz attempts"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

-- Нет политик insert/update/delete: записывает только сервер (service role).
revoke insert, update, delete on public.quiz_attempts from anon, authenticated;
