import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { makeQnaTools } from "@/lib/agents/qna";
import { makeOnboardingTools } from "@/lib/agents/onboarding";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = await createAdminClient();
  const { data: member } = await admin
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return new Response("No tenant found", { status: 400 });
  }

  const body = await req.json();
  const { messages, agentType } = body;

  // Convert UI messages to model messages
  const modelMessages = await convertToModelMessages(messages);

  if (agentType === "onboarding") {
    const tools = makeOnboardingTools(member.tenant_id);
    const result = streamText({
      model: openai("gpt-4o"),
      system: `You are Auto-Roll's Onboarding Agent. You help HR administrators add new employees.
You can:
- Guide them through adding a single employee (ask for: name, email, role/title, department, salary/hourly rate, classification, location, preferred payout method)
- Parse and import CSV data (bulk create)
- Validate inputs before creating records

Always confirm key details before calling createEmployee or bulkCreateEmployees.
Be friendly, clear, and ask one set of questions at a time.`,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
    });
    return result.toTextStreamResponse();
  }

  // Q&A agent — find employee record for user
  const { data: employee } = await admin
    .from("employees")
    .select("id")
    .eq("tenant_id", member.tenant_id)
    .eq("email", user.email ?? "")
    .maybeSingle();

  const tools = makeQnaTools(member.tenant_id, employee?.id);

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are Auto-Roll's Employee Assistant. You help employees understand:
- Their pay stubs and compensation breakdown
- Company policies (PTO, benefits, reimbursements)
- Payroll schedules and pay dates
- Tax withholdings and deductions

You have access to their personal pay stubs and company policy documents.
Always be helpful, accurate, and concise. For sensitive questions, refer to HR.
Today's date: ${new Date().toISOString().split("T")[0]}`,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toTextStreamResponse();
}
