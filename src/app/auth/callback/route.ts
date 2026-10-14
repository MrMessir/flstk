import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/security/safe-next";

/**
 * Supabase email-confirm / magic-link landing.
 * Must stay public in middleware so `?code=` is not stripped by auth redirect.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"), "/lessons");

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const login = new URL("/login", url.origin);
        login.searchParams.set("error", "confirm");
        return NextResponse.redirect(login);
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
