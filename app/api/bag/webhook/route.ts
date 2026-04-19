import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Bag webhook payload shape
  const { event, data } = body as {
    event: string;
    data: { id: string; status: string; metadata?: Record<string, string> };
  };

  const db = getAdminClient();

  if (event === "payment_link.paid" || event === "payment_link.expired") {
    const status = event === "payment_link.paid" ? "paid" : "expired";

    await db
      .from("payment_links")
      .update({ status })
      .eq("bag_link_id", data.id);
  }

  return NextResponse.json({ received: true });
}
