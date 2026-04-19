import { NextRequest, NextResponse } from "next/server";
import { queryUsageReport } from "@/lib/billing/usage-query";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const company_id   = searchParams.get("company_id")   ?? "demo_company";
  const period_start = searchParams.get("period_start") ?? undefined;
  const period_end   = searchParams.get("period_end")   ?? undefined;

  const report = await queryUsageReport({ company_id, period_start, period_end });

  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
