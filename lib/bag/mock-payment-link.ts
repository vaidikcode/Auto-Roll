import { createHash, randomBytes } from "crypto";

/**
 * Demo Bag-style checkout (no API call). IDs use the cs_ prefix to mirror
 * v1 checkout sessionIds; URLs look like production so the UI never exposes
 * the word "mock" or obvious test paths.
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
  const url = `https://getbags.app/pay/${id}`;
  return { id, url };
}
