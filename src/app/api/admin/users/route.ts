import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { requireApiAdmin } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/admin";

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

  const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? "";

  const { data, error } = await service
    .from("profiles")
    .select("id, email, display_name, role, plan, is_banned, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return apiError(error, "admin/users");
  }

  const users = (data ?? []).filter((u) => {
    if (!q) return true;
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q)
    );
  });

  return NextResponse.json({ users });
}
