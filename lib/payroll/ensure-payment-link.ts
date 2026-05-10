import { randomUUID } from "crypto";
import { getAdminClient } from "@/lib/db/client";
import {
  DISBURSEMENT_CHECKOUT_USD,
  disbursementCheckoutUrl,
} from "@/lib/payroll/disbursement-checkout";
import type { Employee, PayrollItem, ComplianceReport } from "@/lib/db/types";

export type PaymentLinkEnsureResult = {
  employee_name: string;
  employee_id: string;
  country: string;
  amount_usd: number;
  currency: string;
  bag_link_id: string;
  url: string;
  compliance_status: "clear" | "flagged";
  compliance_steps_count: number;
  payment_link_id?: string;
  already_existed?: boolean;
};

/**
 * Creates a payment link row for one employee on a run, or returns the existing link.
 * Every link is a fixed $2 in-app checkout at `/disburse/[paymentLinkId]` (simulated pay on visit).
 * Used by the AI tool and by POST /api/runs/:id/approve.
 */
export async function ensurePaymentLinkForEmployee(
  runId: string,
  employeeId: string,
  options?: { recordToolEvent?: boolean; appOrigin?: string }
): Promise<PaymentLinkEnsureResult> {
  const recordToolEvent = options?.recordToolEvent !== false;
  const db = getAdminClient();
  const start = Date.now();

  const { data: existing } = await db
    .from("payment_links")
    .select("id, bag_link_id, url, amount, currency, employee_id")
    .eq("run_id", runId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  const [employeeRes, payrollItemRes, complianceRes] = await Promise.all([
    db
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .eq("run_id", runId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("payroll_items")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("run_id", runId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("compliance_reports")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("run_id", runId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const employee = employeeRes.data;
  const payrollItem = payrollItemRes.data;
  const complianceReport = complianceRes.data;

  if (!employee) {
    throw new Error(
      `Employee not found for ${employeeId} on run ${runId}${employeeRes.error ? ` (${employeeRes.error.message})` : ""}`
    );
  }
  if (!payrollItem) {
    throw new Error(
      `Payroll item not found for ${employeeId} on run ${runId}${payrollItemRes.error ? ` (${payrollItemRes.error.message})` : ""}. Re-run calculate_domestic_payroll / calculate_international_payroll before approving.`
    );
  }

  const emp = employee as Employee;
  const compliance = complianceReport as ComplianceReport | null;

  if (existing?.id) {
    const url = disbursementCheckoutUrl(options?.appOrigin, existing.id);
    if (
      Number(existing.amount) !== DISBURSEMENT_CHECKOUT_USD ||
      existing.url !== url
    ) {
      await db
        .from("payment_links")
        .update({ amount: DISBURSEMENT_CHECKOUT_USD, url })
        .eq("id", existing.id);
    }

    return {
      employee_name: emp.name,
      employee_id: emp.id,
      country: emp.country,
      amount_usd: DISBURSEMENT_CHECKOUT_USD,
      currency: emp.currency,
      bag_link_id: existing.bag_link_id ?? `sim:${existing.id}`,
      url,
      compliance_status: compliance?.status === "flagged" ? "flagged" : "clear",
      compliance_steps_count: Array.isArray(compliance?.actionable_steps)
        ? compliance.actionable_steps.length
        : 0,
      payment_link_id: existing.id,
      already_existed: true,
    };
  }

  const paymentLinkId = randomUUID();
  const url = disbursementCheckoutUrl(options?.appOrigin, paymentLinkId);
  const bag_link_id = `sim:${paymentLinkId}`;

  const { data: linkRecord, error } = await db
    .from("payment_links")
    .insert({
      id: paymentLinkId,
      run_id: runId,
      employee_id: employeeId,
      bag_link_id,
      url,
      amount: DISBURSEMENT_CHECKOUT_USD,
      currency: emp.currency,
      chain: emp.employment_type === "international" ? "base" : null,
      status: "created",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save payment link: ${error.message}`);

  if (recordToolEvent) {
    await db.from("tool_events").insert({
      run_id: runId,
      tool_name: "create_payment_link",
      args: { employee_id: employeeId },
      result: {
        url,
        amount: DISBURSEMENT_CHECKOUT_USD,
        currency: emp.currency,
      },
      duration_ms: Date.now() - start,
    });
  }

  return {
    employee_name: emp.name,
    employee_id: employeeId,
    country: emp.country,
    amount_usd: DISBURSEMENT_CHECKOUT_USD,
    currency: emp.currency,
    bag_link_id,
    url,
    compliance_status: compliance?.status === "flagged" ? "flagged" : "clear",
    compliance_steps_count: Array.isArray(compliance?.actionable_steps)
      ? compliance.actionable_steps.length
      : 0,
    payment_link_id: linkRecord?.id,
  };
}
