import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { queryUsageReport } from "@/lib/billing/usage-query";

export function makeGetUsageReportTool() {
  return tool({
    description:
      "Fetch aggregated usage metrics for a company: payroll runs, employees processed, compliance checks, FX fetches, payment links, and calculation counts. Call this before calculate_bill.",
    inputSchema: z.object({
      company_id: z.string().optional().describe("Company identifier. Defaults to 'demo_company'."),
      period_start: z.string().optional().describe("ISO 8601 date string for period start. Defaults to 30 days ago."),
      period_end: z.string().optional().describe("ISO 8601 date string for period end. Defaults to now."),
    }),
    execute: async ({ company_id, period_start, period_end }) => {
      await agentProcessingDelay();
      const report = await queryUsageReport({ company_id, period_start, period_end });
      return jsonSafe(report);
    },
  });
}
