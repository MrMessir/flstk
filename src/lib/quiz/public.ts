import type { Lesson } from "@/lib/types/lesson";

/** Убирает из урока правильные ответы и пояснения перед отправкой в браузер. */
export function stripQuizAnswers(lesson: Lesson): Lesson {
  return {
    ...lesson,
    quiz: undefined,
    steps: lesson.steps.map((step) =>
      step.type === "quiz"
        ? {
            ...step,
            questions: step.questions.map(({ id, prompt, options }) => ({
              id,
              prompt,
              options,
            })),
          }
        : step,
    ),
  };
}
