import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { getLessonById, getLessonMetas } from "@/lib/lessons/load-lessons";
import {
  getServerProgressState,
  isLessonUnlockedForState,
} from "@/lib/progress/server";
import { getQuizQuestions, gradeQuiz } from "@/lib/quiz/grade";

export const instant = false;

const bodySchema = z.object({
  lessonId: z.string().min(1).max(120),
  answers: z.record(z.string().max(80), z.number().int().min(0).max(20)),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Сервис тестов недоступен" },
      { status: 503 },
    );
  }

  try {
    const body = bodySchema.parse(await request.json());

    // 12 попыток в час на один урок: не даём перебирать ответы подряд.
    const limitedResponse = await limitOrResponse(
      request,
      `quiz-submit:${body.lessonId}`,
      12,
      3_600_000,
      auth.profile.id,
    );
    if (limitedResponse) return limitedResponse;

    const metas = await getLessonMetas();
    if (!metas.some((meta) => meta.id === body.lessonId)) {
      return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
    }
    const state = await getServerProgressState();
    if (!isLessonUnlockedForState(body.lessonId, metas, state)) {
      return NextResponse.json(
        { error: "Сначала закрой предыдущий обязательный модуль" },
        { status: 403 },
      );
    }

    const lesson = await getLessonById(body.lessonId);
    const questions = lesson ? getQuizQuestions(lesson) : [];
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "У этого урока нет теста" },
        { status: 400 },
      );
    }

    const graded = gradeQuiz(questions, body.answers);

    const { error } = await service.from("quiz_attempts").insert({
      user_id: auth.profile.id,
      lesson_id: body.lessonId,
      correct: graded.correct,
      total: graded.total,
      passed: graded.passed,
    });
    if (error) return apiError(error, "quiz/submit");

    const byId = new Map(questions.map((q) => [q.id, q]));
    const results = graded.results.map((r) => {
      const q = byId.get(r.id);
      if (graded.passed) {
        // Тест пройден: показываем правильные ответы и пояснения.
        return {
          id: r.id,
          correct: r.correct,
          correctIndex: q?.correctIndex,
          explanation: q?.explanation,
        };
      }
      // Не пройден: отмечаем верные и неверные, правильный вариант не раскрываем.
      return {
        id: r.id,
        correct: r.correct,
        explanation: r.correct ? undefined : q?.explanation,
      };
    });

    return NextResponse.json({
      passed: graded.passed,
      correct: graded.correct,
      total: graded.total,
      required: graded.required,
      results,
    });
  } catch (error) {
    return apiError(error, "quiz/submit");
  }
}
