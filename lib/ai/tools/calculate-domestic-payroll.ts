import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { getAdminClient } from "@/lib/db/client";
import { calculateDomesticPayroll } from "@/lib/payroll/domestic";
import type { Employee } from "@/lib/db/types";

export function makeCalculateDomesticPayrollTool(runId: string) {
  return tool({
    description:
      "Calculate domestic (US) payroll for a single employee: federal & state withholdings, FICA, healthcare deductions, and 401k employer match. Writes the result to the database.",
    inputSchema: z.object({
      employee_id: z.string().describe("UUID of the employee to calculate payroll for"),
    }),
    execute: async ({ employee_id }: { employee_id: string }) => {
      await agentProcessingDelay();
      const db = getAdminClient();
      const start = Date.now();

      const { data: employee, error: empErr } = await db
        .from("employees")
        .select("*")
        .eq("id", employee_id)
        .eq("run_id", runId)
        .single();

      if (empErr || !employee) {
        throw new Error(`Employee not found: ${empErr?.message}`);
      }

      const result = calculateDomesticPayroll(employee as Employee);

      const { data: item, error: insertErr } = await db
        .from("payroll_items")
        .insert({
          run_id: runId,
          employee_id,
          gross: result.gross,
          federal_tax: result.federal_tax,
          state_tax: result.state_tax,
          fica: result.fica,
          healthcare: result.healthcare,
          retirement: result.retirement,
          net_usd: result.net_usd,
          net_local: result.net_usd,
          fx_rate: 1,
          fees: 0,
          breakdown: result.breakdown,
        })
        .select()
        .single();

      if (insertErr) throw new Error(`Failed to save payroll item: ${insertErr.message}`);

      await db.from("tool_events").insert({
        run_id: runId,
        tool_name: "calculate_domestic_payroll",
        args: { employee_id },
        result: { net_usd: result.net_usd, gross: result.gross },
        duration_ms: Date.now() - start,
      });

      return jsonSafe({
        employee_name: (employee as Employee).name,
        employee_id,
        ...result,
        payroll_item_id: item?.id,
      });
    },
  });
}
