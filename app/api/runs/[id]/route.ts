import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";
import type { RunSnapshot } from "@/lib/db/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getAdminClient();

  const [
    { data: run },
    { data: employees },
    { data: payroll_items },
    { data: compliance_reports },
    { data: payment_links },
    { data: tool_events },
  ] = await Promise.all([
    db.from("payroll_runs").select("*").eq("id", id).single(),
    db.from("employees").select("*").eq("run_id", id).order("created_at"),
    db.from("payroll_items").select("*").eq("run_id", id),
    db.from("compliance_reports").select("*").eq("run_id", id),
    db.from("payment_links").select("*").eq("run_id", id),
    db.from("tool_events").select("*").eq("run_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const snapshot: RunSnapshot = {
    run,
    employees: employees ?? [],
    payroll_items: payroll_items ?? [],
    compliance_reports: compliance_reports ?? [],
    payment_links: payment_links ?? [],
    tool_events: (tool_events ?? []).reverse(), // chronological order
  };

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
