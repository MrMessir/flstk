import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/auth/api";
import { clearChallengesCache, loadChallenges } from "@/lib/duel/challenges";

export const instant = false;

const FILE = path.join(process.cwd(), "content", "duels", "challenges.json");

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;

  const limitedResponse = await limitOrResponse(
    request,
    "admin",
    60,
    60_000,
    auth.profile.id,
  );
  if (limitedResponse) return limitedResponse;
  return NextResponse.json({ challenges: loadChallenges() });
}

const challengeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["js-function", "js-bug", "html-checklist"]),
  title: z.string().min(1),
  prompt: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimitSec: z.number().int().positive().max(3600),
  starter: z.string().max(20_000),
  functionName: z
    .string()
    .regex(/^[A-Za-z_$][\w$]*$/)
    .optional(),
  tests: z
    .array(
      z.object({
        name: z.string().max(120),
        args: z.array(z.unknown()),
        expected: z.unknown(),
      }),
    )
    .max(40)
    .optional(),
  checks: z
    .array(
      z.object({
        id: z.string().max(80),
        description: z.string().max(200),
        pattern: z.string().min(1).max(120),
      }),
    )
    .max(40)
    .optional(),
});

export async function PUT(request: Request) {
  const auth = await requireApiAdmin();
  if ("response" in auth) return auth.response;

  const limitedResponse = await limitOrResponse(
    request,
    "admin",
    60,
    60_000,
    auth.profile.id,
  );
  if (limitedResponse) return limitedResponse;

  try {
    const body = z.array(challengeSchema).min(1).parse(await request.json());
    writeFileSync(FILE, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    clearChallengesCache();
    return NextResponse.json({
      ok: true,
      count: body.length,
      challenges: loadChallenges(),
    });
  } catch (error) {
    return apiError(error, "admin/challenges");
  }
}
