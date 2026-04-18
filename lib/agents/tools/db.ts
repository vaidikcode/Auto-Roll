import { tool } from "ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import type { Employee, PayrollRun, PayrollLineItem } from "@/lib/supabase/types";

export function makeDbTools(tenantId: string) {
  return {
    getEmployees: tool({
      description: "Fetch all active employees for the current tenant",
      inputSchema: z.object({}),
      execute: async (_args: Record<string, never>) => {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("active", true)
          .order("full_name");

        if (error) throw new Error(error.message);
        return data as Employee[];
      },
    }),

    getPayrollHistory: tool({
      description: "Fetch recent payroll runs to compare against",
      inputSchema: z.object({
        limit: z.number().default(3).describe("Number of past runs to fetch"),
      }),
      execute: async ({ limit }: { limit: number }) => {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
          .from("payroll_runs")
          .select("*, payroll_line_items(*)")
          .eq("tenant_id", tenantId)
          .in("status", ["approved", "paid"])
          .order("period_end", { ascending: false })
          .limit(limit);

        if (error) throw new Error(error.message);
        return data as (PayrollRun & { payroll_line_items: PayrollLineItem[] })[];
      },
    }),

    createPayrollRun: tool({
      description: "Create a new payroll run record in pending_approval status",
      inputSchema: z.object({
        period_start: z.string().describe("ISO date string for period start"),
        period_end: z.string().describe("ISO date string for period end"),
        pay_date: z.string().describe("ISO date string for pay date"),
        total_gross: z.number(),
        total_net: z.number(),
        total_taxes: z.number(),
        employee_count: z.number(),
        notes: z.string().optional(),
      }),
      execute: async (params: {
        period_start: string;
        period_end: string;
        pay_date: string;
        total_gross: number;
        total_net: number;
        total_taxes: number;
        employee_count: number;
        notes?: string;
      }) => {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
          .from("payroll_runs")
          .insert({ ...params, tenant_id: tenantId, status: "pending_approval" })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data as PayrollRun;
      },
    }),

    createLineItems: tool({
      description: "Insert payroll line items for each employee in the run",
      inputSchema: z.object({
        payroll_run_id: z.string(),
        line_items: z.array(
          z.object({
            employee_id: z.string(),
            gross_pay: z.number(),
            federal_tax: z.number(),
            state_tax: z.number(),
            social_security: z.number(),
            medicare: z.number(),
            other_deductions: z.number(),
            net_pay: z.number(),
            hours_worked: z.number().optional(),
            bonus: z.number().default(0),
            reimbursements: z.number().default(0),
            notes: z.string().optional(),
          })
        ),
      }),
      execute: async ({ payroll_run_id, line_items }: {
        payroll_run_id: string;
        line_items: Array<{
          employee_id: string;
          gross_pay: number;
          federal_tax: number;
          state_tax: number;
          social_security: number;
          medicare: number;
          other_deductions: number;
          net_pay: number;
          hours_worked?: number;
          bonus: number;
          reimbursements: number;
          notes?: string;
        }>;
      }) => {
        const supabase = await createAdminClient();
        const rows = line_items.map((item) => ({
          ...item,
          payroll_run_id,
          tenant_id: tenantId,
        }));

        const { data, error } = await supabase
          .from("payroll_line_items")
          .insert(rows)
          .select();

        if (error) throw new Error(error.message);
        return data;
      },
    }),

    logAgentRun: tool({
      description: "Log this agent run to the audit table",
      inputSchema: z.object({
        agent: z.string(),
        input: z.record(z.string(), z.unknown()),
        output: z.record(z.string(), z.unknown()),
        tools_called: z.array(z.string()),
        cost_usd: z.number().optional(),
        payroll_run_id: z.string().optional(),
        status: z.enum(["completed", "failed"]),
      }),
      execute: async (params: {
        agent: string;
        input: Record<string, unknown>;
        output: Record<string, unknown>;
        tools_called: string[];
        cost_usd?: number;
        payroll_run_id?: string;
        status: "completed" | "failed";
      }) => {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
          .from("agent_runs")
          .insert({ ...params, tenant_id: tenantId })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      },
    }),
  };
}
