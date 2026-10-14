import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { setReady } from "@/lib/duel/store";
import { toPublicRoom } from "@/lib/duel/serialize";

const bodySchema = z.object({
  code: z.string().min(4).max(16),
  ready: z.boolean(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limitedResponse = await limitOrResponse(
    request,
    "duel-ready",
    60,
    60_000,
    auth.profile.id,
  );
  if (limitedResponse) return limitedResponse;

  try {
    const body = bodySchema.parse(await request.json());
    const room = await setReady({
      code: body.code,
      playerId: auth.profile.id,
      ready: body.ready,
    });
    return NextResponse.json({ room: await toPublicRoom(room) });
  } catch (error) {
    return apiError(error, "duel/ready");
  }
}
