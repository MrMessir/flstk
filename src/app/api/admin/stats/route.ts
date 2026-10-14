import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { requireApiAdmin } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/admin";
import { loadChallenges } from "@/lib/duel/challenges";
import { getAllLessons } from "@/lib/lessons/load-lessons";

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

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Нужен SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 },
    );
  }

  const day = new Date().toISOString().slice(0, 10);
  const [
    { count: usersTotal },
    { count: proCount },
    { data: usageRows },
    { count: activeRooms },
    { count: finishedRooms },
    lessons,
  ] = await Promise.all([
    service.from("profiles").select("*", { count: "exact", head: true }),
    service
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("plan", "pro"),
    service.from("duel_usage").select("count").eq("day", day),
    service
      .from("duel_rooms")
      .select("*", { count: "exact", head: true })
      .in("status", ["waiting", "ready_check", "playing"]),
    service
      .from("duel_rooms")
      .select("*", { count: "exact", head: true })
      .in("status", ["finished", "expired"]),
    getAllLessons(),
  ]);

  const duelsToday =
    usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return NextResponse.json({
    usersTotal: usersTotal ?? 0,
    proCount: proCount ?? 0,
    duelsStartedToday: duelsToday,
    activeRooms: activeRooms ?? 0,
    finishedRooms: finishedRooms ?? 0,
    challengesCount: loadChallenges().length,
    lessonsCount: lessons.length,
  });
}
