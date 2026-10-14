import type { CoursePart, LessonMeta } from "@/lib/types/lesson";
import { PART_ORDER } from "@/lib/types/lesson";

export function groupLessonsByPart(
  lessons: LessonMeta[],
): Record<CoursePart, LessonMeta[]> {
  const empty = Object.fromEntries(
    PART_ORDER.map((part) => [part, [] as LessonMeta[]]),
  ) as Record<CoursePart, LessonMeta[]>;

  for (const lesson of lessons) {
    empty[lesson.part].push(lesson);
  }

  return empty;
}
