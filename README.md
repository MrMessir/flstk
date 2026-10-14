# Fullstacker

Курс fullstack на русском. Вход нужен для уроков, программы, словаря и дуэлей.

## Быстрый старт

```bash
cp .env.example .env.local
# заполни Supabase URL / keys и ADMIN_EMAIL
npm install
# примени SQL из supabase/migrations/001…008 в SQL Editor
npm run seed:admin
npm run dev
```

Сайт: [http://localhost:3001](http://localhost:3001)

## Supabase

1. Создай проект в Supabase.
2. Примени миграции `supabase/migrations/` по порядку (`001`…`008`).
3. **Authentication → URL Configuration**
   - Site URL = `NEXT_PUBLIC_SITE_URL` (прод-домен)
   - Redirect URLs: `https://твой-домен/**`, `https://твой-домен/auth/callback/**`, `http://localhost:3001/**`
4. Включи бэкапы (Dashboard → Database → Backups) на платном плане или снимок вручную.
5. В `.env.local` / env хостинга укажи ключи и `ADMIN_EMAIL`.
6. `npm run seed:admin`

## Деплой (Vercel)

Обязательные env на хостинге:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`
- `ADMIN_EMAIL`
- `FREE_DUEL_DAILY_LIMIT` (опционально)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (опционально, общий rate-limit)

Проверка перед релизом:

```bash
npm run predeploy
```

Дуэли хранятся в таблицах `duel_rooms` / `duel_queue` (не в локальном файле) — подходит для serverless.

## Тарифы

- Курс бесплатный.
- Free: дневной лимит дуэлей.
- Pro и admin — без лимита (Pro пока вручную в `/admin`).

## Админ-панель `/admin`

Пользователи, дуэли, задания, настройки лимита, статистика.

## Юридическое

- `/privacy` — конфиденциальность  
- `/terms` — условия использования  
