import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createSubscriptionPaymentLink } from "@/lib/bag/subscriptions";
import type { PlanKey } from "@/lib/bag/client";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  if (!["starter", "growth", "enterprise"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: member } = await admin
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "No tenant found" }, { status: 400 });
  }

  try {
    // Create a payment link for this plan
    const link = await createSubscriptionPaymentLink(plan as PlanKey);

    // Store the pending subscription reference
    await admin.from("subscriptions").insert({
      tenant_id: member.tenant_id,
      bag_subscription_id: `pending_${link.id}`,
      bag_payment_link_id: link.id,
      plan: plan as PlanKey,
      status: "active",
      customer_email: user.email,
    }).select().maybeSingle();

    const checkoutUrl = `https://getbags.app/pay/${link.id}`;
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
