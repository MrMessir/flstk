/** Public site origin for auth redirects (no trailing slash). */
export function getSiteUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;
  if (fromEnv) {
    const withProto = fromEnv.startsWith("http")
      ? fromEnv
      : `https://${fromEnv}`;
    return withProto.replace(/\/$/, "");
  }
  return "http://localhost:3001";
}
