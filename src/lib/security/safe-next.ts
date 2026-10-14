/**
 * Only allow same-origin relative paths (open-redirect safe).
 * Blocks //evil.com, https://evil.com, javascript:, etc.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback = "/lessons",
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  if (path.includes("@")) return fallback;
  // Reject any scheme-looking prefix after first slash quirks
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return fallback;
  // Keep query/hash but drop CR/LF
  if (/[\u0000-\u001F\u007F]/.test(path)) return fallback;
  return path;
}
