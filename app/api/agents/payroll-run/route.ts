import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPayrollAgent } from "@/lib/agents/payroll";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get tenant for this user
  const admin = await createAdminClient();
  const { data: member } = await admin
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "No tenant found" }, { status: 400 });
  }

  if (member.role === "viewer") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json();
  const { periodStart, periodEnd, payDate } = body;

  if (!periodStart || !periodEnd || !payDate) {
    return NextResponse.json(
      { error: "periodStart, periodEnd, and payDate are required" },
      { status: 400 }
    );
  }

  const result = await runPayrollAgent({
    tenantId: member.tenant_id,
    periodStart,
    periodEnd,
    payDate,
    requestedBy: user.id,
  });

  // If run succeeded and has a payroll run, create an approval record
  if (result.success) {
    const { data: latestRun } = await admin
      .from("payroll_runs")
      .select("*")
      .eq("tenant_id", member.tenant_id)
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun) {
      await admin.from("approvals").insert({
        tenant_id: member.tenant_id,
        payroll_run_id: latestRun.id,
        type: "payroll_run",
        status: "pending",
        summary: `Payroll run: ${periodStart} – ${periodEnd} · ${latestRun.employee_count} employees · ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(latestRun.total_gross)}`,
        details: {
          totalGross: latestRun.total_gross,
          totalNet: latestRun.total_net,
          employeeCount: latestRun.employee_count,
          anomaly: result.anomaly ?? false,
          anomalyMessage: result.anomalyMessage,
          periodStart,
          periodEnd,
          payDate,
        },
        requested_by: user.id,
      });
    }
  }

  return NextResponse.json(result);
}
