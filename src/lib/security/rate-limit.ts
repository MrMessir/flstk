type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { ok: true };
}

async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;

  try {
    const incrRes = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSec)],
        ["TTL", redisKey],
      ]),
    });
    if (!incrRes.ok) return null;
    const data = (await incrRes.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 0);
    const ttl = Number(data?.[2]?.result ?? windowSec);
    if (count > limit) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, ttl > 0 ? ttl : windowSec),
      };
    }
    return { ok: true };
  } catch {
    return null;
  }
}

/**
 * Rate limit. Uses Upstash Redis when UPSTASH_REDIS_REST_* set (Vercel-safe).
 * Falls back to in-memory (per isolate — weak on serverless).
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const remote = await upstashLimit(key, limit, windowMs);
  if (remote) return remote;
  return memoryLimit(key, limit, windowMs);
}

/** Sync fallback for Edge middleware / call sites that cannot await. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  return memoryLimit(key, limit, windowMs);
}

/**
 * Client IP behind a single reverse proxy.
 * Prefer x-real-ip (set by the proxy). For X-Forwarded-For, use the
 * rightmost hop — the left side is client-controlled and spoofable.
 */
export function requestIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "local";
}

/**
 * Prefer authenticated user id. IP is only a secondary salt when no userId.
 */
export function clientKey(request: Request, userId?: string): string {
  if (userId) return `u:${userId}`;
  return `ip:${requestIp(request)}`;
}
