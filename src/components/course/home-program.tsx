"use client";

import Link from "next/link";
import type { LessonMeta } from "@/lib/types/lesson";
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  PART_LABELS,
  partsForBlock,
  type CoursePart,
} from "@/lib/types/lesson";
import { MODULE_META } from "@/lib/course/meta";
import { PASS_RATIO, type ProgressState } from "@/lib/progress/types";
import { useProgress } from "@/lib/progress/use-progress";
import {
  buildModuleOutlines,
  isModulePassed,
  isModuleUnlocked,
  moduleProgress,
  type ModuleOutline,
} from "@/lib/progress/gates";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ContinueLearning } from "@/components/course/continue-learning";

type HomeProgramProps = {
  metas: LessonMeta[];
};

function moduleStatusLabel(
  part: CoursePart,
  outlines: ModuleOutline[],
  outline: ModuleOutline | undefined,
  state: ProgressState,
): string {
  if (!outline) return "скоро";
  if (!isModuleUnlocked(part, outlines, state)) return "закрыт";
  if (isModulePassed(outline, state)) return "пройден";
  const { done, total } = moduleProgress(outline, state);
  if (done === 0) return "не начат";
  return `${done}/${total}`;
}

export function HomeProgram({ metas }: HomeProgramProps) {
  const { ready, state } = useProgress();
  const outlines = buildModuleOutlines(metas);
  const outlineByPart = Object.fromEntries(
    outlines.map((item) => [item.part, item]),
  ) as Partial<Record<CoursePart, ModuleOutline>>;

  const totalLessons = metas.length;
  const completedLessons = ready
    ? metas.filter((meta) => state.completed[meta.id]).length
    : 0;

  return (
    <section className="mx-auto max-w-6xl space-y-10 px-4 py-14 sm:px-6">
      <div className="max-w-xl space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">Программа</h2>
        <p className="text-muted">
          HTML и CSS не блокируют следующие модули (если уже верстаешь).
          JavaScript и дальше — обязательны: ≥{Math.round(PASS_RATIO * 100)}%
          уроков и принятый проект.
        </p>
      </div>

      <ContinueLearning metas={metas} />

      <div className="rounded-xl border border-line bg-paper-elevated p-5 sm:p-6">
        {ready ? (
          <ProgressBar
            value={completedLessons}
            max={Math.max(totalLessons, 1)}
            label="Твой прогресс по курсу"
          />
        ) : (
          <p className="text-sm text-muted">Считаю прогресс…</p>
        )}
      </div>

      <div className="space-y-8">
        {BLOCK_ORDER.map((block) => {
          const parts = partsForBlock(block);
          return (
            <div key={block} className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted">
                {BLOCK_LABELS[block]}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {parts.map((part) => {
                  const outline = outlineByPart[part];
                  const status = ready
                    ? moduleStatusLabel(part, outlines, outline, state)
                    : "…";
                  const progress = outline
                    ? moduleProgress(outline, state)
                    : null;
                  const count = outline?.lessonIds.length ?? 0;

                  return (
                    <Link
                      key={part}
                      href={`/lessons#${part}`}
                      className="group relative overflow-hidden rounded-xl border border-line bg-paper-elevated p-5 transition-colors hover:border-accent"
                    >
                      <p className="font-mono text-xs text-muted">{status}</p>
                      <h4 className="mt-2 text-lg font-semibold tracking-tight group-hover:text-accent">
                        {PART_LABELS[part]}
                      </h4>
                      <p className="mt-1 text-sm text-muted">
                        {MODULE_META[part].weeks}
                        {ready && progress
                          ? ` · ${progress.done}/${progress.total} уроков`
                          : count > 0
                            ? ` · ${count} уроков`
                            : null}
                      </p>
                      {ready && progress && progress.total > 0 ? (
                        <div className="mt-3 h-1.5 overflow-hidden rounded-sm bg-line">
                          <div
                            className="h-full rounded-sm bg-accent transition-[width]"
                            style={{
                              width: `${Math.round(progress.ratio * 100)}%`,
                            }}
                          />
                        </div>
                      ) : null}
                      <p className="mt-3 text-sm text-ink/70">
                        {MODULE_META[part].projectTitle}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
