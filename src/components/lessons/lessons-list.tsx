"use client";

import Link from "next/link";
import type { LessonMeta } from "@/lib/types/lesson";
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  MODULE_LABELS,
  PART_ACCENT,
  PART_LABELS,
  PART_PLANNED_COUNT,
  partsForBlock,
} from "@/lib/types/lesson";
import { MODULE_META } from "@/lib/course/meta";
import { groupLessonsByPart } from "@/lib/lessons/group";
import { ProgressBar } from "@/components/ui/progress-bar";
import { GlossaryIconLink } from "@/components/glossary/glossary-icon-link";
import { ContinueLearning } from "@/components/course/continue-learning";
import { useProgress } from "@/lib/progress/use-progress";
import {
  buildModuleOutlines,
  isModulePassed,
  isModuleUnlocked,
  moduleProgress,
} from "@/lib/progress/gates";
import { PASS_RATIO } from "@/lib/progress/types";

type LessonsListProps = {
  lessons: LessonMeta[];
  publishedIds: string[];
};

function stepLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} шаг`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} шага`;
  }
  return `${count} шагов`;
}

function groupByModule(lessons: LessonMeta[]): [string, LessonMeta[]][] {
  const map = new Map<string, LessonMeta[]>();
  for (const lesson of lessons) {
    const list = map.get(lesson.module) ?? [];
    list.push(lesson);
    map.set(lesson.module, list);
  }
  return Array.from(map.entries());
}

