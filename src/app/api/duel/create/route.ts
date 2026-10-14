import { NextResponse } from "next/server";
import { apiError } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { consumeDuelSlot, refundDuelSlot } from "@/lib/duel/limits";
import { createRoom } from "@/lib/duel/store";
import { toPublicRoom } from "@/lib/duel/serialize";
import { clientKey, rateLimitAsync } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  name: z.string().min(1).max(40).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limited = await rateLimitAsync(
    `duel-create:${clientKey(request, auth.profile.id)}`,
    10,
    60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Слишком много созданий дуэлей. Подожди минуту." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const slot = await consumeDuelSlot(auth.profile);
    if (!slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: 402 });
    }
    try {
      const room = await createRoom({
        playerId: auth.profile.id,
        name: body.name || auth.profile.displayName,
      });
      return NextResponse.json({ room: await toPublicRoom(room) });
    } catch (error) {
      await refundDuelSlot(auth.profile);
      throw error;
    }
  } catch (error) {
    return apiError(error, "duel/create");
  }
}
