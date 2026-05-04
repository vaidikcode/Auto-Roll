import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { ensurePaymentLinkForEmployee } from "@/lib/payroll/ensure-payment-link";

export function makeCreatePaymentLinkTool(runId: string) {
  return tool({
    description:
      "Create a Bag v1 checkout session for an employee after the run is approved. Skips if a session already exists. In demo mode (default) a checkout session is generated locally without calling Bag. For the live Bag API set BAG_USE_REAL=1, BAG_API_KEY, and BAG_WEBHOOK_SECRET. Default network is base_sepolia; override with BAG_NETWORK.",
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
