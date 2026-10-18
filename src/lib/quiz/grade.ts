import { buildQuizQuestions } from "@/lib/lessons/build-quiz";
import type { Lesson, QuizQuestion } from "@/lib/types/lesson";

/** Доля верных ответов, при которой тест считается пройденным. */
export const PASS_RATIO = 0.7;

/** Сколько верных ответов нужно из total (округление вверх: 5 из 5 → 4, 3 из 3 → 3). */
export function requiredCorrect(total: number): number {
  return Math.ceil(total * PASS_RATIO - 1e-9);
}

export type GradedAnswer = { id: string; correct: boolean };

export type GradeResult = {
  correct: number;
  total: number;
  required: number;
  passed: boolean;
  results: GradedAnswer[];
};

/** Полные вопросы урока (с правильными ответами). Только для сервера. */
export function getQuizQuestions(lesson: Lesson): QuizQuestion[] {
  if (!lesson.steps.some((step) => step.type === "quiz")) return [];
  return buildQuizQuestions(
    lesson.glossary,
    lesson.checklist,
    lesson.id,
    lesson.quiz,
  );
}

/** answers: id вопроса → индекс выбранного варианта. Пропущенный вопрос считается неверным. */
export function gradeQuiz(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): GradeResult {
  const results = questions.map((question) => {
    const picked = answers[question.id];
    return {
      id: question.id,
      correct: Number.isInteger(picked) && picked === question.correctIndex,
    };
  });
  const correct = results.filter((r) => r.correct).length;
  const required = requiredCorrect(questions.length);
  return {
    correct,
    total: questions.length,
    required,
    passed: questions.length > 0 && correct >= required,
    results,
  };
}
