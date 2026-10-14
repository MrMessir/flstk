#!/usr/bin/env node
/**
 * Применяет scripts/all-migrations.sql к Postgres Supabase.
 *
 * Нужен DATABASE_URL из Dashboard → Project Settings → Database → URI
 *
 *   DATABASE_URL='postgresql://postgres....' node scripts/apply-migrations.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!url) {
  console.error(
    "Нужен DATABASE_URL (пароль БД из Supabase → Settings → Database).",
  );
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sqlPath = path.join(root, "scripts", "all-migrations.sql");
const sql = readFileSync(sqlPath, "utf8");

const psql = spawnSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], {
  encoding: "utf8",
});

if (psql.error?.code === "ENOENT") {
  console.error(
    "psql не найден. Установи postgresql-client или вставь SQL вручную в SQL Editor.",
  );
  console.error("Файл SQL готов:", sqlPath, `(${sql.length} символов)`);
  process.exit(1);
}

process.stdout.write(psql.stdout || "");
process.stderr.write(psql.stderr || "");
process.exit(psql.status ?? 1);
