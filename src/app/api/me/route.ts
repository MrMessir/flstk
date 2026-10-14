import { NextResponse } from "next/server";
import { limitOrResponse } from "@/lib/security/api-guard";
import { getSessionProfile } from "@/lib/auth/session";
import { getDuelQuota } from "@/lib/duel/limits";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const instant = false;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase не настроен", setupRequired: true },
      { status: 503 },
    );
  }
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const limitedResponse = await limitOrResponse(
    request,
    "me",
    120,
    60_000,
    profile.id,
  );
  if (limitedResponse) return limitedResponse;
  const quota = await getDuelQuota(profile);
  return NextResponse.json({
    user: profile,
    duelQuota: {
      unlimited: quota.unlimited,
      used: quota.used,
      limit: quota.unlimited ? null : quota.limit,
      remaining: quota.unlimited ? null : quota.remaining,
    },
  });
}
