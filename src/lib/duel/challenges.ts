import { readFileSync } from "node:fs";
import path from "node:path";
import type { Challenge } from "@/lib/duel/types";

let cache: Challenge[] | null = null;

export function clearChallengesCache() {
  cache = null;
}

export function loadChallenges(): Challenge[] {
  if (cache) return cache;
  const file = path.join(process.cwd(), "content", "duels", "challenges.json");
  cache = JSON.parse(readFileSync(file, "utf8")) as Challenge[];
  return cache;
}

export function getChallenge(id: string): Challenge | null {
  return loadChallenges().find((item) => item.id === id) ?? null;
}

export function pickRandomChallenge(): Challenge {
  const all = loadChallenges();
  return all[Math.floor(Math.random() * all.length)];
}

export function publicChallenge(challenge: Challenge) {
  return {
    id: challenge.id,
    type: challenge.type,
    title: challenge.title,
    prompt: challenge.prompt,
    difficulty: challenge.difficulty,
    timeLimitSec: challenge.timeLimitSec,
    starter: challenge.starter,
  };
}
