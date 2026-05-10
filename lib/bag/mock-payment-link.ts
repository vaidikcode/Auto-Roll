import { createHash, randomBytes } from "crypto";

/**
 * Hosted Bag checkout used for demo / when BAG_USE_REAL is off.
 * @see https://www.getbags.app
 */
export const CONSTANT_DISBURSEMENT_URL =
  "https://www.getbags.app/pay/a8aff725-3156-4c76-9ae2-1a1a73762a41";

/**
 * Demo Bag-style checkout (no API call). IDs use the cs_ prefix to mirror
 * v1 checkout sessionIds; URL points at the shared hosted Bag checkout.
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
