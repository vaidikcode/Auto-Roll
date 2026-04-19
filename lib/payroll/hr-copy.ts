import type { RunStatus } from "@/lib/db/types";

/** Plain-language labels for payroll run states (HR audience). */
export const runStatusHr: Record<RunStatus, { title: string; hint: string }> = {
  collecting: {
    title: "Roster in flight",
    hint: "We’re consolidating this cycle’s headcount from the sources on file.",
  },
  calculating: {
    title: "Gross-to-net in progress",
    hint: "Withholdings, benefits, and FX are being applied per person before anything is final.",
  },
  awaiting_approval: {
    title: "Awaiting treasury sign-off",
    hint: "Review the numbers on the Payslips and Compliance tabs, then confirm in Operations desk.",
  },
  approved: {
    title: "Signed off — preparing disbursement",
    hint: "MoR instructions and links will follow; nothing has left your accounts yet.",
  },
  paying: {
    title: "Issuing disbursement links",
    hint: "Hosted checkout links are being prepared for each net amount.",
  },
  done: {
    title: "Run settled on our side",
    hint: "Retain payslips and link confirmations with your bank reconciliation pack.",
  },
  rejected: {
    title: "Run halted",
    hint: "No further links or calculations will post until you open a new run.",
  },
};

export const toolEventHr: Record<string, string> = {
  collect_employees: "Team list updated",
  calculate_domestic_payroll: "U.S. pay calculated",
  fetch_fx_rate: "Exchange rate looked up",
  check_cross_border_compliance: "Cross-border rules checked",
  calculate_international_payroll: "International pay calculated",
  request_human_approval: "Asked you to review",
  human_approval: "Your decision recorded",
  create_payment_link: "Pay link created",
};

export function toolLabelForHr(toolName: string): string {
  return toolEventHr[toolName] ?? toolName.replace(/_/g, " ");
}
