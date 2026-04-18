import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase/server";
import { runPayrollAgent } from "@/lib/agents/payroll";
import { runComplianceAgent } from "@/lib/agents/compliance";
import { getBagClient } from "@/lib/bag/client";

type StepTools = {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
};

/**
 * Scheduled payroll sweep: runs every 1st and 15th of each month.
 * Finds tenants with auto-payroll enabled and triggers the agent.
 */
export const scheduledPayroll = inngest.createFunction(
  {
    id: "scheduled-payroll",
    name: "Scheduled Payroll Sweep",
    triggers: [{ cron: "0 9 1,15 * *" }],
  },
  async ({ step }: { step: StepTools }) => {
    const admin = await createAdminClient();

    const tenants = await step.run("fetch-tenants", async () => {
      const { data } = await admin
        .from("tenants")
        .select("id")
        .eq("subscription_status", "active")
        .eq("auto_payroll", true);
      return data ?? [];
    });

    for (const tenant of tenants) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const isFirstHalf = day <= 15;
      const periodStart = isFirstHalf
        ? `${year}-${String(month).padStart(2, "0")}-01`
        : `${year}-${String(month).padStart(2, "0")}-16`;
      const lastDay = new Date(year, month, 0).getDate();
      const periodEnd = isFirstHalf
        ? `${year}-${String(month).padStart(2, "0")}-15`
        : `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
      const payDate = periodEnd;

      await step.run(`run-payroll-${tenant.id}`, async () => {
        return runPayrollAgent({
          tenantId: tenant.id,
          periodStart,
          periodEnd,
          payDate,
          requestedBy: "scheduler",
        });
      });
    }

    return { processed: tenants.length };
  }
);

/**
 * Weekly compliance sweep for all active tenants.
 */
export const weeklyComplianceSweep = inngest.createFunction(
  {
    id: "weekly-compliance-sweep",
    name: "Weekly Compliance Sweep",
    triggers: [{ cron: "0 8 * * 1" }],
  },
  async ({ step }: { step: StepTools }) => {
    const admin = await createAdminClient();

    const tenants = await step.run("fetch-tenants", async () => {
      const { data } = await admin
        .from("tenants")
        .select("id")
        .eq("subscription_status", "active");
      return data ?? [];
    });

    for (const tenant of tenants) {
      await step.run(`compliance-${tenant.id}`, async () => {
        const result = await runComplianceAgent(tenant.id);
        await admin.from("agent_runs").insert({
          tenant_id: tenant.id,
          agent: "compliance",
          input: { triggered_by: "scheduler" },
          output: result,
          tools_called: [],
          status: "completed",
        });
        return result;
      });
    }

    return { processed: tenants.length };
  }
);

/**
 * Daily billing reconciliation.
 */
export const dailyBillingReconciliation = inngest.createFunction(
  {
    id: "daily-billing-recon",
    name: "Daily Billing Reconciliation",
    triggers: [{ cron: "0 6 * * *" }],
  },
  async ({ step }: { step: StepTools }) => {
    const admin = await createAdminClient();
    const bag = getBagClient();

    const subscriptions = await step.run("fetch-subscriptions", async () => {
      const { data } = await admin
        .from("subscriptions")
        .select("id, tenant_id, bag_subscription_id")
        .eq("status", "active");
      return data ?? [];
    });

    let reconciled = 0;

    for (const sub of subscriptions) {
      await step.run(`recon-${sub.id}`, async () => {
        try {
          const { data: transactions } = await bag.transactions.list({ limit: 10 });

          await admin.from("agent_runs").insert({
            tenant_id: sub.tenant_id,
            agent: "billing_reconciliation",
            input: { subscription_id: sub.bag_subscription_id },
            output: { transaction_count: transactions?.length ?? 0, status: "ok" },
            tools_called: ["bag.transactions.list"],
            status: "completed",
          });

          reconciled++;
        } catch {
          await admin.from("agent_runs").insert({
            tenant_id: sub.tenant_id,
            agent: "billing_reconciliation",
            input: { subscription_id: sub.bag_subscription_id },
            output: { status: "failed" },
            tools_called: [],
            status: "failed",
          });
        }
      });
    }

    return { reconciled };
  }
);
