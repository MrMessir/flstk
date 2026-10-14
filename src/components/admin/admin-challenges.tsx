"use client";

import { useEffect, useState } from "react";

export function AdminChallenges() {
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/challenges")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ошибка");
        setRaw(JSON.stringify(data.challenges, null, 2));
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
      const parsed = JSON.parse(raw) as unknown;
      const res = await fetch("/api/admin/challenges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");
      setRaw(JSON.stringify(data.challenges, null, 2));
      setMessage(`Сохранено: ${data.count} заданий`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Банк заданий дуэлей — JSON в{" "}
        <code className="font-mono">content/duels/challenges.json</code>. Типы:{" "}
        <code className="font-mono">js-function</code>,{" "}
        <code className="font-mono">js-bug</code>,{" "}
        <code className="font-mono">html-checklist</code>.
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={22}
        spellCheck={false}
        className="w-full rounded-xl border border-line bg-code-bg p-4 font-mono text-xs text-[#c8d4e8]"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-signal-ink disabled:opacity-50"
        >
          {busy ? "Сохраняю…" : "Сохранить JSON"}
        </button>
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        {error ? <p className="text-sm text-[#7a4a00]">{error}</p> : null}
      </div>
    </div>
  );
}
