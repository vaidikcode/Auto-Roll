import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { ensurePaymentLinkForEmployee } from "@/lib/payroll/ensure-payment-link";

export function makeCreatePaymentLinkTool(runId: string) {
  return tool({
    description:
      "Create a Bag payment link for an employee after the run is approved. Skips if a link already exists. In demo mode (default) a hosted-style link is generated without calling Bag. Set BAG_USE_REAL=1 and BAG_API_KEY for live Bag.",
    inputSchema: z.object({
      employee_id: z.string().describe("UUID of the employee to create a payment link for"),
    }),
    execute: async ({ employee_id }: { employee_id: string }) => {
      await agentProcessingDelay();
      const result = await ensurePaymentLinkForEmployee(runId, employee_id);
      return jsonSafe(result);
    },
  });
}
