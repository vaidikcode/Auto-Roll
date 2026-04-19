import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";

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

  return NextResponse.json({ success: true, status: "approved" });
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
