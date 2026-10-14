import { NextResponse } from "next/server";
import { apiError } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { consumeDuelSlot, refundDuelSlot } from "@/lib/duel/limits";
import { getRoom, joinRoom } from "@/lib/duel/store";
import { toPublicRoom } from "@/lib/duel/serialize";
import { clientKey, rateLimitAsync } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  code: z.string().min(4).max(16),
  name: z.string().min(1).max(40).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limited = await rateLimitAsync(
    `duel-join:${clientKey(request, auth.profile.id)}`,
    30,
    60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток входа в комнату. Подожди минуту." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
    const existing = await getRoom(body.code);
    if (!existing) {
      return NextResponse.json({ error: "Комната не найдена" }, { status: 404 });
    }
    const alreadyIn = existing.players.some((p) => p.id === auth.profile.id);
    if (
      !alreadyIn &&
      (existing.status === "finished" || existing.status === "expired")
    ) {
      return NextResponse.json(
        { error: "Дуэль уже завершена" },
        { status: 400 },
      );
    }
    if (!alreadyIn && existing.players.length >= 2) {
      return NextResponse.json(
        { error: "В комнате уже двое" },
        { status: 400 },
      );
    }

    let charged = false;
    if (!alreadyIn) {
      const slot = await consumeDuelSlot(auth.profile);
      if (!slot.ok) {
        return NextResponse.json({ error: slot.error }, { status: 402 });
      }
      charged = true;
    }

    try {
      const room = await joinRoom({
        code: body.code,
        playerId: auth.profile.id,
        name: body.name || auth.profile.displayName,
      });
      return NextResponse.json({ room: await toPublicRoom(room) });
    } catch (error) {
      if (charged) await refundDuelSlot(auth.profile);
      throw error;
    }
  } catch (error) {
    return apiError(error, "duel/join");
  }
}
