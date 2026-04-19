/** Banking / treasury-style copy — calm, precise, human (not “AI assistant” hype). */

export const gatewayTabs = {
  workflow: "Run pipeline",
  roster: "Roster",
  compliance: "Compliance",
  payslips: "Payslips",
  payments: "Disbursements",
  assistant: "Operations desk",
} as const;

export type GatewayTabId = keyof typeof gatewayTabs;

const TAB_ORDER = Object.keys(gatewayTabs) as GatewayTabId[];

export function parseGatewayTab(raw: string | null): GatewayTabId {
  if (raw && TAB_ORDER.includes(raw as GatewayTabId)) return raw as GatewayTabId;
  return "workflow";
}

export const workflowStepCopy = {
  roster: {
    title: "Roster locked",
    subtitle:
      "Confirm who is on this pay cycle. The run will only process people you include here.",
  },
  compliance: {
    title: "Compliance intelligence",
    subtitle:
      "Public-source checks for cross-border workers. This is guidance, not legal advice—your counsel still signs off.",
  },
  calculation: {
    title: "Gross-to-net engine",
    subtitle:
      "Withholdings, benefits, FX, and corridor fees applied per jurisdiction. Numbers are auditable line-by-line.",
  },
  mor: {
    title: "Merchant of record handoff",
    subtitle:
      "When you approve, we prepare settlement instructions so funds route through your MoR partner correctly.",
  },
  payslip: {
    title: "Payslip issuance",
    subtitle:
      "Each employee gets a period statement you can retain for records or send to finance.",
  },
  links: {
    title: "Disbursement links",
    subtitle:
      "Hosted checkout links for each net amount. Share only through your approved channels.",
  },
  complete: {
    title: "Run closed",
    subtitle: "Ledger entries are final for this cycle unless you open a correction run.",
  },
} as const;

export const gatewayEmpty = {
  roster:
    "No one is on this run yet. Start the pipeline from the Operations desk tab, or use “Run payout” above.",
  compliance:
    "Once the roster is in, we’ll fetch cross-border summaries for anyone paid outside the U.S.",
  payslips:
    "Payslips appear after gross-to-net completes for the people on your selection.",
  payments:
    "Disbursement links are created after you approve the run and the MoR step finishes.",
  assistant:
    "This is where your treasury team talks to the system—plain English, full audit trail on the other tabs.",
} as const;
