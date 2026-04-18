import { generateText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const checkTaxFilingsSchema = z.object({
  jurisdictions: z.array(
    z.object({ country: z.string(), state: z.string().optional() })
  ),
});

const flagMissingTaxIdsSchema = z.object({
  employees: z.array(
    z.object({
      id: z.string(),
      full_name: z.string(),
      tax_id_last4: z.string().nullable(),
    })
  ),
});

type CheckTaxFilingsInput = z.infer<typeof checkTaxFilingsSchema>;
type FlagMissingTaxIdsInput = z.infer<typeof flagMissingTaxIdsSchema>;

export async function runComplianceAgent(tenantId: string): Promise<{
  issues: string[];
  recommendations: string[];
  summary: string;
}> {
  const supabase = await createAdminClient();

  const { data: employees } = await supabase
    .from("employees")
    .select(
      "id, full_name, classification, jurisdiction_country, jurisdiction_state, tax_id_last4, start_date"
    )
    .eq("tenant_id", tenantId)
    .eq("active", true);

  const { data: recentRuns } = await supabase
    .from("payroll_runs")
    .select("period_start, period_end, pay_date, status")
    .eq("tenant_id", tenantId)
    .order("period_end", { ascending: false })
    .limit(5);

  const checkTaxFilingsDeadlines = tool({
    description: "Check upcoming tax filing deadlines for the tenant's jurisdictions",
    inputSchema: checkTaxFilingsSchema,
    execute: async ({ jurisdictions }: CheckTaxFilingsInput) => {
      const today = new Date();
      const year = today.getFullYear();
      const deadlines = jurisdictions.map((j) => ({
        jurisdiction: `${j.state ? j.state + ", " : ""}${j.country}`,
        deadlines: [
          {
            form: "Quarterly 941",
            due: `${year}-04-30`,
            status: today < new Date(`${year}-04-30`) ? "upcoming" : "past",
          },
          { form: "W-2 / 1099", due: `${year + 1}-01-31`, status: "upcoming" },
          { form: "Annual 940", due: `${year + 1}-01-31`, status: "upcoming" },
        ],
      }));
      return { deadlines };
    },
  });

  const flagMissingTaxIds = tool({
    description: "Flag employees who are missing tax IDs",
    inputSchema: flagMissingTaxIdsSchema,
    execute: async ({ employees: emps }: FlagMissingTaxIdsInput) => {
      const missing = emps.filter((e) => !e.tax_id_last4);
      return {
        missing_count: missing.length,
        employees: missing.map((e) => e.full_name),
      };
    },
  });

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `You are Auto-Roll's Compliance Agent. Review the current payroll data for compliance issues.
Check: missing tax IDs, upcoming filing deadlines, contractor misclassification risks, pay frequency compliance.
Return a JSON: { issues: string[], recommendations: string[], summary: string }

Tenant employees: ${JSON.stringify(employees?.slice(0, 20))}
Recent payroll runs: ${JSON.stringify(recentRuns)}
Today: ${new Date().toISOString().split("T")[0]}

Run your compliance checks and return the JSON report.`,
    tools: { checkTaxFilingsDeadlines, flagMissingTaxIds },
    stopWhen: stepCountIs(5),
  });

  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    }
  } catch {
    // fall through
  }

  return {
    issues: [],
    recommendations: [],
    summary: text,
  };
}
