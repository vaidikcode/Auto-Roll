import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { ensurePaymentLinkForEmployee } from "@/lib/payroll/ensure-payment-link";

export function makeCreatePaymentLinkTool(runId: string) {
  return tool({
    description:
      "Create a simulated $2 disbursement checkout link for an employee (in-app /disburse page marks paid on open). Skips if a link already exists for this employee on the run.",
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
