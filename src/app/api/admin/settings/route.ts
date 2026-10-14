import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/auth/api";
import {
  createServiceClient,
  getDefaultFreeDuelLimit,
} from "@/lib/supabase/admin";

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
    return NextResponse.json({
      freeDuelDailyLimit: getDefaultFreeDuelLimit(),
      source: "env",
    });
  }

  const { data } = await service
    .from("app_settings")
    .select("value")
    .eq("key", "free_duel_daily_limit")
    .maybeSingle();

  const n = Number(data?.value);
  return NextResponse.json({
    freeDuelDailyLimit: Number.isFinite(n) ? n : getDefaultFreeDuelLimit(),
    source: data ? "db" : "env",
  });
}

const putSchema = z.object({
  freeDuelDailyLimit: z.number().int().min(0).max(1000),
});

export async function PUT(request: Request) {
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

  try {
    const body = putSchema.parse(await request.json());
    const { error } = await service.from("app_settings").upsert({
      key: "free_duel_daily_limit",
      value: body.freeDuelDailyLimit,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return apiError(error, "admin/settings");
    }
    return NextResponse.json({
      freeDuelDailyLimit: body.freeDuelDailyLimit,
      source: "db",
    });
  } catch (error) {
    return apiError(error, "admin/settings");
  }
}
