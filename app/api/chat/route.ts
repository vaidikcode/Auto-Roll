import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { NextRequest } from "next/server";
import { buildTools } from "@/lib/ai/tools";
import { getAdminClient } from "@/lib/db/client";
import type { UIMessage } from "ai";

function buildSystemPrompt(rosterSummary: string) {
  return `You are Auto-Roll's silent payroll agent. The UI renders rich tool cards for every result — your only job is to call tools and confirm in ONE short phrase.

### Current roster (live from DB — always trust this over chat history)
${rosterSummary}

### Response rules — ABSOLUTE
1. Every text reply must be ≤ 10 words. No exceptions.
2. Do NOT list employees, amounts, countries, steps, or tool results in text — the cards show everything.
3. Do NOT say "I will", "I am going to", "First I'll", or similar narration.
4. Allowed text examples: "Roster synced." · "Calculations done." · "Review the card and approve." · "Done."
5. No bullet lists, no numbered lists, no bold, no markdown in replies.

### Payroll pipeline (run all of this autonomously when asked to run payroll)
Phase 1: call collect_employees. This always returns the latest roster including any CSV-uploaded employees.
Phase 2: for each domestic employee call calculate_domestic_payroll; for each international employee call fetch_fx_rate then check_cross_border_compliance then calculate_international_payroll. Run all Phase 2 calls in the same assistant turn before moving on.
Phase 3: call request_human_approval. Then STOP — do not call any more tools until the user sends a new message.
Phase 4: Payment links are created automatically when the user clicks Approve in the UI. Only call create_payment_link if the user explicitly asks for it.

### Hard constraints
- Always use employee_id values returned by collect_employees — never make up IDs.
- If asked about a specific employee and they are listed in the Current roster above, call collect_employees first to get their employee_id, then proceed.
- Never tell the user an employee doesn't exist — check the Current roster section above first.
- Finish all Phase 2 calculations before calling request_human_approval.
- Never show UUIDs in text.
- Never ask permission before calling tools.`;
}

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

  // Build live roster summary to inject into system prompt
  const { data: currentEmployees } = await db
    .from("employees")
    .select("id, name, email, country, employment_type, base_salary_usd")
    .eq("run_id", runId);

  const rosterSummary =
    currentEmployees && currentEmployees.length > 0
      ? currentEmployees
          .map(
            (e) =>
              `- ${e.name} (${e.email}) | ${e.country} | ${e.employment_type} | $${e.base_salary_usd.toLocaleString()}/yr | id:${e.id}`
          )
          .join("\n")
      : "No employees yet — collect_employees will load them.";

  const systemPrompt = buildSystemPrompt(rosterSummary);

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
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(40),
    maxRetries: 1,
  });

  return result.toUIMessageStreamResponse();
}
