import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";
import { ensurePaymentLinkForEmployee } from "@/lib/payroll/ensure-payment-link";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getAdminClient();

  const { data: run, error: fetchErr } = await db
    .from("payroll_runs")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchErr || !run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (run.status !== "awaiting_approval") {
    return NextResponse.json(
      { error: `Cannot approve run in status: ${run.status}` },
      { status: 400 }
    );
  }

  const { error: updateErr } = await db
    .from("payroll_runs")
    .update({ status: "approved" })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  await db.from("tool_events").insert({
    run_id: id,
    tool_name: "human_approval",
    args: {},
    result: { action: "approved", at: new Date().toISOString() },
    duration_ms: 0,
  });

  const { data: items } = await db
    .from("payroll_items")
    .select("employee_id")
    .eq("run_id", id);

  const employeeIds = [...new Set((items ?? []).map((r) => r.employee_id))];
  const linkErrors: string[] = [];
  let created = 0;
  let skipped = 0;

  for (const employeeId of employeeIds) {
    try {
      const r = await ensurePaymentLinkForEmployee(id, employeeId);
      if (r.already_existed) skipped += 1;
      else created += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      linkErrors.push(`${employeeId}: ${msg}`);
    }
  }

  if (linkErrors.length === 0) {
    const { error: doneErr } = await db
      .from("payroll_runs")
      .update({ status: "done" })
      .eq("id", id);

    if (doneErr) {
      return NextResponse.json(
        {
          error: doneErr.message,
          links_created: created,
          links_skipped: skipped,
          link_errors: linkErrors,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: linkErrors.length === 0,
    status: linkErrors.length === 0 ? "done" : "approved",
    links_created: created,
    links_skipped: skipped,
    link_errors: linkErrors,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getAdminClient();

  const { error } = await db
    .from("payroll_runs")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "awaiting_approval");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("tool_events").insert({
    run_id: id,
    tool_name: "human_approval",
    args: {},
    result: { action: "rejected", at: new Date().toISOString() },
    duration_ms: 0,
  });

  return NextResponse.json({ success: true, status: "rejected" });
}
