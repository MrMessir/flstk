import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import type { AppProfile } from "@/lib/auth/types";

export async function requireApiUser(): Promise<
  { profile: AppProfile } | { response: NextResponse }
> {
  const profile = await getSessionProfile();
  if (!profile) {
    return {
      response: NextResponse.json(
        { error: "Войди в аккаунт" },
        { status: 401 },
      ),
    };
  }
  return { profile };
}

export async function requireApiAdmin(): Promise<
  { profile: AppProfile } | { response: NextResponse }
> {
  const result = await requireApiUser();
  if ("response" in result) return result;
  if (result.profile.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Нет доступа" }, { status: 403 }),
    };
  }
  return result;
}
