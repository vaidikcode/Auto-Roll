import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { ensurePaymentLinkForEmployee } from "@/lib/payroll/ensure-payment-link";

export function makeCreatePaymentLinkTool(runId: string) {
  return tool({
    description:
      "Create a $2 Bag checkout link plus an Auto-Roll verify URL (record payment after Bag). Skips if a link already exists. Demo mode uses a hosted Bag URL without calling the API; for live Bag set BAG_USE_REAL=1, BAG_API_KEY, and BAG_WEBHOOK_SECRET. Default network is eth_sepolia; override with BAG_NETWORK.",
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
