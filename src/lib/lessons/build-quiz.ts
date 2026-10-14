import type { GlossaryEntry, QuizQuestion } from "@/lib/types/lesson";

/** Deterministic PRNG so quiz options stay stable across SSR/cache. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleDeterministic<T>(items: T[], seed: string): T[] {
  const next = mulberry32(hashSeed(seed));
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(
  entries: GlossaryEntry[],
  correct: GlossaryEntry,
  count: number,
  seed: string,
): string[] {
  const pool = entries
    .filter((entry) => entry.term !== correct.term)
    .map((entry) => entry.meaning);

  const unique = Array.from(new Set(pool)).filter(
    (meaning) => meaning !== correct.meaning,
  );
  return shuffleDeterministic(unique, seed).slice(0, count);
}

function normalizeAuthored(
  authored: QuizQuestion[],
  lessonId: string,
): QuizQuestion[] {
  return authored.map((question, index) => {
    const options = [...question.options];
    const correct = options[question.correctIndex];
    if (correct === undefined) {
      return {
        ...question,
        id: question.id || `${lessonId}-q${index + 1}`,
      };
    }
    const shuffled = shuffleDeterministic(options, `${lessonId}-aq${index}`);
    return {
      ...question,
      id: question.id || `${lessonId}-q${index + 1}`,
      options: shuffled,
      correctIndex: shuffled.indexOf(correct),
    };
  });
}

function buildGlossaryQuestions(
  glossary: GlossaryEntry[],
  lessonId: string,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const glossarySource =
    glossary.length >= 2
      ? glossary.slice(0, 4)
      : glossary.length === 1
        ? glossary
        : [];

  for (const [index, entry] of glossarySource.entries()) {
    const distractors = pickDistractors(
      glossary,
      entry,
      3,
      `${lessonId}-d${index}`,
    );
    while (distractors.length < 3) {
      distractors.push(
        distractors.length === 0
          ? "Это служебный файл браузера"
          : `Другое понятие из урока (${distractors.length + 1})`,
      );
    }

    const options = shuffleDeterministic(
      [entry.meaning, ...distractors.slice(0, 3)],
      `${lessonId}-o${index}`,
    );
    const correctIndex = options.indexOf(entry.meaning);

    questions.push({
      id: `${lessonId}-g${index + 1}`,
      prompt: `Что означает «${entry.term}»?`,
      options,
      correctIndex,
      explanation: entry.example ? `Пример: ${entry.example}` : undefined,
    });
  }

  return questions;
}

/**
 * Prefers authored quiz from lesson JSON. Falls back to glossary MCQ,
 * then checklist self-checks.
 */
export function buildQuizQuestions(
  glossary: GlossaryEntry[],
  checklist: string[],
  lessonId: string,
  authored?: QuizQuestion[],
): QuizQuestion[] {
  if (authored && authored.length > 0) {
    return normalizeAuthored(authored, lessonId);
  }

  const questions = buildGlossaryQuestions(glossary, lessonId);

  if (questions.length === 0 && checklist.length > 0) {
    for (const [index, item] of checklist.slice(0, 3).entries()) {
      const prompt = item.match(/^(Могу|Умею|Знаю|Понимаю)\s/i)
        ? `Верно ли: ты ${item.charAt(0).toLowerCase()}${item.slice(1)}?`
        : `Верно ли: ${item}?`;

      questions.push({
        id: `${lessonId}-c${index + 1}`,
        prompt,
        options: ["Да", "Нет / ещё не уверен"],
        correctIndex: 0,
        explanation: "Если сомневаешься — вернись к теории и прочитай ещё раз.",
      });
    }
  }

  if (questions.length === 0) {
    questions.push({
      id: `${lessonId}-fallback`,
      prompt: "Ты прочитал(а) теорию этого шага?",
      options: ["Да, можно дальше", "Ещё читаю"],
      correctIndex: 0,
    });
  }

  return questions;
}
