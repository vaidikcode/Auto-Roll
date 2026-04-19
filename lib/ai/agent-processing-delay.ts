/**
 * Pause before each agent tool runs so the pipeline feels like real processing.
 *
 * - `AGENT_TOOL_DELAY_MS` — base milliseconds (0 disables). Clamped 0–30_000.
 * - If unset: 3500ms in development, 0 in production.
 * - A random jitter of ±500ms is added so each step resolves at a slightly
 *   different time, giving a natural "working" feel.
 */
export async function agentProcessingDelay(): Promise<void> {
  const raw = process.env.AGENT_TOOL_DELAY_MS;
  let base: number;
  if (raw !== undefined && raw !== "") {
    const parsed = Number.parseInt(raw, 10);
    base = Number.isFinite(parsed) ? Math.min(30_000, Math.max(0, parsed)) : 0;
  } else {
    base = process.env.NODE_ENV === "development" ? 3500 : 0;
  }
  if (base <= 0) return;
  // ±500 ms jitter so steps don't all resolve at the exact same interval
  const jitter = Math.floor(Math.random() * 1001) - 500;
  const ms = Math.max(0, base + jitter);
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
