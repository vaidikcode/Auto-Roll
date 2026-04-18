import { NextRequest, NextResponse } from "next/server";
import { verifyBagWebhookSignature, type BagWebhookBody } from "@/lib/bag/webhooks";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const eventType = req.headers.get("x-webhook-event") ?? "";
  const secret = process.env.BAG_WEBHOOK_SECRET!;

  if (!verifyBagWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body: BagWebhookBody = JSON.parse(rawBody);
  const admin = await createAdminClient();

  // Idempotency: skip if already processed
  const { data: existing } = await admin
    .from("webhook_events")
    .select("id")
    .eq("bag_event_id", body.webhookDeliveryId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Store raw event
  await admin.from("webhook_events").insert({
    bag_event_id: body.webhookDeliveryId,
    event_type: eventType,
    payload: body as unknown as Record<string, unknown>,
    processed: false,
  });

  try {
    switch (eventType) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.renewed": {
        const data = body.data as {
          subscriptionId: string;
          paymentLinkId: string;
          customerEmail: string;
          status: string;
          currentPeriodEnd: string;
        };

        // Find tenant by customer email
        const { data: member } = await admin
          .from("tenant_members")
          .select("tenant_id")
          .eq("email", data.customerEmail)
          .maybeSingle();

        if (member) {
          // Determine plan from payment link (stored in subscriptions table)
          const { data: existingSub } = await admin
            .from("subscriptions")
            .select("plan")
            .eq("bag_subscription_id", data.subscriptionId)
            .maybeSingle();

          await admin.from("subscriptions").upsert({
            tenant_id: member.tenant_id,
            bag_subscription_id: data.subscriptionId,
            bag_payment_link_id: data.paymentLinkId,
            plan: existingSub?.plan ?? "starter",
            status: "active",
            current_period_end: data.currentPeriodEnd,
            customer_email: data.customerEmail,
            updated_at: new Date().toISOString(),
          }, { onConflict: "bag_subscription_id" });

          // Update tenant subscription status
          await admin
            .from("tenants")
            .update({ subscription_status: "active", bag_subscription_id: data.subscriptionId })
            .eq("id", member.tenant_id);
        }
        break;
      }

      case "subscription.past_due": {
        const data = body.data as { subscriptionId: string };
        await admin
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("bag_subscription_id", data.subscriptionId);
        break;
      }

      case "subscription.canceled": {
        const data = body.data as { subscriptionId: string };
        await admin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("bag_subscription_id", data.subscriptionId);

        const { data: sub } = await admin
          .from("subscriptions")
          .select("tenant_id")
          .eq("bag_subscription_id", data.subscriptionId)
          .maybeSingle();

        if (sub) {
          await admin
            .from("tenants")
            .update({ subscription_status: "canceled" })
            .eq("id", sub.tenant_id);
        }
        break;
      }

      case "payment.completed": {
        const data = body.data as {
          sessionId: string;
          paymentLinkId: string;
          amount: number;
          network: string;
        };

        // Log as invoice
        await admin.from("invoices").insert({
          bag_session_id: data.sessionId,
          bag_payment_link_id: data.paymentLinkId,
          amount_usd: data.amount,
          network: data.network,
          status: "paid",
          description: "Subscription payment",
        }).select().maybeSingle();
        break;
      }
    }

    // Mark event as processed
    await admin
      .from("webhook_events")
      .update({ processed: true })
      .eq("bag_event_id", body.webhookDeliveryId);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ received: true, error: "Processing failed" }, { status: 500 });
  }
}
