const DEFAULT_APP_ORIGIN = "https://auto-roll.vercel.app";

function isAllowedOrigin(candidate: string): boolean {
  try {
    const u = new URL(candidate);
    if (u.protocol === "https:") return true;
    if (u.protocol === "http:") {
      const host = u.hostname;
      return host === "localhost" || host === "127.0.0.1";
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Public site origin for absolute URLs (disbursement links, redirects).
 * Prefer NEXT_PUBLIC_APP_URL / request Origin in production.
 */
export function resolveAppOrigin(explicit?: string | null): string | null {
  const candidates = [
    explicit?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.APP_URL?.trim(),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    DEFAULT_APP_ORIGIN,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (isAllowedOrigin(candidate)) {
      return candidate.replace(/\/$/, "");
    }
  }
  return null;
}

export function defaultAppOrigin(): string {
  return resolveAppOrigin() ?? DEFAULT_APP_ORIGIN.replace(/\/$/, "");
}
