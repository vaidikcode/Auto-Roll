import { randomUUID } from "crypto";
import { getAdminClient } from "@/lib/db/client";
import { createBagCheckout } from "@/lib/bag/client";
import { buildBagPaymentLinkPreview } from "@/lib/bag/mock-payment-link";
import {
  DISBURSEMENT_CHECKOUT_USD,
  disbursementCheckoutUrl,
} from "@/lib/payroll/disbursement-checkout";
import { defaultAppOrigin, resolveAppOrigin } from "@/lib/payroll/app-origin";
import type { Employee, ComplianceReport } from "@/lib/db/types";

function shouldUseRealBag(): boolean {
  return (
    process.env.BAG_USE_REAL === "1" &&
    Boolean(process.env.BAG_API_KEY?.trim())
  );
}

function buildBagReturnUrl(
  runId: string,
  employeeId: string,
  appOrigin?: string
): string {
  const origin = resolveAppOrigin(appOrigin) ?? defaultAppOrigin();
  const url = new URL("/payment-confirmed", origin);
  url.searchParams.set("runId", runId);
  url.searchParams.set("payment", "completed");
  url.searchParams.set("employeeId", employeeId);
  return url.toString();
}

export type PaymentLinkEnsureResult = {
  employee_name: string;
  employee_id: string;
  country: string;
  amount_usd: number;
  currency: string;
  bag_link_id: string;
  url: string;
  verify_url: string;
  compliance_status: "clear" | "flagged";
  compliance_steps_count: number;
  payment_link_id?: string;
  already_existed?: boolean;
};

/**
 * Creates a $2 payment link: Bag checkout in `url`, Auto-Roll confirmation in `verify_url`.
 * Live Bag sessions include returnUrl to /payment-confirmed when BAG_USE_REAL=1.
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
    const vUrl = disbursementCheckoutUrl(options?.appOrigin, existing.id);
    let bagUrl = existing.url ?? "";
    let bagId = existing.bag_link_id ?? `sim:${existing.id}`;

    const hasBag = bagUrl.includes("getbags.app");
    if (!hasBag) {
      const bagLink = shouldUseRealBag()
        ? await createBagCheckout({
            name: `Payroll — ${emp.name}`,
            amount: DISBURSEMENT_CHECKOUT_USD,
            returnUrl: buildBagReturnUrl(runId, employeeId, options?.appOrigin),
          })
        : buildBagPaymentLinkPreview(runId, employeeId);
      bagUrl = bagLink.url;
      bagId = bagLink.id;
    }

    const needsRowUpdate =
      !hasBag ||
      Number(existing.amount) !== DISBURSEMENT_CHECKOUT_USD ||
      existing.url !== bagUrl ||
      existing.bag_link_id !== bagId;

    if (needsRowUpdate) {
      await db
        .from("payment_links")
        .update({
          amount: DISBURSEMENT_CHECKOUT_USD,
          url: bagUrl,
          bag_link_id: bagId,
        })
        .eq("id", existing.id);
    }

    return {
      employee_name: emp.name,
      employee_id: emp.id,
      country: emp.country,
      amount_usd: DISBURSEMENT_CHECKOUT_USD,
      currency: emp.currency,
      bag_link_id: bagId,
      url: bagUrl,
      verify_url: vUrl,
      compliance_status: compliance?.status === "flagged" ? "flagged" : "clear",
      compliance_steps_count: Array.isArray(compliance?.actionable_steps)
        ? compliance.actionable_steps.length
        : 0,
      payment_link_id: existing.id,
      already_existed: true,
    };
  }

  const paymentLinkId = randomUUID();
  const bagLink = shouldUseRealBag()
    ? await createBagCheckout({
        name: `Payroll — ${emp.name}`,
        amount: DISBURSEMENT_CHECKOUT_USD,
        returnUrl: buildBagReturnUrl(runId, employeeId, options?.appOrigin),
      })
    : buildBagPaymentLinkPreview(runId, employeeId);

  const vUrl = disbursementCheckoutUrl(options?.appOrigin, paymentLinkId);

  const { data: linkRecord, error } = await db
    .from("payment_links")
    .insert({
      id: paymentLinkId,
      run_id: runId,
      employee_id: employeeId,
      bag_link_id: bagLink.id,
      url: bagLink.url,
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
        url: bagLink.url,
        verify_url: vUrl,
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
    bag_link_id: bagLink.id,
    url: bagLink.url,
    verify_url: vUrl,
    compliance_status: compliance?.status === "flagged" ? "flagged" : "clear",
    compliance_steps_count: Array.isArray(compliance?.actionable_steps)
      ? compliance.actionable_steps.length
      : 0,
    payment_link_id: linkRecord?.id,
  };
}