export function LessonsList({ lessons, publishedIds }: LessonsListProps) {
  const published = new Set(publishedIds);
  const byPart = groupLessonsByPart(lessons);
  const { completedCount, isCompleted, ready, state } = useProgress();
  const contentReady = lessons.filter((lesson) => published.has(lesson.id)).length;
  const outlines = buildModuleOutlines(lessons);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-accent">
              программа
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Уроки</h1>
            <p className="text-sm leading-relaxed text-muted">
              HTML и CSS не блокируют дальше. JavaScript и остальные модули —
              ≥{Math.round(PASS_RATIO * 100)}% + принятый проект.
            </p>
          </div>

          <ContinueLearning metas={lessons} />

          <ProgressBar
            value={contentReady}
            max={Math.max(lessons.length, 1)}
            label="Уроков в курсе"
          />

          <ProgressBar
            value={ready ? completedCount : 0}
            max={Math.max(lessons.length, 1)}
            label="Ты прошёл"
          />

          <nav className="space-y-4" aria-label="Модули курса">
            {BLOCK_ORDER.map((block) => {
              const parts = partsForBlock(block).filter(
                (part) => byPart[part].length > 0,
              );
              if (parts.length === 0) return null;
              return (
                <div key={block} className="space-y-1">
                  <p className="px-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                    {BLOCK_LABELS[block]}
                  </p>
                  {parts.map((part) => {
                    const unlocked = ready
                      ? isModuleUnlocked(part, outlines, state)
                      : part === "tools";
                    return (
                      <a
                        key={part}
                        href={`#${part}`}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-white hover:text-ink"
                      >
                        <span>
                          {!unlocked ? "🔒 " : ""}
                          {PART_LABELS[part]}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {byPart[part].length}
                        </span>
                      </a>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-14">
          {BLOCK_ORDER.map((block) => {
            const parts = partsForBlock(block).filter(
              (part) => byPart[part].length > 0,
            );
            if (parts.length === 0) return null;

            return (
              <div key={block} className="space-y-10">
                <h2 className="text-xl font-bold tracking-tight text-ink/90">
                  {BLOCK_LABELS[block]}
                </h2>
                {parts.map((part) => {
                  const partLessons = byPart[part];
                  const outline = outlines.find((item) => item.part === part);
                  const unlocked = ready
                    ? isModuleUnlocked(part, outlines, state)
                    : part === "tools";
                  const progress =
                    ready && outline
                      ? moduleProgress(outline, state)
                      : { done: 0, total: partLessons.length, ratio: 0, projectAccepted: false };
                  const passed =
                    ready && outline ? isModulePassed(outline, state) : false;
                  const meta = MODULE_META[part];
                  const planned = PART_PLANNED_COUNT[part];

                  return (
                    <section
                      key={part}
                      id={part}
                      className={`scroll-mt-28 space-y-6 border-l-4 pl-4 sm:pl-6 ${PART_ACCENT[part]} ${
                        unlocked ? "" : "opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-semibold tracking-tight">
                            {!unlocked ? "🔒 " : passed ? "✓ " : ""}
                            {PART_LABELS[part]}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {meta.weeks} · {meta.hours} · проект:{" "}
                            {meta.projectTitle}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {progress.done} из {planned} ·{" "}
                            {Math.round(progress.ratio * 100)}%
                            {progress.projectAccepted
                              ? " · проект принят"
                              : " · проект ещё не принят"}
                          </p>
                        </div>
                      </div>

                      {!unlocked ? (
                        <p className="rounded-xl border border-line bg-paper-elevated px-4 py-3 text-sm text-muted">
                          Модуль откроется после порога предыдущего обязательного
                          (≥{Math.round(PASS_RATIO * 100)}% + принятый проект).
                        </p>
                      ) : null}

                      {groupByModule(partLessons).map(
                        ([module, moduleLessons]) => (
                          <div key={module} className="space-y-3">
                            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                              {MODULE_LABELS[module] ?? module}
                            </h4>
                            <ul className="overflow-hidden rounded-xl border border-line bg-paper-elevated">
                              {moduleLessons.map((lesson, index) => {
                                const contentOk = published.has(lesson.id);
                                const done = isCompleted(lesson.id);
                                const isProject = lesson.isProject;
                                const href = unlocked
                                  ? `/lessons/${lesson.id}`
                                  : `/lessons#${part}`;
                                return (
                                  <li
                                    key={lesson.id}
                                    className={
                                      index > 0
                                        ? "border-t border-line"
                                        : undefined
                                    }
                                  >
                                    <div className="flex items-start gap-2 px-3 py-3 sm:px-4">
                                      <Link
                                        href={href}
                                        className="group flex min-w-0 flex-1 items-start gap-4 rounded-md px-1 py-1 transition-colors hover:bg-white"
                                      >
                                        <span
                                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold ${
                                            done
                                              ? "bg-signal text-signal-ink"
                                              : contentOk && unlocked
                                                ? "bg-accent-soft text-accent"
                                                : "bg-line/70 text-muted"
                                          }`}
                                        >
                                          {isProject
                                            ? "И"
                                            : String(lesson.order).padStart(
                                                2,
                                                "0",
                                              )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                          <span className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-ink group-hover:text-accent">
                                              {lesson.title}
                                            </span>
                                            {isProject ? (
                                              <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[11px] font-medium text-signal">
                                                Итог
                                              </span>
                                            ) : contentOk ? (
                                              <span className="rounded-sm bg-line/80 px-1.5 py-0.5 text-[11px] font-medium text-muted">
                                                {stepLabel(lesson.stepCount)}
                                              </span>
                                            ) : null}
                                            <span
                                              className={`rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                                                done
                                                  ? "bg-signal/30 text-signal-ink"
                                                  : !unlocked
                                                    ? "bg-line text-muted"
                                                    : contentOk
                                                      ? "bg-accent-soft text-accent"
                                                      : "bg-line text-muted"
                                              }`}
                                            >
                                              {done
                                                ? "Пройден"
                                                : !unlocked
                                                  ? "Закрыт"
                                                  : contentOk
                                                    ? "Готов"
                                                    : "Скоро"}
                                            </span>
                                          </span>
                                          <span className="mt-1 block text-sm text-muted">
                                            {lesson.goal}
                                          </span>
                                        </span>
                                      </Link>
                                      <GlossaryIconLink
                                        lessonId={lesson.id}
                                        className="mt-1 shrink-0"
                                      />
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ),
                      )}
                    </section>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
