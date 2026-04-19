import { tool } from "ai";
import { z } from "zod";
import { jsonSafe } from "@/lib/ai/json-safe";
import { getAdminClient } from "@/lib/db/client";

export function makeRequestApprovalTool(runId: string) {
  return tool({
    description:
      "Generate a payroll run summary and request human approval before initiating payments. Sets run status to awaiting_approval.",
    inputSchema: z.object({}),
    execute: async () => {
      const db = getAdminClient();
      const start = Date.now();

      const { data: items } = await db
        .from("payroll_items")
        .select("gross, net_usd, federal_tax, state_tax, fica, fees, employee_id")
        .eq("run_id", runId);

      const { data: employees } = await db
        .from("employees")
        .select("id, name, country, currency, employment_type")
        .eq("run_id", runId);

      const { data: compliance } = await db
        .from("compliance_reports")
        .select("country, status, employee_id")
        .eq("run_id", runId);

      const totals = (items ?? []).reduce(
        (acc, item) => ({
          total_gross: acc.total_gross + (item.gross ?? 0),
          total_net: acc.total_net + (item.net_usd ?? 0),
          total_taxes: acc.total_taxes + (item.federal_tax ?? 0) + (item.state_tax ?? 0) + (item.fica ?? 0),
          total_fees: acc.total_fees + (item.fees ?? 0),
        }),
        { total_gross: 0, total_net: 0, total_taxes: 0, total_fees: 0 }
      );

      const byCountry: Record<string, { count: number; net_usd: number }> = {};
      for (const emp of employees ?? []) {
        const item = (items ?? []).find((i) => i.employee_id === emp.id);
        if (!byCountry[emp.country]) byCountry[emp.country] = { count: 0, net_usd: 0 };
        byCountry[emp.country].count++;
        byCountry[emp.country].net_usd += item?.net_usd ?? 0;
      }

      const flaggedCompliance = (compliance ?? []).filter((r) => r.status === "flagged");

      await db
        .from("payroll_runs")
        .update({
          status: "awaiting_approval",
          totals: {
            total_gross_usd: Math.round(totals.total_gross * 100) / 100,
            total_net_usd: Math.round(totals.total_net * 100) / 100,
            total_taxes_usd: Math.round(totals.total_taxes * 100) / 100,
            total_fees_usd: Math.round(totals.total_fees * 100) / 100,
            employee_count: employees?.length ?? 0,
            domestic_count: employees?.filter((e) => e.employment_type === "domestic").length ?? 0,
            international_count: employees?.filter((e) => e.employment_type === "international").length ?? 0,
            by_country: byCountry,
          },
        })
        .eq("id", runId);

      await db.from("tool_events").insert({
        run_id: runId,
        tool_name: "request_human_approval",
        args: {},
        result: totals,
        duration_ms: Date.now() - start,
      });

      return jsonSafe({
        run_id: runId,
        ...totals,
        employee_count: employees?.length ?? 0,
        by_country: byCountry,
        compliance_flags: flaggedCompliance.length,
        flagged_employees: flaggedCompliance.map((r) => ({
          employee_id: r.employee_id,
          country: r.country,
        })),
        status: "awaiting_approval",
      });
    },
  });
}
