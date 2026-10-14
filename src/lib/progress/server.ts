import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import type { ProgressState } from "@/lib/progress/types";
import {
  buildModuleOutlines,
  isLessonUnlocked,
} from "@/lib/progress/gates";
import type { Lesson, LessonMeta } from "@/lib/types/lesson";

function emptyState(): ProgressState {
  return {
    version: 2,
    completed: {},
    checklists: {},
    projects: {},
  };
}

/** Progress for the signed-in user from lesson_progress (server-trusted). */
export async function getServerProgressState(): Promise<ProgressState> {
  const profile = await getSessionProfile();
  if (!profile) return emptyState();

  const supabase = await createClient();
  if (!supabase) return emptyState();

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status")
    .eq("user_id", profile.id)
    .eq("status", "completed");

  const state = emptyState();
  if (error || !data) return state;
  for (const row of data) {
    state.completed[row.lesson_id] = true;
  }
  return state;
}

export function isLessonUnlockedForState(
  lessonId: string,
  metas: LessonMeta[],
  state: ProgressState,
): boolean {
  const outlines = buildModuleOutlines(metas);
  return isLessonUnlocked(lessonId, outlines, state);
}

/** Strip theory/quiz/code when the module is still locked for this user. */
export function redactLockedLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    goal: "Модуль ещё закрыт. Закрой предыдущий обязательный модуль.",
    theory: [],
    codeExample: "",
    practice: [],
    checklist: [],
    links: [],
    glossary: [],
    steps: [
      {
        type: "theory",
        title: "Модуль закрыт",
        theory: [
          {
            type: "paragraph",
            content:
              "Контент урока скрыт на сервере, пока не выполнен предыдущий обязательный модуль.",
          },
        ],
      },
    ],
  };
}
