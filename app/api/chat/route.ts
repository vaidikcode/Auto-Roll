import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { NextRequest } from "next/server";
import { buildTools } from "@/lib/ai/tools";
import { getAdminClient } from "@/lib/db/client";
import type { UIMessage } from "ai";

const SYSTEM_PROMPT = `You are Auto-Roll's silent payroll agent. The UI renders rich tool cards for every result — your only job is to call tools and confirm in ONE short phrase.

### Response rules — ABSOLUTE
1. Every text reply must be **≤ 10 words**. No exceptions.
2. Do NOT list employees, amounts, countries, steps, or tool results in text — the cards show everything.
3. Do NOT say "I will", "I am going to", "First I'll", or similar narration.
4. Allowed text examples: "Roster synced." · "Calculations done." · "Review the card and approve." · "Done."
5. No bullet lists, no numbered lists, no bold, no markdown in replies.

### Payroll pipeline (run all of this autonomously when asked to run payroll)
Phase 1: call collect_employees.
Phase 2: for each domestic employee call calculate_domestic_payroll; for each international employee call fetch_fx_rate then check_cross_border_compliance then calculate_international_payroll. Run all Phase 2 calls in the same assistant turn before moving on.
Phase 3: call request_human_approval. Then STOP — do not call any more tools until the user sends a new message.
Phase 4: Payment links are created automatically when the user clicks Approve in the UI. Only call create_payment_link if the user explicitly asks for it.

### Hard constraints
- Finish all Phase 2 calculations before calling request_human_approval.
- Never show UUIDs in text.
- Never ask permission before calling tools.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, runId } = body as { messages: UIMessage[]; runId: string };

  if (!runId) {
    return new Response("Missing runId", { status: 400 });
  }

  const db = getAdminClient();
  const { data: run } = await db
    .from("payroll_runs")
    .select("id, status")
    .eq("id", runId)
    .single();

  if (!run) {
    return new Response("Run not found", { status: 404 });
  }

  // Gateway model id routes via @ai-sdk/gateway (uses AI_GATEWAY_API_KEY).
  const tools = buildTools(runId);
  // Pass `tools` so tool call / result parts round-trip in a shape the gateway accepts.
  // Strip `id` — convertToModelMessages expects messages without client message ids.
  const modelMessages = await convertToModelMessages(
    messages.map(({ id: _id, ...rest }) => rest),
    { tools }
  );

  const result = streamText({
    model: "anthropic/claude-sonnet-4-5",
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(40),
    maxRetries: 1,
  });

  return result.toUIMessageStreamResponse();
}
