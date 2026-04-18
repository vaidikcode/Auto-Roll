import { NextRequest, NextResponse } from "next/server";
import { getBagClient } from "@/lib/bag/client";
import { createAdminClient } from "@/lib/supabase/server";
import { runPayrollAgent } from "@/lib/agents/payroll";

/**
 * x402-style agentic endpoint: external AI agents pay a small fee to trigger a payroll run.
 * Header: X-Payment-Token (Bag transaction hash or session ID)
 * Header: X-Tenant-API-Key (tenant API key stored in DB)
 */
export async function POST(req: NextRequest) {
  const paymentToken = req.headers.get("x-payment-token");
  const tenantApiKey = req.headers.get("x-tenant-api-key");

  if (!paymentToken || !tenantApiKey) {
    return NextResponse.json(
      {
        error: "Payment required",
        message: "Include X-Payment-Token and X-Tenant-API-Key headers",
        payment_required: {
          amount: 2.0,
          currency: "USD",
          token: "USDC",
          network: "base",
          description: "Auto-Roll: AI payroll trigger via x402",
        },
      },
      { status: 402 }
    );
  }

  const admin = await createAdminClient();

  // Verify tenant API key
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, subscription_status")
    .eq("api_key", tenantApiKey)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (tenant.subscription_status !== "active") {
    return NextResponse.json({ error: "Subscription not active" }, { status: 402 });
  }

  // Verify payment via Bag
  try {
    const bag = getBagClient();
    const session = await bag.checkout.getSession(paymentToken);
    if (session.status !== "complete") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
    }
  } catch {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 402 });
  }

  const body = await req.json();
  const today = new Date();
  const periodStart = body.period_start ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const periodEnd = body.period_end ?? today.toISOString().split("T")[0];
  const payDate = body.pay_date ?? periodEnd;

  const result = await runPayrollAgent({
    tenantId: tenant.id,
    periodStart,
    periodEnd,
    payDate,
    requestedBy: "x402-agent",
  });

  return NextResponse.json({
    ...result,
    triggered_via: "x402",
    payment_token: paymentToken,
  });
}
