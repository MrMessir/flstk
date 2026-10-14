import { getChallenge, publicChallenge } from "@/lib/duel/challenges";
import { expireIfNeeded } from "@/lib/duel/store";
import type { DuelRoom, PublicRoom } from "@/lib/duel/types";

export async function toPublicRoom(room: DuelRoom): Promise<PublicRoom> {
  const challenge = getChallenge(room.challengeId);
  if (!challenge) {
    throw new Error("Задание комнаты не найдено");
  }
  const current = await expireIfNeeded(room, challenge.timeLimitSec);
  const { updatedAt: _updatedAt, ...publicRoom } = current;
  return {
    ...publicRoom,
    challenge: publicChallenge(challenge),
  };
}
