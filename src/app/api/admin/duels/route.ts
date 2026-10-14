import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { requireApiAdmin } from "@/lib/auth/api";
import { getChallenge } from "@/lib/duel/challenges";
import { listQueue, listRecentRooms } from "@/lib/duel/store";

export const instant = false;

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;

  const limitedResponse = await limitOrResponse(
    request,
    "admin",
    120,
    60_000,
    auth.profile.id,
  );
  if (limitedResponse) return limitedResponse;

  try {
    const [roomsRaw, queue] = await Promise.all([
      listRecentRooms(100),
      listQueue(),
    ]);
    const rooms = roomsRaw.map((room) => ({
      ...room,
      challengeTitle:
        getChallenge(room.challengeId)?.title ?? room.challengeId,
    }));
    return NextResponse.json({ rooms, queue });
  } catch (error) {
    return apiError(error, "admin/duels");
  }
}
