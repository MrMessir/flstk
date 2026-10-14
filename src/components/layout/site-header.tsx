"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMe } from "@/hooks/use-me";

const navItems = [
  { href: "/", label: "Главная", match: (path: string) => path === "/" },
  {
    href: "/program",
    label: "Программа",
    match: (path: string) => path.startsWith("/program"),
  },
  {
    href: "/lessons",
    label: "Уроки",
    match: (path: string) => path.startsWith("/lessons"),
  },
  {
    href: "/duel",
    label: "Дуэли",
    match: (path: string) => path.startsWith("/duel"),
  },
  {
    href: "/glossary",
    label: "Словарь",
    match: (path: string) => path.startsWith("/glossary"),
  },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const { data: me } = useMe();
  const isAdmin = me?.user?.role === "admin";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    setEmail(null);
    router.push("/login");
    router.refresh();
  }

  const startHref = email ? "/lessons" : "/login?next=/lessons";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-signal font-mono text-sm font-bold text-signal-ink"
            aria-hidden
          >
            {"</>"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-tight">
              Fullstacker
            </span>
            <span className="hidden text-[11px] text-white/55 sm:block">
              курс fullstack
            </span>
          </span>
        </Link>

        <nav
          className="ml-auto hidden items-center gap-1 md:flex"
          aria-label="Основная навигация"
        >
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isAdmin ? (
            <Link
              href="/admin"
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-white/10 text-white"
                  : "text-signal hover:bg-white/5"
              }`}
            >
              Админ
            </Link>
          ) : null}
          {email ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Выйти
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Вход
            </Link>
          )}
          <Link
            href={startHref}
            className="ml-2 rounded-md bg-signal px-3.5 py-2 text-sm font-semibold text-signal-ink transition-transform hover:brightness-105 active:scale-[0.98]"
          >
            Начать
          </Link>
        </nav>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Закрыть меню" : "Открыть меню"}</span>
          <span aria-hidden className="font-mono text-lg">
            {open ? "×" : "≡"}
          </span>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-ink-soft px-4 py-3 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Мобильная навигация">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2.5 text-sm ${
                    active ? "bg-white/10 text-white" : "text-white/75"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-md px-3 py-2.5 text-sm text-signal"
              >
                Админ
              </Link>
            ) : null}
            {email ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-md px-3 py-2.5 text-left text-sm text-white/75"
              >
                Выйти ({email})
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-md px-3 py-2.5 text-sm text-white/75"
              >
                Вход
              </Link>
            )}
            <Link
              href={startHref}
              className="mt-1 rounded-md bg-signal px-3 py-2.5 text-center text-sm font-semibold text-signal-ink"
            >
              Начать
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
