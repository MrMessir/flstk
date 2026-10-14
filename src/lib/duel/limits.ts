import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  getDefaultFreeDuelLimit,
} from "@/lib/supabase/admin";
import type { AppProfile } from "@/lib/auth/types";
import { canUnlimitedDuels } from "@/lib/auth/types";

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getFreeDuelDailyLimit(): Promise<number> {
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) return getDefaultFreeDuelLimit();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "free_duel_daily_limit")
    .maybeSingle();
  const value = data?.value;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  return getDefaultFreeDuelLimit();
}

export async function getDuelUsageToday(userId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("duel_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", utcDay())
    .maybeSingle();
  return data?.count ?? 0;
}

export async function getDuelQuota(profile: AppProfile): Promise<{
  unlimited: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  if (canUnlimitedDuels(profile)) {
    return { unlimited: true, used: 0, limit: Infinity, remaining: Infinity };
  }
  const [used, limit] = await Promise.all([
    getDuelUsageToday(profile.id),
    getFreeDuelDailyLimit(),
  ]);
  return {
    unlimited: false,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function consumeDuelSlot(
  profile: AppProfile,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (canUnlimitedDuels(profile)) return { ok: true };

  const service = createServiceClient();
  if (!service) {
    return { ok: false, error: "Не удалось учесть дуэль" };
  }

  const limit = await getFreeDuelDailyLimit();
  if (limit <= 0) {
    return {
      ok: false,
      error: `Лимит бесплатных дуэлей на сегодня (${limit}). Нужен Pro или возврат завтра.`,
    };
  }

  const { data, error } = await service.rpc("consume_duel_slot", {
    p_user_id: profile.id,
    p_limit: limit,
  });

  if (error) {
    console.error("[duel:consume_slot]", error);
    return { ok: false, error: "Не удалось учесть дуэль. Попробуй позже." };
  }

  const result = data as { ok?: boolean; limit?: number } | null;
  if (!result?.ok) {
    const cap = result?.limit ?? limit;
    return {
      ok: false,
      error: `Лимит бесплатных дуэлей на сегодня (${cap}). Нужен Pro или возврат завтра.`,
    };
  }
  return { ok: true };
}

/** Best-effort refund after failed join/create. No-op for Pro/admin. */
export async function refundDuelSlot(profile: AppProfile): Promise<void> {
  if (canUnlimitedDuels(profile)) return;
  const service = createServiceClient();
  if (!service) return;
  await service.rpc("refund_duel_slot", { p_user_id: profile.id });
}
