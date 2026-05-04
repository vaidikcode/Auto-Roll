import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";

export const runtime = "nodejs";

function verifyBagSignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string
): void {
  if (!sigHeader) throw new Error("missing signature header");

  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=").map((s) => s.trim()))
  ) as { t?: string; v1?: string };

  const timestamp = Number(parts.t);
  const received = parts.v1;

  if (!timestamp || !received) throw new Error("malformed signature");

  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) {
    throw new Error("signature expired");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  ) {
    throw new Error("signature mismatch");
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  try {
    verifyBagSignature(
      rawBody,
      req.headers.get("x-webhook-signature"),
      process.env.BAG_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 }
    );
  }

  const { event, data, webhookDeliveryId } = JSON.parse(rawBody) as {
    event: string;
    data: {
      sessionId?: string;
      txHash?: string;
      reason?: string;
      message?: string;
      subscriptionId?: string;
      [key: string]: unknown;
    };
    webhookDeliveryId?: string;
  };

  const db = getAdminClient();

  switch (event) {
    // Bag dashboard emits checkout.* events
    case "checkout.completed":
    case "payment.completed": {
      const sessionId = data.sessionId ?? data.checkoutId;
      if (!sessionId) break;

      const { data: existing } = await db
        .from("payment_links")
        .select("id, status, last_webhook_delivery_id")
        .eq("bag_link_id", sessionId)
        .maybeSingle();

      if (!existing) break;

      if (
        webhookDeliveryId &&
        existing.last_webhook_delivery_id === webhookDeliveryId
      ) {
        return NextResponse.json({ received: true, deduped: true, webhookDeliveryId });
      }

      await db
        .from("payment_links")
        .update({
          status: "paid",
          tx_hash: data.txHash ?? null,
          last_webhook_delivery_id: webhookDeliveryId ?? null,
        })
        .eq("id", existing.id);
      break;
    }

    case "checkout.failed":
    case "payment.failed": {
      const sessionId = data.sessionId ?? data.checkoutId;
      if (!sessionId) break;

      const { data: existing } = await db
        .from("payment_links")
        .select("id, status, last_webhook_delivery_id")
        .eq("bag_link_id", sessionId)
        .maybeSingle();

      if (!existing) break;

      if (
        webhookDeliveryId &&
        existing.last_webhook_delivery_id === webhookDeliveryId
      ) {
        return NextResponse.json({ received: true, deduped: true, webhookDeliveryId });
      }

      await db
        .from("payment_links")
        .update({
          status: "failed",
          last_webhook_delivery_id: webhookDeliveryId ?? null,
        })
        .eq("id", existing.id);
      break;
    }

    case "checkout.expired": {
      const sessionId = data.sessionId ?? data.checkoutId;
      if (!sessionId) break;

      const { data: existing } = await db
        .from("payment_links")
        .select("id, status, last_webhook_delivery_id")
        .eq("bag_link_id", sessionId)
        .maybeSingle();

      if (!existing) break;

      if (
        webhookDeliveryId &&
        existing.last_webhook_delivery_id === webhookDeliveryId
      ) {
        return NextResponse.json({ received: true, deduped: true, webhookDeliveryId });
      }

      await db
        .from("payment_links")
        .update({
          status: "expired",
          last_webhook_delivery_id: webhookDeliveryId ?? null,
        })
        .eq("id", existing.id);
      break;
    }

    case "checkout.cancelled":
    case "payment.refunded":
      console.log(`[bag/webhook] ${event}`, data);
      break;

    case "subscription.created":
    case "subscription.renewed":
    case "subscription.renewal_due":
    case "subscription.past_due":
    case "subscription.canceled":
      console.log(`[bag/webhook] subscription event: ${event}`, data.subscriptionId);
      break;

    default:
      console.log(`[bag/webhook] unhandled event: ${event}`);
  }

  return NextResponse.json({ received: true, webhookDeliveryId });
}
