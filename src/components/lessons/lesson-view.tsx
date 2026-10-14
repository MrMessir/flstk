import type { Lesson, LessonMeta } from "@/lib/types/lesson";
import { LessonAccessGate } from "@/components/lessons/lesson-access-gate";

type LessonViewProps = {
  lesson: Lesson;
  prev: LessonMeta | null;
  next: LessonMeta | null;
  metas: LessonMeta[];
  /** Server-computed unlock (DB progress). Client cannot override. */
  serverUnlocked: boolean;
};

/** Thin server wrapper — access gate + Stepik-style player. */
export function LessonView({
  lesson,
  prev,
  next,
  metas,
  serverUnlocked,
}: LessonViewProps) {
  return (
    <LessonAccessGate
      lesson={lesson}
      prev={prev}
      next={next}
      metas={metas}
      serverUnlocked={serverUnlocked}
    />
  );
}
