import type { CoursePart, GlossaryEntry, Lesson } from "@/lib/types/lesson";
import { MODULE_LABELS, PART_LABELS } from "@/lib/types/lesson";

export type GlossaryTopic = {
  lessonId: string;
  part: CoursePart;
  partLabel: string;
  module: string;
  moduleLabel: string;
  lessonTitle: string;
  order: number;
  unlocked: boolean;
  entries: GlossaryEntry[];
};

export function collectGlossaryTopics(
  lessons: Lesson[],
  isCompleted: (lessonId: string) => boolean,
): GlossaryTopic[] {
  return lessons
    .filter((lesson) => lesson.glossary.length > 0)
    .map((lesson) => ({
      lessonId: lesson.id,
      part: lesson.part,
      partLabel: PART_LABELS[lesson.part],
      module: lesson.module,
      moduleLabel: MODULE_LABELS[lesson.module] ?? lesson.module,
      lessonTitle: lesson.title,
      order: lesson.order,
      unlocked: isCompleted(lesson.id),
      entries: lesson.glossary,
    }));
}

export function filterTopicsByLesson(
  topics: GlossaryTopic[],
  lessonId: string,
): GlossaryTopic[] {
  return topics.filter((topic) => topic.lessonId === lessonId);
}
