export type ChallengeType = "js-function" | "js-bug" | "html-checklist";

export type JsTestCase = {
  name: string;
  args: unknown[];
  expected: unknown;
};

export type HtmlCheck = {
  id: string;
  description: string;
  pattern: string;
};

export type Challenge = {
  id: string;
  type: ChallengeType;
  title: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
  starter: string;
  functionName?: string;
  tests?: JsTestCase[];
  checks?: HtmlCheck[];
};

export type RoomStatus = "waiting" | "ready_check" | "playing" | "finished" | "expired";

export type DuelPlayer = {
  id: string;
  name: string;
  ready: boolean;
  submittedAt: string | null;
  passed: boolean;
  report: string | null;
};

export type DuelRoom = {
  code: string;
  status: RoomStatus;
  challengeId: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  winnerId: string | null;
  players: DuelPlayer[];
  /** true if created via random queue */
  matchmaking: boolean;
  /** ISO timestamp used for optimistic locking on update. */
  updatedAt: string;
};

export type PublicRoom = Omit<DuelRoom, "updatedAt"> & {
  challenge: Pick<
    Challenge,
    "id" | "type" | "title" | "prompt" | "difficulty" | "timeLimitSec" | "starter"
  >;
};

export type JudgeResult = {
  ok: boolean;
  report: string;
};
