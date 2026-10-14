import { randomBytes } from "node:crypto";
import type { DuelPlayer, DuelRoom, RoomStatus } from "@/lib/duel/types";
import { pickRandomChallenge } from "@/lib/duel/challenges";
import { createServiceClient } from "@/lib/supabase/admin";

type QueueRow = { playerId: string; name: string; joinedAt: string };

type RoomRow = {
  code: string;
  status: RoomStatus;
  challenge_id: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  winner_id: string | null;
  players: DuelPlayer[];
  matchmaking: boolean;
  updated_at?: string | null;
};

/** 10 hex chars (~40 bits) — enough against casual room sniffing. */
function codeGen(): string {
  return randomBytes(5).toString("hex");
}

function makePlayer(id: string, name: string): DuelPlayer {
  return {
    id,
    name: name.trim().slice(0, 24) || "Игрок",
    ready: false,
    submittedAt: null,
    passed: false,
    report: null,
  };
}

function requireDb() {
  const db = createServiceClient();
  if (!db) {
    throw new Error(
      "Дуэли требуют SUPABASE_SECRET_KEY (или SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  return db;
}

function rowToRoom(row: RoomRow): DuelRoom {
  return {
    code: row.code,
    status: row.status,
    challengeId: row.challenge_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    winnerId: row.winner_id,
    players: Array.isArray(row.players) ? row.players : [],
    matchmaking: Boolean(row.matchmaking),
    updatedAt: row.updated_at || row.created_at,
  };
}

function roomToRow(room: DuelRoom, nextUpdatedAt: string) {
  return {
    code: room.code,
    status: room.status,
    challenge_id: room.challengeId,
    created_at: room.createdAt,
    started_at: room.startedAt,
    finished_at: room.finishedAt,
    winner_id: room.winnerId,
    players: room.players,
    matchmaking: room.matchmaking,
    updated_at: nextUpdatedAt,
  };
}

async function saveRoom(room: DuelRoom): Promise<DuelRoom> {
  const db = requireDb();
  const nextUpdatedAt = new Date().toISOString();
  const { data, error } = await db
    .from("duel_rooms")
    .update(roomToRow(room, nextUpdatedAt))
    .eq("code", room.code)
    .eq("updated_at", room.updatedAt)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Комната изменилась, обнови страницу и попробуй снова");
  }
  return rowToRoom(data as RoomRow);
}

/** Retry read-modify-write on optimistic lock conflicts. */
async function mutateRoom(
  code: string,
  mutator: (room: DuelRoom) => DuelRoom | Promise<DuelRoom>,
): Promise<DuelRoom> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const room = await getRoom(code);
    if (!room) throw new Error("Комната не найдена");
    const next = await mutator(structuredClone(room));
    try {
      return await saveRoom(next);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!/обнови страницу/i.test(lastError.message)) {
        throw lastError;
      }
    }
  }
  throw lastError ?? new Error("Не удалось обновить комнату");
}

export async function getRoom(code: string): Promise<DuelRoom | null> {
  const db = requireDb();
  const { data, error } = await db
    .from("duel_rooms")
    .select("*")
    .eq("code", code.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToRoom(data as RoomRow) : null;
}

export async function listRecentRooms(limit = 100): Promise<DuelRoom[]> {
  const db = requireDb();
  const { data, error } = await db
    .from("duel_rooms")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToRoom(row as RoomRow));
}

export async function listQueue(): Promise<QueueRow[]> {
  const db = requireDb();
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await db.from("duel_queue").delete().lt("joined_at", cutoff);
  const { data, error } = await db
    .from("duel_queue")
    .select("player_id, name, joined_at")
    .order("joined_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    playerId: row.player_id as string,
    name: row.name as string,
    joinedAt: row.joined_at as string,
  }));
}

