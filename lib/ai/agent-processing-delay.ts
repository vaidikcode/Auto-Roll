/**
 * Optional pause before each agent tool runs so the UI can show "processing"
 * states (spinner / streaming) instead of snapping through instantly.
 *
 * - `AGENT_TOOL_DELAY_MS` — explicit milliseconds (0 disables). Clamped 0–30_000.
 * - If unset: 1000ms in development, 0 in production.
 */
export async function agentProcessingDelay(): Promise<void> {
  const raw = process.env.AGENT_TOOL_DELAY_MS;
  let ms: number;
  if (raw !== undefined && raw !== "") {
    const parsed = Number.parseInt(raw, 10);
    ms = Number.isFinite(parsed) ? Math.min(30_000, Math.max(0, parsed)) : 0;
  } else {
    ms = process.env.NODE_ENV === "development" ? 1000 : 0;
  }
  if (ms <= 0) return;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
