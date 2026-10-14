import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseServiceKey } from "@/lib/supabase/env";

export function createServiceClient() {
  const env = getSupabaseEnv();
  const serviceKey = getSupabaseServiceKey();
  if (!env || !serviceKey) {
    return null;
  }
  return createClient(env.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export function getDefaultFreeDuelLimit() {
  const raw = process.env.FREE_DUEL_DAILY_LIMIT;
  const n = raw ? Number(raw) : 3;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 3;
}
