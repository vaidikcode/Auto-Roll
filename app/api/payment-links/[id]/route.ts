import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";
import { DISBURSEMENT_CHECKOUT_USD } from "@/lib/payroll/disbursement-checkout";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid payment link id" }, { status: 400 });
  }

  const db = getAdminClient();
  const { data: row, error } = await db
    .from("payment_links")
    .select("id, status, currency, run_id, employee_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: emp } = await db
    .from("employees")
    .select("name")
    .eq("id", row.employee_id)
    .eq("run_id", row.run_id)
    .maybeSingle();

  return NextResponse.json({
    id: row.id,
    status: row.status,
    currency: row.currency,
    run_id: row.run_id,
    employee_name: emp?.name ?? "Employee",
    amount: DISBURSEMENT_CHECKOUT_USD,
  });
}
