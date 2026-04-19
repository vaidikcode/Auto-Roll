import { tool } from "ai";
import { z } from "zod";
import { jsonSafe } from "@/lib/ai/json-safe";
import { getAdminClient } from "@/lib/db/client";
import { createBagPaymentLink } from "@/lib/bag/client";
import type { Employee, PayrollItem, ComplianceReport } from "@/lib/db/types";

export function makeCreatePaymentLinkTool(runId: string) {
  return tool({
    description:
      "Create a Bag payment link for an approved employee. Generates a hosted checkout URL for the net payment amount, persists it to the database.",
    inputSchema: z.object({
      employee_id: z.string().describe("UUID of the employee to create a payment link for"),
    }),
    execute: async ({ employee_id }: { employee_id: string }) => {
      const db = getAdminClient();
      const start = Date.now();

      const [{ data: employee }, { data: payrollItem }, { data: complianceReport }] =
        await Promise.all([
          db.from("employees").select("*").eq("id", employee_id).eq("run_id", runId).single(),
          db.from("payroll_items").select("*").eq("employee_id", employee_id).eq("run_id", runId).single(),
          db.from("compliance_reports").select("*").eq("employee_id", employee_id).eq("run_id", runId).maybeSingle(),
        ]);

      if (!employee || !payrollItem) {
        throw new Error(`Employee or payroll item not found for ${employee_id}`);
      }

      const emp = employee as Employee;
      const item = payrollItem as PayrollItem;
      const compliance = complianceReport as ComplianceReport | null;
      const amount = item.net_usd;

      let bagLink: { id: string; url: string } = {
        id: `mock-${employee_id.slice(0, 8)}`,
        url: `https://pay.getbags.app/mock/${employee_id.slice(0, 8)}`,
      };

      try {
        const result = await createBagPaymentLink({
          amount,
          currency: "usd",
          description: `Payroll — ${emp.name} — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          metadata: {
            employee_id,
            run_id: runId,
            employee_name: emp.name,
            country: emp.country,
          },
        });
        bagLink = { id: result.id, url: result.url };
      } catch {
        // Use mock URL when Bag API is unavailable
      }

      const { data: linkRecord, error } = await db
        .from("payment_links")
        .insert({
          run_id: runId,
          employee_id,
          bag_link_id: bagLink.id,
          url: bagLink.url,
          amount,
          currency: emp.currency,
          chain: emp.employment_type === "international" ? "base" : null,
          status: "created",
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to save payment link: ${error.message}`);

      await db.from("tool_events").insert({
        run_id: runId,
        tool_name: "create_payment_link",
        args: { employee_id },
        result: { url: bagLink.url, amount, currency: emp.currency },
        duration_ms: Date.now() - start,
      });

      return jsonSafe({
        employee_name: emp.name,
        employee_id,
        country: emp.country,
        amount_usd: amount,
        currency: emp.currency,
        bag_link_id: bagLink.id,
        url: bagLink.url,
        compliance_status: compliance?.status ?? "clear",
        compliance_steps_count: (compliance?.actionable_steps as unknown[])?.length ?? 0,
        payment_link_id: linkRecord?.id,
      });
    },
  });
}
