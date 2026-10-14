"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe } from "@/hooks/use-me";
import { getPlayerName, setPlayerName } from "@/lib/duel/player";

export function DuelLobby() {
  const router = useRouter();
  const { data, loading, refresh } = useMe();
  const [name, setName] = useState("Игрок");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueInfo, setQueueInfo] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fromProfile = data?.user?.displayName;
    if (fromProfile) {
      setName(fromProfile);
      setPlayerName(fromProfile);
      return;
    }
    setName(getPlayerName());
  }, [data?.user?.displayName, mounted]);

  function persistName() {
    setPlayerName(name);
  }

  async function createDuel() {
    setBusy(true);
    setError(null);
    persistName();
    try {
      const res = await fetch("/api/duel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = (await res.json()) as {
        room?: { code: string };
        error?: string;
      };
      if (!res.ok || !json.room) throw new Error(json.error || "Не удалось создать");
      await refresh();
      router.push(`/duel/${json.room.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setBusy(false);
    }
  }

  async function joinDuel() {
    setBusy(true);
    setError(null);
    persistName();
    try {
      const res = await fetch("/api/duel/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: joinCode.trim(),
          name,
        }),
      });
      const json = (await res.json()) as {
        room?: { code: string };
        error?: string;
      };
      if (!res.ok || !json.room) throw new Error(json.error || "Не удалось войти");
      await refresh();
      router.push(`/duel/${json.room.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setBusy(false);
    }
  }

  async function findOpponent() {
    setBusy(true);
    setError(null);
    persistName();
    setQueueInfo("Ищем соперника…");
    try {
      for (let i = 0; i < 30; i += 1) {
        const res = await fetch("/api/duel/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            action: "join",
          }),
        });
        const json = (await res.json()) as {
          status?: string;
          position?: number;
          room?: { code: string };
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || "Очередь недоступна");
        if (json.status === "matched" && json.room) {
          await refresh();
          router.push(`/duel/${json.room.code}`);
          return;
        }
        setQueueInfo(`В очереди… место ${json.position ?? "—"}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
      setError("Никто не нашёлся за 45 секунд. Создай ссылку другу.");
      await fetch("/api/duel/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
      setQueueInfo(null);
    }
  }

  const quota = data?.duelQuota;
  const isPro = data?.user?.plan === "pro" || data?.user?.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          дуэли
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Дуэли
        </h1>
        <p className="text-muted">
          Два игрока, одно задание. Побеждает первый, чьё решение проходит тесты.
        </p>
      </div>

      {mounted && !loading && quota ? (
        <div className="rounded-xl border border-line bg-paper-elevated px-4 py-3 text-sm">
          {quota.unlimited ? (
            <p>
              Лимита нет
              {isPro ? " (Pro)" : ""}.
            </p>
          ) : (
            <p>
              Сегодня осталось{" "}
              <span className="font-semibold">
                {quota.remaining}/{quota.limit}
              </span>
              .
            </p>
          )}
        </div>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Твой ник</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2"
          maxLength={24}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void createDuel()}
          className="rounded-md bg-signal px-4 py-3 text-sm font-semibold text-signal-ink disabled:opacity-50"
        >
          Создать комнату
        </button>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void findOpponent()}
          className="rounded-md border border-accent px-4 py-3 text-sm font-semibold text-accent hover:bg-accent-soft disabled:opacity-50"
        >
          Найти соперника
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-paper-elevated p-4">
        <p className="font-medium">Код комнаты</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="например a1b2c3"
            className="min-w-[10rem] flex-1 rounded-md border border-line bg-white px-3 py-2 font-mono text-sm"
          />
          <button
            type="button"
            disabled={busy || joinCode.trim().length < 4}
            onClick={() => void joinDuel()}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-signal disabled:opacity-40"
          >
            Войти
          </button>
        </div>
      </div>

      {queueInfo ? (
        <p className="text-sm text-accent" aria-live="polite">
          {queueInfo}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-warn/30 bg-[#fff7e8] px-3 py-2 text-sm text-[#7a4a00]">
          {error}
          {error.includes("Pro") ? (
            <>
              {" "}
              <Link href="/" className="underline">
                На главную
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Нужен аккаунт.</li>
        <li>Решение проверяют тесты.</li>
        <li>Общий таймер.</li>
      </ul>
    </div>
  );
}
