"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppProfile } from "@/lib/auth/types";

export type MeResponse = {
  user: AppProfile | null;
  duelQuota?: {
    unlimited: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
  };
};

export function useMe() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = (await res.json()) as MeResponse & { error?: string };
      if (!res.ok && res.status !== 200) {
        throw new Error(json.error || "Не удалось загрузить профиль");
      }
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
