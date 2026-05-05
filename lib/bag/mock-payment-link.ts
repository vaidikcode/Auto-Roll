import { createHash, randomBytes } from "crypto";

/**
 * Constant disbursement checkout URL. Every payment link generated for a
 * payroll run is rewritten to point at this hosted Bag checkout.
 */
export const CONSTANT_DISBURSEMENT_URL =
  "https://www.getbags.app/pay/a8aff725-3156-4c76-9ae2-1a1a73762a41";

/**
 * Demo Bag-style checkout (no API call). IDs use the cs_ prefix to mirror
 * v1 checkout sessionIds; the URL is the constant disbursement checkout so
 * every employee link routes to the same Bag hosted checkout.
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
  return { id, url: CONSTANT_DISBURSEMENT_URL };
}
