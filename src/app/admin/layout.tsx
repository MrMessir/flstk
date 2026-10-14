import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

export const instant = false;

const links = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/duels", label: "Дуэли" },
  { href: "/admin/challenges", label: "Задания" },
  { href: "/admin/settings", label: "Настройки" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Auth + profile use request-time time; avoid prerender Date.now() crash.
  await connection();
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            admin
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Панель</h1>
        </div>
        <Link href="/" className="text-sm text-muted hover:text-accent">
          ← на сайт
        </Link>
      </div>
      <nav
        className="mb-8 flex flex-wrap gap-1 border-b border-line pb-3"
        aria-label="Админ-навигация"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm text-muted hover:bg-accent-soft hover:text-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
