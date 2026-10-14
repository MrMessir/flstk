import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { consumeDuelSlot } from "@/lib/duel/limits";
import { cancelMatchedRoom, enqueueMatch, leaveQueue } from "@/lib/duel/store";
import { toPublicRoom } from "@/lib/duel/serialize";

const bodySchema = z.object({
  name: z.string().min(1).max(40).optional(),
  action: z.enum(["join", "leave"]).default("join"),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limitedResponse = await limitOrResponse(
    request,
    "duel-queue",
    60,
    60_000,
    auth.profile.id,
  );
  if (limitedResponse) return limitedResponse;

  try {
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    if (body.action === "leave") {
      await leaveQueue(auth.profile.id);
      return NextResponse.json({ status: "left" });
    }

    const result = await enqueueMatch({
      playerId: auth.profile.id,
      name: body.name || auth.profile.displayName,
    });

    // Charge only when a match actually forms — waiting in queue must not burn slots.
    if (result.status === "matched" && result.room && result.shouldCharge) {
      const slot = await consumeDuelSlot(auth.profile);
      if (!slot.ok) {
        // Матч уже собран, но у игрока нет слота: распускаем комнату,
        // соперника возвращаем в очередь, чтобы он не остался один.
        await cancelMatchedRoom(result.room.code, auth.profile.id);
        await leaveQueue(auth.profile.id);
        return NextResponse.json({ error: slot.error }, { status: 402 });
      }
      return NextResponse.json({
        status: "matched",
        room: await toPublicRoom(result.room),
      });
    }

    if (result.status === "matched" && result.room) {
      return NextResponse.json({
        status: "matched",
        room: await toPublicRoom(result.room),
      });
    }

    return NextResponse.json({
      status: result.status,
      position: result.position,
      room: null,
    });
  } catch (error) {
    return apiError(error, "duel/queue");
  }
}
