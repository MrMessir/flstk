"use client";

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  plan: "free" | "pro";
  is_banned: boolean;
  created_at: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка");
      return;
    }
    setUsers(data.users as UserRow[]);
    setError(null);
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск email / ник"
          className="min-w-[14rem] flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-ink px-4 py-2 text-sm text-white"
        >
          Обновить
        </button>
      </div>
      {error ? (
        <p className="text-sm text-[#7a4a00]">{error}</p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper-elevated text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">Пользователь</th>
              <th className="px-3 py-2">Роль</th>
              <th className="px-3 py-2">Тариф</th>
              <th className="px-3 py-2">Бан</th>
              <th className="px-3 py-2">Создан</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <p className="font-medium">{u.display_name || "—"}</p>
                  <p className="text-xs text-muted">{u.email || u.id}</p>
                </td>
                <td className="px-3 py-2">
                  <select
                    disabled={busyId === u.id}
                    value={u.role}
                    onChange={(e) =>
                      void patch(u.id, {
                        role: e.target.value,
                        ...(e.target.value === "admin" ? { plan: "pro" } : {}),
                      })
                    }
                    className="rounded border border-line bg-white px-2 py-1"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    disabled={busyId === u.id}
                    value={u.plan}
                    onChange={(e) =>
                      void patch(u.id, { plan: e.target.value })
                    }
                    className="rounded border border-line bg-white px-2 py-1"
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() =>
                      void patch(u.id, { is_banned: !u.is_banned })
                    }
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      u.is_banned
                        ? "bg-[#fff7e8] text-[#7a4a00]"
                        : "bg-accent-soft text-ink"
                    }`}
                  >
                    {u.is_banned ? "забанен" : "ок"}
                  </button>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {new Date(u.created_at).toLocaleDateString("ru-RU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
