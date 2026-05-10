import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid payment link id" }, { status: 400 });
  }

  const db = getAdminClient();

  const { data: existing, error: fetchErr } = await db
    .from("payment_links")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "paid") {
    return NextResponse.json({ ok: true, status: "paid", already: true });
  }

  if (existing.status !== "created") {
    return NextResponse.json(
      { error: `Cannot complete link in status: ${existing.status}` },
      { status: 409 }
    );
  }

  const { error: updateErr } = await db
    .from("payment_links")
    .update({ status: "paid" })
    .eq("id", id)
    .eq("status", "created");

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "paid" });
}
