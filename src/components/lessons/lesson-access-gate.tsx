"use client";

import Link from "next/link";
import type { Lesson, LessonMeta } from "@/lib/types/lesson";
import { PART_LABELS } from "@/lib/types/lesson";
import { useProgress } from "@/lib/progress/use-progress";
import {
  buildModuleOutlines,
  getBlockingOutline,
  isModulePassed,
  moduleProgress,
} from "@/lib/progress/gates";
import { PASS_RATIO } from "@/lib/progress/types";
import { LessonPlayer } from "@/components/lessons/lesson-player";

type LessonAccessGateProps = {
  lesson: Lesson;
  prev: LessonMeta | null;
  next: LessonMeta | null;
  metas: LessonMeta[];
  /** From server DB progress — localStorage cannot unlock content. */
  serverUnlocked: boolean;
};

export function LessonAccessGate({
  lesson,
  prev,
  next,
  metas,
  serverUnlocked,
}: LessonAccessGateProps) {
  const { ready, state } = useProgress();
  const outlines = buildModuleOutlines(metas);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-muted">
        Проверяю доступ к модулю…
      </div>
    );
  }

  if (!serverUnlocked) {
    const blocker = getBlockingOutline(lesson.part, outlines, state);
    const progress = blocker ? moduleProgress(blocker, state) : null;
    const passed = blocker ? isModulePassed(blocker, state) : true;

    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          модуль закрыт
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <div className="rounded-xl border border-warn/30 bg-[#fff7e8] px-5 py-4 text-[#7a4a00]">
          <p>
            Сначала закрой
            {blocker ? (
              <>
                {" "}
                <strong>{PART_LABELS[blocker.part]}</strong>
              </>
            ) : (
              " предыдущий обязательный модуль"
            )}
            : ≥{Math.round(PASS_RATIO * 100)}% уроков и принятый проект.
          </p>
          {progress ? (
            <p className="mt-2 text-sm">
              Сейчас: {progress.done}/{progress.total} (
              {Math.round(progress.ratio * 100)}%), проект:{" "}
              {progress.projectAccepted ? "принят" : "ещё не принят"}
              {passed ? " — условие уже выполнено" : ""}.
            </p>
          ) : null}
        </div>
        <Link
          href={blocker ? `/lessons#${blocker.part}` : "/lessons"}
          className="inline-flex rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-signal-ink"
        >
          К предыдущему модулю
        </Link>
      </div>
    );
  }

  return <LessonPlayer lesson={lesson} prev={prev} next={next} />;
}
