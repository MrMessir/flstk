"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMe } from "@/hooks/use-me";
import type { PublicRoom } from "@/lib/duel/types";
import { getPlayerName, setPlayerName } from "@/lib/duel/player";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center bg-code-bg text-sm text-white/50">
      Загрузка редактора…
    </div>
  ),
});

type DuelRoomProps = {
  code: string;
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function DuelRoomView({ code }: DuelRoomProps) {
  const { data: meData } = useMe();
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const playerId = meData?.user?.id ?? "";

  const inviteUrl =
    typeof window === "undefined"
      ? `/duel/${code}`
      : `${window.location.origin}/duel/${code}`;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/duel/${code}`, { cache: "no-store" });
    const data = (await res.json()) as { room?: PublicRoom; error?: string };
    if (!res.ok || !data.room) {
      setError(data.error || "Комната не найдена");
      return;
    }
    setRoom(data.room);
    setError(null);
  }, [code]);

  // join on mount once we know the session user
  useEffect(() => {
    const displayName = meData?.user?.displayName;
    const userId = meData?.user?.id;
    if (!userId) return;
    let cancelled = false;
    async function boot() {
      const name = displayName || getPlayerName() || "Игрок";
      setPlayerName(name);
      const res = await fetch("/api/duel/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      const data = (await res.json()) as { room?: PublicRoom; error?: string };
      if (cancelled) return;
      if (!res.ok || !data.room) {
        await refresh();
        if (!cancelled && !res.ok) {
          setError(data.error || "Не удалось войти");
        }
        return;
      }
      setRoom(data.room);
      setSolution(data.room.challenge.starter);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [code, refresh, meData?.user?.id, meData?.user?.displayName]);

  useEffect(() => {
    if (!room) return;
    if (
      room.status === "finished" ||
      room.status === "expired"
    ) {
      return;
    }
    const id = window.setInterval(() => {
      void refresh();
      setNow(Date.now());
    }, 1500);
    return () => window.clearInterval(id);
  }, [room, refresh]);

  useEffect(() => {
    if (room?.challenge.starter && !solution) {
      setSolution(room.challenge.starter);
    }
  }, [room, solution]);

  const me = room?.players.find((p) => p.id === playerId);
  const opponent = room?.players.find((p) => p.id !== playerId);

  const remainingSec = useMemo(() => {
    if (!room?.startedAt || room.status !== "playing") return null;
    const end =
      Date.parse(room.startedAt) + room.challenge.timeLimitSec * 1000;
    return Math.max(0, Math.floor((end - now) / 1000));
  }, [room, now]);

  async function toggleReady() {
    if (!room || !me) return;
    setBusy(true);
    try {
      const res = await fetch("/api/duel/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          ready: !me.ready,
        }),
      });
      const data = (await res.json()) as { room?: PublicRoom; error?: string };
      if (!res.ok || !data.room) throw new Error(data.error || "Ошибка");
      setRoom(data.room);
      if (data.room.status === "playing") {
        setSolution(data.room.challenge.starter);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setReport(null);
    try {
      const res = await fetch("/api/duel/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          solution,
        }),
      });
      const data = (await res.json()) as {
        room?: PublicRoom;
        result?: { ok: boolean; report: string };
        error?: string;
      };
      if (!res.ok || !data.room) throw new Error(data.error || "Ошибка сдачи");
      setRoom(data.room);
      setReport(data.result?.report ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Не удалось скопировать ссылку");
    }
  }

  if (!room && !error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-muted">
        Подключаемся к комнате…
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <p className="text-[#7a4a00]">{error}</p>
        <Link href="/duel" className="text-accent hover:underline">
          ← к лобби
        </Link>
      </div>
    );
  }

  if (!room) return null;

  const language =
    room.challenge.type === "html-checklist" ? "html" : "javascript";
  const finished =
    room.status === "finished" || room.status === "expired";
  const iWon = finished && room.winnerId === playerId;
  const iLost =
    finished && room.winnerId && room.winnerId !== playerId;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            комната {room.code}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {room.challenge.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {room.challenge.prompt}
          </p>
        </div>
        <div className="space-y-2 text-right">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-md border border-line bg-white px-3 py-2 text-xs font-medium"
          >
            {copied ? "Скопировано" : "Скопировать ссылку"}
          </button>
          {remainingSec !== null ? (
            <p className="font-mono text-lg font-semibold tabular-nums">
              {formatTime(remainingSec)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlayerCard
          label="Ты"
          name={me?.name ?? "—"}
          ready={me?.ready ?? false}
          passed={me?.passed ?? false}
          highlight
        />
        <PlayerCard
          label="Соперник"
          name={opponent?.name ?? "ждём…"}
          ready={opponent?.ready ?? false}
          passed={opponent?.passed ?? false}
        />
      </div>

      {room.status === "waiting" || room.status === "ready_check" ? (
        <div className="rounded-xl border border-line bg-paper-elevated p-5 space-y-3">
          <p className="text-sm text-muted">
            {room.players.length < 2
              ? "Отправь ссылку другу. Когда зайдёт — оба нажмите «Готов»."
              : "Оба игрока в комнате. Нажмите «Готов», чтобы стартовать таймер и открыть задание."}
          </p>
          <button
            type="button"
            disabled={busy || room.players.length < 2}
            onClick={() => void toggleReady()}
            className="rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-signal-ink disabled:opacity-40"
          >
            {me?.ready ? "Не готов" : "Готов"}
          </button>
        </div>
      ) : null}

      {room.status === "playing" || finished ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-line">
            <MonacoEditor
              height="380px"
              language={language}
              theme="vs-dark"
              value={solution}
              onChange={(v) => setSolution(v ?? "")}
              options={{
                readOnly: finished || Boolean(me?.passed),
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
          {!finished && !me?.passed ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-signal-ink disabled:opacity-40"
            >
              {busy ? "Проверяю…" : "Сдать решение"}
            </button>
          ) : null}
          {report ? (
            <pre className="overflow-x-auto rounded-xl border border-line bg-code-bg p-4 text-sm text-[#c8d4e8] whitespace-pre-wrap">
              {report}
            </pre>
          ) : null}
          {me?.report && me.report !== report ? (
            <pre className="overflow-x-auto rounded-xl border border-line bg-paper-elevated p-4 text-sm whitespace-pre-wrap">
              {me.report}
            </pre>
          ) : null}
        </div>
      ) : null}

      {finished ? (
        <div
          className={`rounded-xl border px-5 py-4 ${
            iWon
              ? "border-accent/40 bg-accent-soft"
              : iLost
                ? "border-line bg-paper-elevated"
                : "border-warn/30 bg-[#fff7e8]"
          }`}
        >
          <p className="font-semibold">
            {iWon
              ? "Ты победил."
              : iLost
                ? `Победил ${opponent?.name ?? "соперник"}.`
                : room.status === "expired"
                  ? "Время вышло."
                  : "Дуэль завершена."}
          </p>
          <Link
            href="/duel"
            className="mt-3 inline-flex text-sm text-accent hover:underline"
          >
            К дуэлям
          </Link>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-[#7a4a00]" aria-live="polite">
          {error}
        </p>
      ) : null}

      <Link href="/duel" className="inline-block text-sm text-muted hover:text-accent">
        ← лобби
      </Link>
    </div>
  );
}

function PlayerCard({
  label,
  name,
  ready,
  passed,
  highlight,
}: {
  label: string;
  name: string;
  ready: boolean;
  passed: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-accent/40 bg-accent-soft/30" : "border-line bg-paper-elevated"
      }`}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 font-semibold">{name}</p>
      <p className="mt-1 text-xs text-muted">
        {passed ? "сдал ✓" : ready ? "готов" : "не готов"}
      </p>
    </div>
  );
}
