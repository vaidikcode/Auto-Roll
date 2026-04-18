import { streamText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

export function makeQnaTools(tenantId: string, employeeId?: string) {
  return {
    searchDocuments: tool({
      description: "Search company policies and pay stubs using semantic similarity",
      inputSchema: z.object({
        query: z.string().describe("What to search for"),
      }),
      execute: async ({ query }: { query: string }) => {
        const supabase = await createAdminClient();

        const { data, error } = await supabase.rpc("search_documents", {
          query_text: query,
          tenant_id_param: tenantId,
          employee_id_param: employeeId ?? null,
          match_count: 5,
        });

        if (error) {
          return { results: [], message: "Could not search documents at this time." };
        }

        return { results: data ?? [] };
      },
    }),

    getMyPayStubs: tool({
      description: "Fetch recent pay stubs for the current employee",
      inputSchema: z.object({
        limit: z.number().default(3),
      }),
      execute: async ({ limit }: { limit: number }) => {
        if (!employeeId) return { stubs: [] };
        const supabase = await createAdminClient();
        const { data, error } = await supabase
          .from("pay_stubs")
          .select("*, payroll_runs(period_start, period_end, pay_date)")
          .eq("employee_id", employeeId)
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) return { stubs: [] };
        return { stubs: data ?? [] };
      },
    }),

    getMyProfile: tool({
      description: "Fetch the current employee's profile and compensation details",
      inputSchema: z.object({}),
      execute: async (_args: Record<string, never>) => {
        void _args;
        if (!employeeId) return { employee: null };
        const supabase = await createAdminClient();
        const { data } = await supabase
          .from("employees")
          .select(
            "full_name, job_title, department, base_salary_annual, classification, jurisdiction_country, jurisdiction_state, start_date"
          )
          .eq("id", employeeId)
          .single();

        return { employee: data };
      },
    }),
  };
}

export async function streamQnaResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  tenantId: string,
  employeeId?: string
) {
  const tools = makeQnaTools(tenantId, employeeId);

  return streamText({
    model: openai("gpt-4o"),
    system: `You are Auto-Roll's Employee Assistant. You help employees understand:
- Their pay stubs and compensation breakdown
- Company policies (PTO, benefits, reimbursements)
- Payroll schedules and pay dates
- Tax withholdings and deductions

You have access to their personal pay stubs and company policy documents.
Always be helpful, accurate, and concise. For sensitive questions, refer to HR.
Today's date: ${new Date().toISOString().split("T")[0]}`,
    messages,
    tools,
    stopWhen: stepCountIs(5),
  });
}
