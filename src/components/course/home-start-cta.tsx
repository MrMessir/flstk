"use client";

import Link from "next/link";
import { useMe } from "@/hooks/use-me";

type HomeStartCtaProps = {
  firstLessonId: string;
};

export function HomeStartCta({ firstLessonId }: HomeStartCtaProps) {
  const { data, loading } = useMe();
  const loggedIn = Boolean(data?.user);
  const href = loggedIn
    ? `/lessons/${firstLessonId}`
    : `/login?next=${encodeURIComponent(`/lessons/${firstLessonId}`)}`;
  const label = loading
    ? "Загрузка…"
    : loggedIn
      ? "Начать обучение"
      : "Войти и начать";

  return (
    <Link
      href={href}
      className="rounded-md bg-signal px-5 py-3 text-sm font-semibold text-signal-ink transition-transform hover:brightness-105 active:scale-[0.98]"
      aria-disabled={loading}
    >
      {label}
    </Link>
  );
}
