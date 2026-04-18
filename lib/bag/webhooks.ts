import crypto from "crypto";

const MAX_SIGNATURE_AGE_S = 300;

export function verifyBagWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const parts = (signature || "").split(",").reduce(
    (acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    },
    {} as Record<string, string>
  );

  const t = parts["t"];
  const v1 = parts["v1"];

  if (!t || !v1) return false;

  const age = Math.floor(Date.now() / 1000) - Number(t);
  if (age > MAX_SIGNATURE_AGE_S) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex");

  if (v1.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export type BagWebhookEvent =
  | "payment.completed"
  | "payment.failed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.renewed"
  | "subscription.renewal_due"
  | "subscription.past_due"
  | "subscription.canceled";

export interface BagPaymentCompletedPayload {
  sessionId: string;
  paymentLinkId: string;
  txHash: string;
  merchantWalletAddress: string;
  amount: number;
  network: string;
}

export interface BagSubscriptionPayload {
  subscriptionId: string;
  paymentLinkId: string;
  customerEmail: string;
  status: string;
  currentPeriodEnd: string;
  livemode: boolean;
}

export interface BagWebhookBody {
  event: BagWebhookEvent;
  data: BagPaymentCompletedPayload | BagSubscriptionPayload | Record<string, unknown>;
  webhookDeliveryId: string;
  timestamp: string;
}
