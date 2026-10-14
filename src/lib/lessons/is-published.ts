import type { Lesson } from "@/lib/types/lesson";

export function isPublished(lesson: Lesson): boolean {
  if (lesson.steps.length === 0) {
    return false;
  }

  if (lesson.module === "project") {
    return lesson.practice.length > 0 || lesson.steps.some((s) => s.type === "project");
  }

  return (
    lesson.theory.length > 0 &&
    lesson.practice.length > 0 &&
    lesson.checklist.length > 0
  );
}
