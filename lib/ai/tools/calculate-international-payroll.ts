import { tool } from "ai";
import { z } from "zod";
import { jsonSafe } from "@/lib/ai/json-safe";
import { getAdminClient } from "@/lib/db/client";
import { calculateInternationalPayroll } from "@/lib/payroll/international";
import type { Employee } from "@/lib/db/types";

export function makeCalculateInternationalPayrollTool(runId: string) {
  return tool({
    description:
      "Calculate international payroll for an employee: flat withholding, FX conversion, corridor transfer fees, compliance limit checks. Writes result to database.",
    inputSchema: z.object({
      employee_id: z.string().describe("UUID of the international employee"),
      fx_rate: z.number().describe("USD to local currency exchange rate (from fetch_fx_rate tool)"),
    }),
    execute: async ({ employee_id, fx_rate }: { employee_id: string; fx_rate: number }) => {
      const db = getAdminClient();
      const start = Date.now();

      const { data: employee, error: empErr } = await db
        .from("employees")
        .select("*")
        .eq("id", employee_id)
        .eq("run_id", runId)
        .single();

      if (empErr || !employee) throw new Error(`Employee not found: ${empErr?.message}`);

      const emp = employee as Employee;
      const result = calculateInternationalPayroll(emp, fx_rate);

      const { data: complianceReport } = await db
        .from("compliance_reports")
        .select("actionable_steps, status")
        .eq("employee_id", employee_id)
        .eq("run_id", runId)
        .maybeSingle();

      if (complianceReport?.status === "flagged" && result.compliance_flags.length === 0) {
        result.compliance_flags.push("Compliance review flagged — see compliance report");
      }

      const { data: item, error: insertErr } = await db
        .from("payroll_items")
        .insert({
          run_id: runId,
          employee_id,
          gross: result.gross,
          federal_tax: 0,
          state_tax: 0,
          fica: 0,
          healthcare: 0,
          retirement: 0,
          other_deductions: Math.round((result.gross * 0.15 + result.fees) * 100) / 100,
          net_usd: result.net_usd,
          net_local: result.net_local,
          fx_rate: result.fx_rate,
          fees: result.fees,
          breakdown: result.breakdown,
        })
        .select()
        .single();

      if (insertErr) throw new Error(`Failed to save payroll item: ${insertErr.message}`);

      await db.from("tool_events").insert({
        run_id: runId,
        tool_name: "calculate_international_payroll",
        args: { employee_id, fx_rate },
        result: { net_usd: result.net_usd, net_local: result.net_local, currency: emp.currency },
        duration_ms: Date.now() - start,
      });

      return jsonSafe({
        employee_name: emp.name,
        employee_id,
        country: emp.country,
        ...result,
        currency: emp.currency,
        payroll_item_id: item?.id,
      });
    },
  });
}
