"use client";

import { useEffect, useState } from "react";

export function AdminSettings() {
  const [limit, setLimit] = useState(3);
  const [source, setSource] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ошибка");
        setLimit(data.freeDuelDailyLimit);
        setSource(data.source);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Ошибка"),
      );
  }, []);

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeDuelDailyLimit: limit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setLimit(data.freeDuelDailyLimit);
      setSource(data.source);
      setMessage("Сохранено");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-muted">
        Дневной лимит дуэлей для бесплатного тарифа. Pro и admin — без лимита.
        Курс бесплатный для всех.
      </p>
      <label className="block space-y-1 text-sm">
        <span>Лимит бесплатных дуэлей / сутки</span>
        <input
          type="number"
          min={0}
          max={1000}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full rounded-md border border-line bg-white px-3 py-2"
        />
      </label>
      {source ? (
        <p className="text-xs text-muted">Источник: {source}</p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Сохранить
      </button>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-[#7a4a00]">{error}</p> : null}
    </div>
  );
}
