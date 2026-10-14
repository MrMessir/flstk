import type { LessonMeta } from "@/lib/types/lesson";

export function getLessonNeighbors(lessons: LessonMeta[], id: string) {
  const index = lessons.findIndex((lesson) => lesson.id === id);
  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? lessons[index - 1] : null,
    next: index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}
