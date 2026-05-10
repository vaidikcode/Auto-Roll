import { createHash, randomBytes } from "crypto";

/**
 * Demo Bag-style checkout (no API call). IDs use a cs_ prefix to mirror
 * checkout sessions while keeping demo mode fully local.
 */
export function buildBagPaymentLinkPreview(
  runId: string,
  employeeId: string
): { id: string; url: string } {
  const salt = createHash("sha256")
    .update(`${runId}:${employeeId}`)
    .digest("hex")
    .slice(0, 24);
  const jitter = randomBytes(4).toString("hex");
  const id = `cs_${salt.slice(0, 20)}${jitter}`;
  return { id, url: `https://www.getbags.app/pay/${encodeURIComponent(id)}` };
}
