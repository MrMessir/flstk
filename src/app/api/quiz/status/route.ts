import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { createServiceClient } from "@/lib/supabase/admin";

export const instant = false;

/** Проходил ли пользователь тест этого урока (нужно, чтобы не сдавать заново после перезагрузки). */
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limitedResponse = await limitOrResponse(
    request,
    "quiz-status",
    120,
    60_000,
    auth.profile.id,
  );
  if (limitedResponse) return limitedResponse;

  const lessonId = new URL(request.url).searchParams.get("lessonId") ?? "";
  if (!lessonId || lessonId.length > 120) {
    return NextResponse.json({ error: "Нужен lessonId" }, { status: 400 });
  }
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "Сервис недоступен" }, { status: 503 });
  }
  const { data, error } = await service
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", auth.profile.id)
    .eq("lesson_id", lessonId)
    .eq("passed", true)
    .limit(1);
  if (error) return apiError(error, "quiz/status");
  return NextResponse.json({ passed: (data?.length ?? 0) > 0 });
}
