import { NextResponse } from "next/server";
import { apiError, limitOrResponse } from "@/lib/security/api-guard";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/admin";

export const instant = false;

const patchSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  plan: z.enum(["free", "pro"]).optional(),
  is_banned: z.boolean().optional(),
  display_name: z.string().min(1).max(60).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
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
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());

    if (id === auth.profile.id) {
      if (body.role === "user") {
        return NextResponse.json(
          { error: "Нельзя снять admin с самого себя" },
          { status: 400 },
        );
      }
      if (body.is_banned === true) {
        return NextResponse.json(
          { error: "Нельзя забанить самого себя" },
          { status: 400 },
        );
      }
    }

    if (body.role === "user") {
      const { data: target } = await service
        .from("profiles")
        .select("role")
        .eq("id", id)
        .maybeSingle();
      if (target?.role === "admin") {
        const { count } = await service
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1) {
          return NextResponse.json(
            { error: "Нельзя снять последнего admin" },
            { status: 400 },
          );
        }
      }
    }

    const { data, error } = await service
      .from("profiles")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, email, display_name, role, plan, is_banned, created_at")
      .single();

    if (error) {
      return apiError(error, "admin/users/[id]");
    }
    return NextResponse.json({ user: data });
  } catch (error) {
    return apiError(error, "admin/users/[id]");
  }
}
