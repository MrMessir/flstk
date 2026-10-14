import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { CoursePart, Lesson, LessonMeta } from "@/lib/types/lesson";
import { isProjectLesson, PART_ORDER } from "@/lib/types/lesson";
import { lessonSchema } from "@/lib/lessons/schema";
import { normalizeLesson } from "@/lib/lessons/normalize-lesson";
import { isPublished } from "@/lib/lessons/is-published";

const CONTENT_ROOT = path.join(process.cwd(), "content", "lessons");
const PARTS: CoursePart[] = PART_ORDER;

async function readLessonFile(filePath: string): Promise<Lesson> {
  const raw = await readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return normalizeLesson(lessonSchema.parse(parsed));
}

async function listPartFiles(part: CoursePart): Promise<string[]> {
  const dir = path.join(CONTENT_ROOT, part);
  try {
    const entries = await readdir(dir);
    return entries
      .filter((name) => name.endsWith(".json"))
      .map((name) => path.join(dir, name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function getAllLessons(): Promise<Lesson[]> {
  "use cache";

  const files = (
    await Promise.all(PARTS.map((part) => listPartFiles(part)))
  ).flat();

  const lessons = await Promise.all(files.map((file) => readLessonFile(file)));

  return lessons.sort((a, b) => {
    const partOrder = PARTS.indexOf(a.part) - PARTS.indexOf(b.part);
    if (partOrder !== 0) {
      return partOrder;
    }
    return a.order - b.order;
  });
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  "use cache";

  const lessons = await getAllLessons();
  return lessons.find((lesson) => lesson.id === id) ?? null;
}

export async function getPublishedLessons(): Promise<Lesson[]> {
  "use cache";

  const lessons = await getAllLessons();
  return lessons.filter(isPublished);
}

export async function getLessonMetas(): Promise<LessonMeta[]> {
  "use cache";

  const lessons = await getAllLessons();
  return lessons.map((lesson) => ({
    id: lesson.id,
    part: lesson.part,
    module: lesson.module,
    order: lesson.order,
    title: lesson.title,
    goal: lesson.goal,
    isProject: isProjectLesson(lesson),
    stepCount: lesson.steps.length,
  }));
}

export { groupLessonsByPart } from "@/lib/lessons/group";
