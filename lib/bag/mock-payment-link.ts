import { createHash, randomBytes } from "crypto";

/**
 * Demo Bag-style payment link (no API call). URLs and IDs look like production
 * so the UI never exposes the word "mock" or obvious test paths.
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
  const id = `plink_${salt.slice(0, 20)}${jitter}`;
  const url = `https://www.getbags.app/pay/${id}`;
  return { id, url };
}
