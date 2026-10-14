import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="font-semibold tracking-tight">Fullstacker</p>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Курс fullstack на русском.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Курс
          </p>
          <ul className="space-y-2 text-sm text-white/75">
            <li>
              <Link href="/lessons" className="hover:text-signal">
                Все уроки
              </Link>
            </li>
            <li>
              <Link href="/lessons#html" className="hover:text-signal">
                HTML · 13 уроков
              </Link>
            </li>
            <li>
              <Link href="/lessons#css" className="hover:text-signal">
                CSS · 17 уроков
              </Link>
            </li>
            <li>
              <Link href="/lessons#javascript" className="hover:text-signal">
                JavaScript · 31 урок
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Ещё
          </p>
          <p className="font-mono text-xs text-white/45">v0.1</p>
          <p className="space-x-3 text-xs text-white/45">
            <Link href="/privacy" className="hover:text-signal">
              Конфиденциальность
            </Link>
            <Link href="/terms" className="hover:text-signal">
              Условия
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
