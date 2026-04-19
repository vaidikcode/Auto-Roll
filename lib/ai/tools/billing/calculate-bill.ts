import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { queryUsageReport } from "@/lib/billing/usage-query";
import { PRICING } from "@/lib/billing/pricing";
import type { BillLineItem, BillResult } from "@/lib/db/types";

const roundTo2 = (n: number) => Math.round(n * 100) / 100;

export function makeCalculateBillTool() {
  return tool({
    description:
      "Compute a detailed invoice from usage data. Fetches current usage for the company, applies the pricing model, and returns line items with totals.",
    inputSchema: z.object({
      company_id: z.string().optional().describe("Company identifier. Defaults to 'demo_company'."),
      period_start: z.string().optional().describe("ISO 8601 period start. Defaults to 30 days ago."),
      period_end: z.string().optional().describe("ISO 8601 period end. Defaults to now."),
    }),
    execute: async ({ company_id, period_start, period_end }) => {
      await agentProcessingDelay();
      const usage = await queryUsageReport({ company_id, period_start, period_end });

      const lineItems: BillLineItem[] = [
        { description: "Payroll Runs",               quantity: usage.run_count,              unit_price_usd: PRICING.per_run,           subtotal_usd: usage.run_count              * PRICING.per_run },
        { description: "Employees Processed",        quantity: usage.employee_count,         unit_price_usd: PRICING.per_employee,      subtotal_usd: usage.employee_count         * PRICING.per_employee },
        { description: "Compliance Checks",          quantity: usage.compliance_check_count, unit_price_usd: PRICING.per_compliance,    subtotal_usd: usage.compliance_check_count * PRICING.per_compliance },
        { description: "Domestic Payroll Calcs",     quantity: usage.domestic_calc_count,    unit_price_usd: PRICING.per_domestic_calc, subtotal_usd: usage.domestic_calc_count    * PRICING.per_domestic_calc },
      ].filter((item) => item.quantity > 0);

      const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal_usd, 0);

      const bill: BillResult = {
        company_id:   usage.company_id,
        period_start: usage.period_start,
        period_end:   usage.period_end,
        line_items:   lineItems.map((item) => ({ ...item, subtotal_usd: roundTo2(item.subtotal_usd) })),
        subtotal_usd: roundTo2(subtotal),
        tax_usd:      0,
        total_usd:    roundTo2(subtotal),
        generated_at: new Date().toISOString(),
      };

      return jsonSafe(bill);
    },
  });
}
