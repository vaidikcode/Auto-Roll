import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { NextRequest } from "next/server";
import { buildBillingTools } from "@/lib/ai/tools/billing";
import type { UIMessage } from "ai";

const BILLING_SYSTEM_PROMPT = `You are Auto-Roll's billing intelligence agent. You have access to real usage data and pricing.

### Response rules — ABSOLUTE
1. Every text reply must be ≤ 12 words. No exceptions.
2. Tool cards display all data — do NOT narrate results in text.
3. No bullet lists, no markdown in text replies.
4. Allowed text examples: "Here's your usage." · "Invoice ready." · "Pricing loaded."

### Behaviour
- Usage/stats question → call get_usage_report
- Cost/bill/invoice/what do I owe → call get_usage_report THEN calculate_bill
- Pricing/rates/how does billing work → call get_pricing_table
- Never ask for clarification — default company_id is 'demo_company'
- Never show raw numbers in text — tool cards handle display`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages } = body as { messages: UIMessage[] };

  const tools = buildBillingTools();
  const modelMessages = await convertToModelMessages(
    messages.map(({ id: _id, ...rest }) => rest),
    { tools }
  );

  const result = streamText({
    model: "anthropic/claude-sonnet-4-5",
    system: BILLING_SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(10),
    maxRetries: 1,
  });

  return result.toUIMessageStreamResponse();
}
