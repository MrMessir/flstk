import { NextResponse } from "next/server";
import { apiError } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/admin";
import { getLessonMetas } from "@/lib/lessons/load-lessons";
import {
  getServerProgressState,
  isLessonUnlockedForState,
} from "@/lib/progress/server";
import { clientKey, rateLimitAsync } from "@/lib/security/rate-limit";

export const instant = false;

const bodySchema = z.object({
  lessonId: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limited = await rateLimitAsync(
    `progress-complete:${clientKey(request, auth.profile.id)}`,
    60,
    60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Сервис прогресса недоступен" },
      { status: 503 },
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
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

    const { error } = await service.from("lesson_progress").upsert(
      {
        user_id: auth.profile.id,
        lesson_id: body.lessonId,
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );

    if (error) {
      return apiError(error, "progress/complete");
    }

    return NextResponse.json({ ok: true, lessonId: body.lessonId });
  } catch (error) {
    return apiError(error, "progress/complete");
  }
}
