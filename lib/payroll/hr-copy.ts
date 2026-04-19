import type { RunStatus } from "@/lib/db/types";

/** Plain-language labels for payroll run states (HR audience). */
export const runStatusHr: Record<RunStatus, { title: string; hint: string }> = {
  collecting: {
    title: "Pulling together your team list",
    hint: "We are connecting to your payroll sources and offer letters.",
  },
  calculating: {
    title: "Working out this period’s pay",
    hint: "Taxes, benefits, and currency conversions are being applied.",
  },
  awaiting_approval: {
    title: "Ready for your review",
    hint: "Please confirm in the chat when the numbers look right.",
  },
  approved: {
    title: "You’ve approved this run",
    hint: "We’re preparing how each person will be paid.",
  },
  paying: {
    title: "Setting up how people get paid",
    hint: "Payment links are being created for each employee.",
  },
  done: {
    title: "This payroll run is complete",
    hint: "You can revisit any person’s page from the team list.",
  },
  rejected: {
    title: "This run was stopped",
    hint: "Nothing else will be sent until you start a new run.",
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
