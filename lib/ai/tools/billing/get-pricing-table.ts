import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { PRICING_TABLE_ROWS } from "@/lib/billing/pricing";
import type { PricingTable } from "@/lib/db/types";

export function makeGetPricingTableTool() {
  return tool({
    description:
      "Return the current Auto-Roll pay-as-you-go pricing schedule. Use when the user asks about costs, rates, or how billing works.",
    inputSchema: z.object({}),
    execute: async () => {
      await agentProcessingDelay();
      const table: PricingTable = { items: PRICING_TABLE_ROWS };
      return jsonSafe(table);
    },
  });
}
