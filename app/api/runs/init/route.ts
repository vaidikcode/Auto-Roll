import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";

export async function POST() {
  const db = getAdminClient();

  const { data: run, error } = await db
    .from("payroll_runs")
    .insert({ status: "collecting", totals: {} })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ run_id: run.id });
}
