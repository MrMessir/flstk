#!/usr/bin/env node
/**
 * Создаёт / подтверждает админ-аккаунт по ADMIN_EMAIL.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-admin.mjs
 *
 * Env:
 *   SUPABASE_URL (или NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SECRET_KEY (или SUPABASE_SERVICE_ROLE_KEY)
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD (обязателен, мин. 12 символов)
 */

import { createClient } from "@supabase/supabase-js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

if (!url || !serviceKey || !email) {
  console.error(
    "Нужны SUPABASE_URL, SUPABASE_SECRET_KEY (или legacy-имена) и ADMIN_EMAIL",
  );
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    "Нужен ADMIN_PASSWORD не короче 12 символов (без пароля по умолчанию).",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const list = await supabase.auth.admin.listUsers({ perPage: 200 });
if (list.error) {
  console.error(list.error.message);
  process.exit(1);
}

let user = list.data.users.find((u) => (u.email || "").toLowerCase() === email);

if (!user) {
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Admin" },
  });
  if (created.error) {
    console.error(created.error.message);
    process.exit(1);
  }
  user = created.data.user;
  console.log("Создан пользователь", email);
} else {
  console.log("Пользователь уже есть", email);
  const upd = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (upd.error) {
    console.error(upd.error.message);
    process.exit(1);
  }
  console.log("Пароль обновлён");
}

const { error } = await supabase.from("profiles").upsert({
  id: user.id,
  email,
  display_name: user.user_metadata?.display_name || "Admin",
  role: "admin",
  plan: "pro",
  is_banned: false,
  updated_at: new Date().toISOString(),
});

if (error) {
  console.error("Не удалось обновить profiles:", error.message);
  process.exit(1);
}

console.log("OK: admin + pro для", email);
console.log("Вход: /login  (пароль из ADMIN_PASSWORD)");
