import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { requireApiUser } from "@/lib/auth/api";
import { getRoom } from "@/lib/duel/store";
import { toPublicRoom } from "@/lib/duel/serialize";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: Ctx) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const limitedResponse = await limitOrResponse(
    request,
    "duel-poll",
    180,
    60_000,
    auth.profile.id,
  );
  if (limitedResponse) return limitedResponse;

  try {
    const { code } = await context.params;
    const room = await getRoom(code);
    if (!room) {
      return NextResponse.json({ error: "Комната не найдена" }, { status: 404 });
    }
    if (!room.players.some((p) => p.id === auth.profile.id)) {
      return NextResponse.json(
        { error: "Нет доступа к этой комнате" },
        { status: 403 },
      );
    }
    return NextResponse.json({ room: await toPublicRoom(room) });
  } catch (error) {
    return apiError(error, "duel/[code]");
  }
}
