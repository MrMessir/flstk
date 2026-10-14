import type {
  Lesson,
  LessonStep,
  PracticeTask,
  TheoryBlock,
} from "@/lib/types/lesson";
import type { LessonSchema } from "@/lib/lessons/schema";
import { buildQuizQuestions } from "@/lib/lessons/build-quiz";
import { isProjectLesson } from "@/lib/types/lesson";

function buildRegularSteps(raw: LessonSchema): LessonStep[] {
  const steps: LessonStep[] = [];

  if (raw.theory.length > 0) {
    steps.push({
      type: "theory",
      title: "Теория",
      theory: raw.theory as TheoryBlock[],
      codeExample: raw.codeExample || undefined,
    });
  }

  const questions = buildQuizQuestions(
    raw.glossary,
    raw.checklist,
    raw.id,
    raw.quiz,
  );
  steps.push({
    type: "quiz",
    title: "Проверь себя",
    questions,
  });

  if (raw.practice.length > 0) {
    steps.push({
      type: "practice",
      title: "Практика",
      practice: raw.practice as PracticeTask[],
      codeExample: raw.codeExample || undefined,
      checklist: raw.checklist,
    });
  }

  return steps;
}

function buildProjectSteps(raw: LessonSchema): LessonStep[] {
  return [
    {
      type: "project",
      title: "Итоговая работа",
      theory: raw.theory as TheoryBlock[],
      practice: raw.practice as PracticeTask[],
      codeExample: raw.codeExample || undefined,
      checklist: raw.checklist,
    },
  ];
}

export function normalizeLesson(raw: LessonSchema): Lesson {
  const steps =
    raw.steps && raw.steps.length > 0
      ? (raw.steps as LessonStep[])
      : isProjectLesson(raw)
        ? buildProjectSteps(raw)
        : buildRegularSteps(raw);

  return {
    id: raw.id,
    part: raw.part,
    module: raw.module,
    order: raw.order,
    title: raw.title,
    goal: raw.goal,
    steps,
    theory: raw.theory as TheoryBlock[],
    codeExample: raw.codeExample,
    practice: raw.practice as PracticeTask[],
    checklist: raw.checklist,
    links: raw.links,
    glossary: raw.glossary,
    quiz: raw.quiz,
  };
}
