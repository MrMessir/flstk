"use client";

import { useEffect, useState } from "react";

type RoomRow = {
  code: string;
  status: string;
  challengeId: string;
  challengeTitle: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  winnerId: string | null;
  matchmaking: boolean;
  players: { id: string; name: string; passed: boolean }[];
};

export function AdminDuels() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [queue, setQueue] = useState<
    { playerId: string; name: string; joinedAt: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/duels", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка");
      return;
    }
    setRooms(data.rooms as RoomRow[]);
    setQueue(data.queue ?? []);
    setError(null);
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Комнаты в Supabase (
          <code className="font-mono">duel_rooms</code> /{" "}
          <code className="font-mono">duel_queue</code>).
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-line px-3 py-1.5 text-sm"
        >
          Обновить
        </button>
      </div>
      {error ? <p className="text-sm text-[#7a4a00]">{error}</p> : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Очередь ({queue.length})</h2>
        {queue.length === 0 ? (
          <p className="text-sm text-muted">Пусто</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {queue.map((q) => (
              <li key={q.playerId} className="rounded border border-line px-3 py-2">
                {q.name}{" "}
                <span className="font-mono text-xs text-muted">{q.playerId}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Комнаты</h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper-elevated text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2">Код</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Задание</th>
                <th className="px-3 py-2">Игроки</th>
                <th className="px-3 py-2">Создана</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.code} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs">{room.code}</td>
                  <td className="px-3 py-2">{room.status}</td>
                  <td className="px-3 py-2">{room.challengeTitle}</td>
                  <td className="px-3 py-2">
                    {room.players
                      .map((p) => `${p.name}${p.passed ? "✓" : ""}`)
                      .join(" vs ") || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted">
                    {new Date(room.createdAt).toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
