import Link from "next/link";
import type { Metadata } from "next";
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  PART_LABELS,
  PART_PLANNED_COUNT,
  partsForBlock,
} from "@/lib/types/lesson";
import { MODULE_META } from "@/lib/course/meta";
import { PASS_RATIO } from "@/lib/progress/types";
import { getLessonMetas } from "@/lib/lessons/load-lessons";
import { ContinueLearning } from "@/components/course/continue-learning";

export const metadata: Metadata = {
  title: "Программа",
  description: "14 модулей курса Fullstacker: сроки и проекты.",
};

export default async function ProgramPage() {
  const metas = await getLessonMetas();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          программа
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Программа
        </h1>
        <p className="text-muted">
          14 модулей, около 5–8 месяцев при 10–15 часах в неделю. HTML и CSS не
          блокируют дальше (если уже верстаешь); JavaScript обязателен. На
          обязательных модулях — ≥{Math.round(PASS_RATIO * 100)}% уроков и
          принятый проект.
        </p>
      </div>

      <ContinueLearning metas={metas} />

      <div className="space-y-8">
        {BLOCK_ORDER.map((block) => (
          <section key={block} className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
              {BLOCK_LABELS[block]}
            </h2>
            <div className="overflow-hidden rounded-xl border border-line bg-paper-elevated">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-white/50 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Модуль</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">
                      Срок
                    </th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">
                      Уроки
                    </th>
                    <th className="px-4 py-3 font-medium">Проект</th>
                  </tr>
                </thead>
                <tbody>
                  {partsForBlock(block).map((part) => {
                    const meta = MODULE_META[part];
                    return (
                      <tr key={part} className="border-t border-line">
                        <td className="px-4 py-3">
                          <Link
                            href={`/lessons#${part}`}
                            className="font-medium text-ink hover:text-accent"
                          >
                            {PART_LABELS[part]}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted sm:hidden">
                            {meta.weeks} · {PART_PLANNED_COUNT[part]} уроков
                          </p>
                        </td>
                        <td className="hidden px-4 py-3 text-muted sm:table-cell">
                          {meta.weeks}
                          <br />
                          <span className="text-xs">{meta.hours}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-muted md:table-cell">
                          {PART_PLANNED_COUNT[part]}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {meta.projectTitle}
                          {meta.starter ? (
                            <>
                              <br />
                              <a
                                href={`/starters/${meta.starter}/README.md`}
                                className="text-xs text-accent hover:underline"
                              >
                                стартер
                              </a>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-paper-elevated p-5 text-sm text-muted">
        <p className="font-medium text-ink">Как закрыть модуль</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Пройди уроки.</li>
          <li>
            Сдай проект: ссылка, описание и самопроверка — засчитывается сразу.
          </li>
          <li>
            На обязательном модуле ≥{Math.round(PASS_RATIO * 100)}% уроков и
            сданный проект — откроется следующий.
          </li>
        </ol>
      </div>
    </div>
  );
}
