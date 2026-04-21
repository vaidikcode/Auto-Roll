import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { event, data } = body as {
    event: string;
    data: {
      id?: string;
      paymentLinkId?: string;
      status?: string;
      metadata?: Record<string, string>;
    };
  };

  const linkId = data.paymentLinkId ?? data.id;
  if (!linkId) {
    return NextResponse.json({ received: true });
  }

  const db = getAdminClient();

  if (event === "payment.completed" || event === "payment_link.paid") {
    await db.from("payment_links").update({ status: "paid" }).eq("bag_link_id", linkId);
  } else if (event === "payment.failed") {
    await db.from("payment_links").update({ status: "failed" }).eq("bag_link_id", linkId);
  } else if (event === "payment_link.expired") {
    await db.from("payment_links").update({ status: "expired" }).eq("bag_link_id", linkId);
  }

  return NextResponse.json({ received: true });
}
