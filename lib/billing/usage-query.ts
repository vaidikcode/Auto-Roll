import { getAdminClient } from "@/lib/db/client";
import { PRICING } from "@/lib/billing/pricing";
import type { UsageReport, ToolUsageSummary } from "@/lib/db/types";

export interface UsageQueryParams {
  company_id?: string;
  period_start?: string;
  period_end?: string;
}

export async function queryUsageReport(params: UsageQueryParams = {}): Promise<UsageReport> {
  const db = getAdminClient();
  const companyId = params.company_id ?? "demo_company";

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const periodStart = params.period_start ?? thirtyDaysAgo.toISOString();
  const periodEnd   = params.period_end   ?? now.toISOString();

  const { data: runs } = await db
    .from("payroll_runs")
    .select("id")
    .eq("company_id", companyId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  const runIds = (runs ?? []).map((r: { id: string }) => r.id);
  const runCount = runIds.length;

  if (runCount === 0) {
    return buildZeroReport(companyId, periodStart, periodEnd);
  }

  const [
    { count: employeeCount },
    { data: toolEvents },
  ] = await Promise.all([
    db.from("employees").select("id", { count: "exact", head: true }).in("run_id", runIds),
    db.from("tool_events").select("tool_name").in("run_id", runIds),
  ]);

  const toolCounts = countByToolName(toolEvents ?? []);

  const complianceCount   = toolCounts["check_cross_border_compliance"]   ?? 0;
  const domesticCalcCount = toolCounts["calculate_domestic_payroll"]      ?? 0;

  const toolBreakdown = buildToolBreakdown({
    runCount,
    employeeCount:    employeeCount ?? 0,
    complianceCount,
    domesticCalcCount,
  });

  return {
    company_id:             companyId,
    period_start:           periodStart,
    period_end:             periodEnd,
    run_count:              runCount,
    employee_count:         employeeCount ?? 0,
    compliance_check_count: complianceCount,
    domestic_calc_count:    domesticCalcCount,
    tool_breakdown:         toolBreakdown,
  };
}

function countByToolName(events: Array<{ tool_name: string }>): Record<string, number> {
  return events.reduce<Record<string, number>>((acc, e) => {
    acc[e.tool_name] = (acc[e.tool_name] ?? 0) + 1;
    return acc;
  }, {});
}

function buildToolBreakdown(counts: {
  runCount: number;
  employeeCount: number;
  complianceCount: number;
  domesticCalcCount: number;
}): ToolUsageSummary[] {
  const rows: ToolUsageSummary[] = [
    { tool_name: "Payroll Runs",          call_count: counts.runCount,          unit_price_usd: PRICING.per_run,           line_total_usd: counts.runCount          * PRICING.per_run },
    { tool_name: "Employees Processed",   call_count: counts.employeeCount,     unit_price_usd: PRICING.per_employee,      line_total_usd: counts.employeeCount     * PRICING.per_employee },
    { tool_name: "Compliance Checks",     call_count: counts.complianceCount,   unit_price_usd: PRICING.per_compliance,    line_total_usd: counts.complianceCount   * PRICING.per_compliance },
    { tool_name: "Domestic Calculations", call_count: counts.domesticCalcCount, unit_price_usd: PRICING.per_domestic_calc, line_total_usd: counts.domesticCalcCount * PRICING.per_domestic_calc },
  ];
  return rows.filter((r) => r.call_count > 0);
}

function buildZeroReport(company_id: string, period_start: string, period_end: string): UsageReport {
  return {
    company_id,
    period_start,
    period_end,
    run_count:              0,
    employee_count:         0,
    compliance_check_count: 0,
    domestic_calc_count:    0,
    tool_breakdown:         [],
  };
}
