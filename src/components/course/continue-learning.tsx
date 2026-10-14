"use client";

import Link from "next/link";
import type { LessonMeta } from "@/lib/types/lesson";
import { PART_LABELS } from "@/lib/types/lesson";
import { useProgress } from "@/lib/progress/use-progress";
import {
  buildModuleOutlines,
  getContinueLessonId,
} from "@/lib/progress/gates";

type ContinueLearningProps = {
  metas: LessonMeta[];
};

export function ContinueLearning({ metas }: ContinueLearningProps) {
  const { ready, state } = useProgress();
  if (!ready || metas.length === 0) {
    return null;
  }

  const outlines = buildModuleOutlines(metas);
  const id = getContinueLessonId(metas, outlines, state);
  if (!id) return null;

  const lesson = metas.find((item) => item.id === id);
  if (!lesson) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-5 sm:p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-accent">
        продолжить
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">
        {lesson.title}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {PART_LABELS[lesson.part]} · {lesson.goal}
      </p>
      <Link
        href={`/lessons/${lesson.id}`}
        className="mt-4 inline-flex rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-signal-ink"
      >
        Открыть урок
      </Link>
    </div>
  );
}
