import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-20 sm:px-6">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Страница не найдена</h1>
      <p className="text-muted">Такого урока или раздела нет в программе курса.</p>
      <Link
        href="/lessons"
        className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-soft"
      >
        К списку уроков
      </Link>
    </div>
  );
}
