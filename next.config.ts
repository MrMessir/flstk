import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    // unsafe-inline: Next.js / Tailwind. unsafe-eval + jsDelivr — только на
    // /lessons и /duel через middleware (Monaco CDN).
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Файлы, которые читаются в рантайме через process.cwd() — Next не видит их
  // при трассировке, поэтому без этого на Vercel судья и задания не найдутся.
  outputFileTracingIncludes: {
    "/api/duel/*": [
      "./scripts/judge-worker.mjs",
      "./content/duels/challenges.json",
    ],
    "/duel/*": ["./content/duels/challenges.json"],
    "/api/admin/*": ["./content/duels/challenges.json"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Local QA uses both localhost and 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
