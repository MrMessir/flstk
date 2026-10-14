import type { CoursePart, LessonMeta } from "@/lib/types/lesson";
import { PART_ORDER, isProjectLesson } from "@/lib/types/lesson";
import type { ProgressState } from "@/lib/progress/types";
import { PASS_RATIO } from "@/lib/progress/types";

/**
 * Не блокируют следующие модули.
 * HTML/CSS можно пропустить, если уже верстаешь; JavaScript обязателен.
 */
export const OPTIONAL_PARTS = new Set<CoursePart>(["html", "css"]);

export function isPartRequiredForGate(part: CoursePart): boolean {
  return !OPTIONAL_PARTS.has(part);
}

export type ModuleOutline = {
  part: CoursePart;
  lessonIds: string[];
  regularIds: string[];
  projectIds: string[];
};

export function buildModuleOutlines(metas: LessonMeta[]): ModuleOutline[] {
  return PART_ORDER.map((part) => {
    const partLessons = metas
      .filter((lesson) => lesson.part === part)
      .sort((a, b) => a.order - b.order);
    const projects = partLessons.filter((lesson) => isProjectLesson(lesson));
    const regular = partLessons.filter((lesson) => !isProjectLesson(lesson));
    return {
      part,
      lessonIds: partLessons.map((lesson) => lesson.id),
      regularIds: regular.map((lesson) => lesson.id),
      projectIds: projects.map((lesson) => lesson.id),
    };
  }).filter((outline) => outline.lessonIds.length > 0);
}

export function moduleProgress(
  outline: ModuleOutline,
  state: ProgressState,
): { done: number; total: number; ratio: number; projectAccepted: boolean } {
  const total = Math.max(outline.lessonIds.length, 1);
  const done = outline.lessonIds.filter((id) => state.completed[id]).length;

  // Server progress only has `completed` (lesson_progress). Local/UI may also
  // store `projects[id].status === "accepted"` after auto-submit.
  const projectAccepted =
    outline.projectIds.length === 0
      ? done / total >= PASS_RATIO
      : outline.projectIds.every(
          (id) =>
            state.projects[id]?.status === "accepted" ||
            Boolean(state.completed[id]),
        );

  return {
    done,
    total,
    ratio: done / total,
    projectAccepted,
  };
}

/** Module is finished enough to open the next one. */
export function isModulePassed(
  outline: ModuleOutline,
  state: ProgressState,
): boolean {
  const { ratio, projectAccepted } = moduleProgress(outline, state);
  return ratio >= PASS_RATIO && projectAccepted;
}

export function isModuleUnlocked(
  part: CoursePart,
  outlines: ModuleOutline[],
  state: ProgressState,
): boolean {
  const index = outlines.findIndex((item) => item.part === part);
  if (index <= 0) {
    return true;
  }

  for (let i = 0; i < index; i += 1) {
    if (!isPartRequiredForGate(outlines[i].part)) {
      continue;
    }
    if (!isModulePassed(outlines[i], state)) {
      return false;
    }
  }
  return true;
}

/** Предыдущий обязательный модуль, который ещё не закрыт. */
export function getBlockingOutline(
  part: CoursePart,
  outlines: ModuleOutline[],
  state: ProgressState,
): ModuleOutline | null {
  const index = outlines.findIndex((item) => item.part === part);
  if (index <= 0) {
    return null;
  }

  for (let i = index - 1; i >= 0; i -= 1) {
    const outline = outlines[i];
    if (!isPartRequiredForGate(outline.part)) {
      continue;
    }
    if (!isModulePassed(outline, state)) {
      return outline;
    }
  }
  return null;
}

export function isLessonUnlocked(
  lessonId: string,
  outlines: ModuleOutline[],
  state: ProgressState,
): boolean {
  const outline = outlines.find((item) => item.lessonIds.includes(lessonId));
  if (!outline) {
    return true;
  }
  return isModuleUnlocked(outline.part, outlines, state);
}

export function getContinueLessonId(
  metas: LessonMeta[],
  outlines: ModuleOutline[],
  state: ProgressState,
): string | null {
  const ordered = [...metas].sort((a, b) => {
    const pa = PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part);
    if (pa !== 0) return pa;
    return a.order - b.order;
  });

  for (const lesson of ordered) {
    if (!isLessonUnlocked(lesson.id, outlines, state)) {
      continue;
    }
    if (!state.completed[lesson.id]) {
      return lesson.id;
    }
  }
  return ordered[0]?.id ?? null;
}

export function checklistComplete(
  lessonId: string,
  requiredLength: number,
  state: ProgressState,
): boolean {
  if (requiredLength <= 0) {
    return true;
  }
  const checks = state.checklists[lessonId] ?? [];
  if (checks.length < requiredLength) {
    return false;
  }
  return checks.slice(0, requiredLength).every(Boolean);
}
