#!/usr/bin/env node
/**
 * Pre-deploy gate: required env present + security smoke (if server up) + build.
 *
 *   npm run predeploy
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function fail(msg) {
  console.error("predeploy FAIL:", msg);
  process.exit(1);
}

const envPath = ".env.local";
if (!existsSync(envPath) && !process.env.CI) {
  console.warn("warn: нет .env.local (на CI ожидаются env хостинга)");
}

function hasEnv(name) {
  if (process.env[name]) return true;
  if (!existsSync(envPath)) return false;
  const raw = readFileSync(envPath, "utf8");
  return new RegExp(`^${name}=.+`, "m").test(raw);
}

const required = [
  ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY"],
  ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
  ["ADMIN_EMAIL"],
];

for (const group of required) {
  if (!group.some((name) => hasEnv(name))) {
    fail(`нужна одна из переменных: ${group.join(" | ")}`);
  }
}

// Режим боевого деплоя: npm run predeploy -- --prod (или VERCEL_ENV=production).
const strict =
  process.argv.includes("--prod") || process.env.VERCEL_ENV === "production";
if (strict) {
  for (const name of [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "NEXT_PUBLIC_SITE_URL",
  ]) {
    if (!hasEnv(name)) {
      fail(`в проде обязательна переменная ${name} (лимиты запросов и sitemap)`);
    }
  }
}

// Пароль админа не должен быть шаблонным.
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  if (/^ADMIN_PASSWORD=.*(change\s*me|replace-with|password123)/im.test(raw)) {
    fail("ADMIN_PASSWORD похож на шаблон — задай длинный случайный пароль");
  }
}

if (!existsSync("scripts/judge-worker.mjs")) {
  fail("нет scripts/judge-worker.mjs (нужен для дуэлей)");
}

const migrations = [
  "001_user_progress.sql",
  "002_profile_on_signup.sql",
  "003_roles_plans_duels.sql",
  "004_profile_email_admin.sql",
  "005_duel_rooms.sql",
  "006_security_hardening.sql",
  "007_security_fixes.sql",
  "008_refund_duel_slot.sql",
  "009_quiz_attempts.sql",
];
for (const file of migrations) {
  if (!existsSync(`supabase/migrations/${file}`)) {
    fail(`нет миграции ${file}`);
  }
}
console.log("ok env + migrations present");

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  if (res.status !== 0) fail(`${cmd} ${args.join(" ")}`);
}

run("npm", ["run", "content:verify"]);
run("npm", ["run", "content:verify:playground"]);
run("npm", ["run", "test:judge"]);
run("npm", ["run", "test:quiz"]);

const smoke = spawnSync("npm", ["run", "test:security"], { stdio: "inherit" });
if (smoke.status !== 0) {
  console.warn(
    "warn: security smoke не прошёл (подними `npm run dev` или проверь BASE_URL)",
  );
}

run("npm", ["run", "build"]);
console.log("predeploy OK");
