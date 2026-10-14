import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeInternalPath } from "@/lib/security/safe-next";
import { rateLimitAsync } from "@/lib/security/rate-limit";

const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/auth",
  "/privacy",
  "/terms",
  // Программа курса открыта без входа: её видят поисковики и новые посетители.
  "/program",
  // All API routes: handlers return 401/403 JSON. Middleware must not 307→HTML login.
  "/api",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/starters")) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|md)$/.test(pathname)) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/signup") {
    // Prefer proxy-set x-real-ip; for XFF use the rightmost hop (client can spoof the left).
    const real = request.headers.get("x-real-ip")?.trim();
    const forwarded = request.headers.get("x-forwarded-for");
    const xffLast = forwarded
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1);
    const ip = real || xffLast || "local";
    // Upstash при наличии переменных, иначе память инстанса (слабее на serverless).
    const limited = await rateLimitAsync(`auth:${ip}`, 40, 60_000);
    if (!limited.ok) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      });
    }
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    if (
      pathname.startsWith("/lessons") ||
      pathname.startsWith("/duel") ||
      pathname.startsWith("/glossary") ||
      pathname.startsWith("/program") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/")
    ) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.searchParams.set("setup", "1");
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isPublicPath(pathname) && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned, role, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_banned) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.searchParams.set("banned", "1");
      const res = NextResponse.redirect(login);
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.includes("auth") || cookie.name.startsWith("sb-")) {
          res.cookies.set(cookie.name, "", { maxAge: 0 });
        }
      }
      return res;
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const isAdminEmail =
      Boolean(adminEmail) &&
      (user.email || "").toLowerCase() === adminEmail;
    const isAdmin = profile?.role === "admin" || isAdminEmail;

    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/login" || pathname === "/signup") {
      const next = safeInternalPath(
        request.nextUrl.searchParams.get("next"),
        "/lessons",
      );
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Monaco (@monaco-editor/loader) тянет VS bundle с jsDelivr + нужен unsafe-eval.
  if (pathname.startsWith("/duel") || pathname.startsWith("/lessons")) {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://cdn.jsdelivr.net",
        "worker-src 'self' blob: https://cdn.jsdelivr.net",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join("; "),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