export async function createRoom(input: {
  playerId: string;
  name: string;
  matchmaking?: boolean;
}): Promise<DuelRoom> {
  const db = requireDb();
  for (let i = 0; i < 8; i += 1) {
    const code = codeGen();
    const challenge = pickRandomChallenge();
    const now = new Date().toISOString();
    const room: DuelRoom = {
      code,
      status: "waiting",
      challengeId: challenge.id,
      createdAt: now,
      startedAt: null,
      finishedAt: null,
      winnerId: null,
      players: [makePlayer(input.playerId, input.name)],
      matchmaking: Boolean(input.matchmaking),
      updatedAt: now,
    };
    const { data, error } = await db
      .from("duel_rooms")
      .insert(roomToRow(room, now))
      .select("*")
      .single();
    if (!error && data) return rowToRoom(data as RoomRow);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }
  throw new Error("Не удалось создать комнату");
}

export async function joinRoom(input: {
  code: string;
  playerId: string;
  name: string;
}): Promise<DuelRoom> {
  return mutateRoom(input.code, (room) => {
    if (room.status === "finished" || room.status === "expired") {
      throw new Error("Дуэль уже завершена");
    }
    const existing = room.players.find((p) => p.id === input.playerId);
    if (existing) {
      existing.name = input.name.trim().slice(0, 24) || existing.name;
      return room;
    }
    if (room.players.length >= 2) {
      throw new Error("В комнате уже двое");
    }
    room.players.push(makePlayer(input.playerId, input.name));
    if (room.players.length === 2) {
      room.status = "ready_check";
    }
    return room;
  });
}

export async function setReady(input: {
  code: string;
  playerId: string;
  ready: boolean;
}): Promise<DuelRoom> {
  return mutateRoom(input.code, (room) => {
    const player = room.players.find((p) => p.id === input.playerId);
    if (!player) throw new Error("Ты не в этой комнате");
    if (room.players.length < 2) throw new Error("Ждём второго игрока");
    if (room.status === "playing" || room.status === "finished") {
      return room;
    }

    player.ready = input.ready;
    room.status = "ready_check";

    if (room.players.length === 2 && room.players.every((p) => p.ready)) {
      room.status = "playing";
      room.startedAt = new Date().toISOString();
      for (const p of room.players) {
        p.ready = true;
      }
    }
    return room;
  });
}

export async function submitSolution(input: {
  code: string;
  playerId: string;
  passed: boolean;
  report: string;
}): Promise<DuelRoom> {
  return mutateRoom(input.code, (room) => {
    if (room.status !== "playing") throw new Error("Игра ещё не началась");
    const player = room.players.find((p) => p.id === input.playerId);
    if (!player) throw new Error("Ты не в этой комнате");
    if (room.winnerId) return room;

    player.report = input.report;
    if (input.passed) {
      player.passed = true;
      player.submittedAt = new Date().toISOString();
      room.status = "finished";
      room.finishedAt = player.submittedAt;
      room.winnerId = player.id;
    }
    return room;
  });
}

export async function expireIfNeeded(
  room: DuelRoom,
  timeLimitSec: number,
): Promise<DuelRoom> {
  if (room.status !== "playing" || !room.startedAt) return room;
  const started = Date.parse(room.startedAt);
  if (Number.isNaN(started)) return room;
  if (Date.now() - started < timeLimitSec * 1000) return room;

  try {
    return await mutateRoom(room.code, (current) => {
      if (current.status !== "playing") return current;
      current.status = "finished";
      current.finishedAt = new Date().toISOString();
      const passed = current.players.filter((p) => p.passed);
      if (passed.length === 1) {
        current.winnerId = passed[0].id;
      } else if (passed.length > 1) {
        current.winnerId = passed.sort((a, b) =>
          (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""),
        )[0].id;
      } else {
        current.winnerId = null;
        current.status = "expired";
      }
      return current;
    });
  } catch {
    return (await getRoom(room.code)) ?? room;
  }
}

async function createMatchedRoom(
  host: { playerId: string; name: string },
  guest: { playerId: string; name: string },
): Promise<DuelRoom> {
  const room = await createRoom({
    playerId: host.playerId,
    name: host.name,
    matchmaking: true,
  });
  room.status = "ready_check";
  room.players = [
    makePlayer(host.playerId, host.name),
    makePlayer(guest.playerId, guest.name),
  ];
  room.matchmaking = true;
  return saveRoom(room);
}

