import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, getAdminEmail } from "@/lib/supabase/admin";
import type { AppProfile, UserPlan, UserRole } from "@/lib/auth/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function mapProfile(row: {
  id: string;
  email?: string | null;
  display_name?: string | null;
  role?: string | null;
  plan?: string | null;
  is_banned?: boolean | null;
}, fallbackEmail: string): AppProfile {
  return {
    id: row.id,
    email: (row.email || fallbackEmail || "").toLowerCase(),
    displayName: row.display_name || fallbackEmail.split("@")[0] || "user",
    role: (row.role === "admin" ? "admin" : "user") as UserRole,
    plan: (row.plan === "pro" ? "pro" : "free") as UserPlan,
    isBanned: Boolean(row.is_banned),
  };
}

/** Ensure profile exists; promote ADMIN_EMAIL to admin+pro. */
export async function ensureProfile(
  userId: string,
  email: string,
  displayName?: string | null,
): Promise<AppProfile | null> {
  const service = createServiceClient();
  const supabase = service ?? (await createClient());
  if (!supabase) return null;

  const adminEmail = getAdminEmail();
  const isAdminEmail =
    Boolean(adminEmail) && email.toLowerCase() === adminEmail;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, plan, is_banned")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    const insert = {
      id: userId,
      email: email.toLowerCase(),
      display_name: displayName || email.split("@")[0],
      role: isAdminEmail ? "admin" : "user",
      plan: isAdminEmail ? "pro" : "free",
      is_banned: false,
    };
    await supabase.from("profiles").upsert(insert);
    return mapProfile(insert, email);
  }

  const patch: Record<string, unknown> = {};
  if (!existing.email && email) patch.email = email.toLowerCase();
  if (isAdminEmail && existing.role !== "admin") {
    patch.role = "admin";
    patch.plan = "pro";
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("profiles").update(patch).eq("id", userId);
    return mapProfile({ ...existing, ...patch }, email);
  }

  return mapProfile(existing, email);
}

export async function getSessionProfile(): Promise<AppProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const profile = await ensureProfile(
    user.id,
    user.email,
    user.user_metadata?.display_name as string | undefined,
  );
  if (!profile || profile.isBanned) return null;
  return profile;
}

export async function requireUser(nextPath?: string): Promise<AppProfile> {
  if (!isSupabaseConfigured()) {
    redirect("/login?setup=1");
  }
  const profile = await getSessionProfile();
  if (!profile) {
    // nextPath already expected to be internal; encode only
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${q}`);
  }
  return profile;
}

export async function requireAdmin(nextPath = "/admin"): Promise<AppProfile> {
  const profile = await requireUser(nextPath);
  if (profile.role !== "admin") {
    redirect("/");
  }
  return profile;
}
