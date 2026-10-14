import { NextResponse } from "next/server";
import { apiError } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { getChallenge } from "@/lib/duel/challenges";
import { judgeSubmission } from "@/lib/duel/judge";
import { expireIfNeeded, getRoom, submitSolution } from "@/lib/duel/store";
import { toPublicRoom } from "@/lib/duel/serialize";
import { clientKey, rateLimitAsync } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  code: z.string().min(4).max(16),
  solution: z.string().min(1).max(12_000),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limited = await rateLimitAsync(
    `duel-submit:${clientKey(request, auth.profile.id)}`,
    20,
    60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подожди немного." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
    const room = await getRoom(body.code);
    if (!room) {
      return NextResponse.json({ error: "Комната не найдена" }, { status: 404 });
    }
    if (!room.players.some((p) => p.id === auth.profile.id)) {
      return NextResponse.json({ error: "Ты не в комнате" }, { status: 403 });
    }
    const challenge = getChallenge(room.challengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }
    // Время вышло, но никто ещё не опрашивал комнату: фиксируем итог до судейства.
    const current = await expireIfNeeded(room, challenge.timeLimitSec);
    if (current.status !== "playing") {
      return NextResponse.json(
        { error: "Время вышло или дуэль уже завершена" },
        { status: 409 },
      );
    }
    const result = await judgeSubmission(challenge, body.solution);
    const next = await submitSolution({
      code: body.code,
      playerId: auth.profile.id,
      passed: result.ok,
      report: result.report,
    });
    return NextResponse.json({
      room: await toPublicRoom(next),
      result,
    });
  } catch (error) {
    return apiError(error, "duel/submit");
  }
}