export async function enqueueMatch(input: {
  playerId: string;
  name: string;
}): Promise<{
  status: "queued" | "matched";
  room?: DuelRoom;
  position?: number;
  shouldCharge: boolean;
}> {
  const db = requireDb();
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await db.from("duel_queue").delete().lt("joined_at", cutoff);

  const { data: seatedRows } = await db
    .from("duel_rooms")
    .select("*")
    .eq("matchmaking", true)
    .in("status", ["waiting", "ready_check"]);

  const seated = (seatedRows ?? [])
    .map((row) => rowToRoom(row as RoomRow))
    .find((room) => room.players.some((p) => p.id === input.playerId));
  if (seated) {
    // Already in a matchmaking room — re-poll, do not charge again.
    return { status: "matched", room: seated, shouldCharge: false };
  }

  const { data: existing } = await db
    .from("duel_queue")
    .select("player_id")
    .eq("player_id", input.playerId)
    .maybeSingle();

  if (!existing) {
    const { error } = await db.from("duel_queue").upsert({
      player_id: input.playerId,
      name: input.name.trim().slice(0, 24) || "Игрок",
      joined_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  } else {
    await db
      .from("duel_queue")
      .update({ name: input.name.trim().slice(0, 24) || "Игрок" })
      .eq("player_id", input.playerId);
  }

  const queue = await listQueue();
  const me = queue.find((q) => q.playerId === input.playerId);
  const other = queue.find((q) => q.playerId !== input.playerId);

  if (me && other) {
    const [host, guest] = [me, other].sort((a, b) =>
      a.playerId.localeCompare(b.playerId),
    );

    if (input.playerId === host.playerId) {
      await db
        .from("duel_queue")
        .delete()
        .in("player_id", [host.playerId, guest.playerId]);
      const room = await createMatchedRoom(host, guest);
      // First delivery of this match to the host — charge once.
      return { status: "matched", room, shouldCharge: true };
    }

    const { data: foundRows } = await db
      .from("duel_rooms")
      .select("*")
      .eq("matchmaking", true)
      .in("status", ["waiting", "ready_check"]);
    const found = (foundRows ?? [])
      .map((row) => rowToRoom(row as RoomRow))
      .find(
        (room) =>
          room.players.some((p) => p.id === host.playerId) &&
          room.players.some((p) => p.id === guest.playerId),
      );
    if (found) {
      await db
        .from("duel_queue")
        .delete()
        .in("player_id", [host.playerId, guest.playerId]);
      // First delivery of this match to the guest — charge once.
      return { status: "matched", room: found, shouldCharge: true };
    }
  }

  const position =
    (await listQueue()).findIndex((q) => q.playerId === input.playerId) + 1;
  // Waiting alone must not burn a free slot.
  return { status: "queued", position: Math.max(position, 1), shouldCharge: false };
}

/**
 * Распустить матч-комнату, в которой игра ещё не началась.
 * Второго игрока возвращаем в очередь.
 */
export async function cancelMatchedRoom(
  code: string,
  leavingPlayerId: string,
): Promise<void> {
  const db = requireDb();
  const room = await getRoom(code);
  if (!room || room.status === "playing" || room.status === "finished") return;
  const other = room.players.find((p) => p.id !== leavingPlayerId);
  await db.from("duel_rooms").delete().eq("code", room.code);
  if (other) {
    await db.from("duel_queue").upsert({
      player_id: other.id,
      name: other.name,
      joined_at: new Date().toISOString(),
    });
  }
}

export async function leaveQueue(playerId: string) {
  const db = requireDb();
  await db.from("duel_queue").delete().eq("player_id", playerId);
}

export function roomStatusLabel(status: RoomStatus): string {
  switch (status) {
    case "waiting":
      return "Ждём соперника";
    case "ready_check":
      return "Нажмите «Готов»";
    case "playing":
      return "Идёт дуэль";
    case "finished":
      return "Финиш";
    case "expired":
      return "Время вышло";
    default:
      return status;
  }
}
