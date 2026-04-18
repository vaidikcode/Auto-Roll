import { streamText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const createEmployeeSchema = z.object({
  full_name: z.string(),
  email: z.string().email(),
  classification: z.enum(["employee", "contractor"]),
  department: z.string().optional(),
  job_title: z.string().optional(),
  base_salary_annual: z.number(),
  hourly_rate: z.number().optional(),
  jurisdiction_country: z.string().default("US"),
  jurisdiction_state: z.string().optional(),
  payout_method: z.enum(["ach", "wire", "usdc"]).default("ach"),
  wallet_address: z.string().optional(),
  start_date: z.string().describe("ISO date string"),
});

const bulkCreateSchema = z.object({
  employees: z.array(
    z.object({
      full_name: z.string(),
      email: z.string(),
      classification: z.enum(["employee", "contractor"]),
      base_salary_annual: z.number(),
      job_title: z.string().optional(),
      department: z.string().optional(),
      jurisdiction_country: z.string().default("US"),
      jurisdiction_state: z.string().optional(),
      payout_method: z.enum(["ach", "wire", "usdc"]).default("ach"),
      start_date: z.string(),
    })
  ),
});

const checkDuplicateSchema = z.object({ email: z.string() });

type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
type BulkCreateInput = z.infer<typeof bulkCreateSchema>;
type CheckDuplicateInput = z.infer<typeof checkDuplicateSchema>;

export function makeOnboardingTools(tenantId: string) {
  return {
    createEmployee: tool({
      description: "Create a new employee record in the database",
      inputSchema: createEmployeeSchema,
      execute: async (params: CreateEmployeeInput) => {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
          .from("employees")
          .insert({ ...params, tenant_id: tenantId, active: true })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return { success: true, employee: data };
      },
    }),

    bulkCreateEmployees: tool({
      description: "Create multiple employees at once from CSV data",
      inputSchema: bulkCreateSchema,
      execute: async ({ employees }: BulkCreateInput) => {
        const supabase = await createAdminClient();
        const rows = employees.map((e) => ({ ...e, tenant_id: tenantId, active: true }));
        const { data, error } = await supabase
          .from("employees")
          .insert(rows)
          .select();

        if (error) throw new Error(error.message);
        return { success: true, created: data?.length ?? 0 };
      },
    }),

    checkDuplicateEmail: tool({
      description: "Check if an employee email already exists in this tenant",
      inputSchema: checkDuplicateSchema,
      execute: async ({ email }: CheckDuplicateInput) => {
        const supabase = await createAdminClient();
        const { data } = await supabase
          .from("employees")
          .select("id, full_name")
          .eq("tenant_id", tenantId)
          .eq("email", email)
          .single();

        return { exists: !!data, existing: data };
      },
    }),
  };
}

export async function streamOnboardingResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  tenantId: string
) {
  const tools = makeOnboardingTools(tenantId);

  return streamText({
    model: openai("gpt-4o"),
    system: `You are Auto-Roll's Onboarding Agent. You help HR administrators add new employees.
You can:
- Guide them through adding a single employee (ask for: name, email, role/title, department, salary/hourly rate, classification, location, preferred payout method)
- Parse and import CSV data (bulk create)
- Validate inputs before creating records

Always confirm key details before calling createEmployee or bulkCreateEmployees.
Be friendly, clear, and ask one set of questions at a time.`,
    messages,
    tools,
    stopWhen: stepCountIs(10),
  });
}
