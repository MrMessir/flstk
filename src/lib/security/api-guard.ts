import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { clientKey, rateLimitAsync } from "@/lib/security/rate-limit";

/**
 * Безопасный текст ошибки для клиента.
 * Наши доменные сообщения написаны по-русски и без технических деталей —
 * их показываем. Всё остальное (Supabase, zod, сеть, конфиги) скрываем.
 */
export function publicErrorMessage(
  error: unknown,
  fallback = "Не удалось выполнить запрос. Попробуй позже.",
): string {
  if (error instanceof ZodError) return "Некорректные данные запроса.";
  if (error instanceof Error) {
    const message = error.message;
    const isDomainMessage =
      /[А-Яа-яЁё]/.test(message) &&
      message.length <= 200 &&
      !/supabase|service_role|secret|sb_|postgres|jwt|token=/i.test(message);
    if (isDomainMessage) return message;
  }
  return fallback;
}

/** Единый ответ на ошибку: детали в лог, клиенту — безопасный текст. */
export function apiError(error: unknown, route: string): NextResponse {
  console.error(`[api:${route}]`, error);
  const message = publicErrorMessage(error);
  const known = message !== publicErrorMessage(null);
  return NextResponse.json({ error: message }, { status: known ? 400 : 500 });
}

/** null — можно продолжать; иначе вернуть этот ответ 429. */
export async function limitOrResponse(
  request: Request,
  name: string,
  limit: number,
  windowMs: number,
  userId?: string,
): Promise<NextResponse | null> {
  const result = await rateLimitAsync(
    `${name}:${clientKey(request, userId)}`,
    limit,
    windowMs,
  );
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Слишком много запросов. Подожди немного." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}
