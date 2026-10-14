"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  usersTotal: number;
  proCount: number;
  duelsStartedToday: number;
  activeRooms: number;
  finishedRooms: number;
  challengesCount: number;
  lessonsCount: number;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/stats")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ошибка");
        setStats(data as Stats);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Ошибка"),
      );
  }, []);

  if (error) {
    return (
      <p className="rounded-md border border-warn/30 bg-[#fff7e8] px-3 py-2 text-sm">
        {error}
      </p>
    );
  }

  if (!stats) {
    return <p className="text-muted">Загрузка статистики…</p>;
  }

  const cards = [
    { label: "Пользователи", value: stats.usersTotal, href: "/admin/users" },
    { label: "Pro", value: stats.proCount, href: "/admin/users" },
    {
      label: "Дуэли сегодня",
      value: stats.duelsStartedToday,
      href: "/admin/duels",
    },
    { label: "Активные комнаты", value: stats.activeRooms, href: "/admin/duels" },
    {
      label: "Завершённые (файл)",
      value: stats.finishedRooms,
      href: "/admin/duels",
    },
    {
      label: "Задания дуэлей",
      value: stats.challengesCount,
      href: "/admin/challenges",
    },
    { label: "Уроки в репо", value: stats.lessonsCount, href: "/lessons" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Пользователи, тарифы, лимит дуэлей, задания и комнаты.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-line bg-paper-elevated px-4 py-4 transition-colors hover:border-accent/40"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
