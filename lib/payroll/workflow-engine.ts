import type { RunSnapshot, ToolEvent } from "@/lib/db/types";

export type PipelineStepId =
  | "roster"
  | "compliance"
  | "calculation"
  | "mor"
  | "payslip"
  | "links"
  | "complete";

export interface PipelineStep {
  id: PipelineStepId;
  title: string;
  subtitle: string;
  state: "pending" | "active" | "done" | "skipped";
  completedAt?: string;
}

function lastEvent(events: ToolEvent[], toolName: string): ToolEvent | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].tool_name === toolName) return events[i];
  }
  return undefined;
}

function selectedEmployees(snapshot: RunSnapshot, selectedIds: string[] | null) {
  if (!selectedIds?.length) return snapshot.employees;
  const set = new Set(selectedIds);
  return snapshot.employees.filter((e) => set.has(e.id));
}

function intlInSelection(employees: ReturnType<typeof selectedEmployees>) {
  return employees.filter((e) => e.employment_type === "international");
}

export function buildPipelineSteps(
  snapshot: RunSnapshot | null,
  selectedIds: string[] | null
): PipelineStep[] {
  const rosterTitle = "Roster locked";
  const rosterSubtitle =
    "Who is on this pay cycle. Processing respects your selection below.";
  const complianceTitle = "Compliance intelligence";
  const complianceSubtitle =
    "Cross-border signals from public sources—your counsel still approves policy.";
  const calcTitle = "Gross-to-net";
  const calcSubtitle =
    "Taxes, benefits, FX, and corridor fees—line items you can defend in audit.";
  const morTitle = "Merchant of record";
  const morSubtitle =
    "After you sign off, we align settlement with your MoR so funds move compliantly.";
  const slipTitle = "Payslips";
  const slipSubtitle =
    "Period statements for everyone in scope—ready for HR files or finance.";
  const linksTitle = "Disbursement links";
  const linksSubtitle =
    "One hosted link per net pay. Distribute only through channels your policy allows.";
  const doneTitle = "Settlement complete";
  const doneSubtitle =
    "This run is filed. Keep payslips and confirmations with your treasury records.";

  if (!snapshot) {
    return [
      { id: "roster", title: rosterTitle, subtitle: rosterSubtitle, state: "active" },
      { id: "compliance", title: complianceTitle, subtitle: complianceSubtitle, state: "pending" },
      { id: "calculation", title: calcTitle, subtitle: calcSubtitle, state: "pending" },
      { id: "mor", title: morTitle, subtitle: morSubtitle, state: "pending" },
      { id: "payslip", title: slipTitle, subtitle: slipSubtitle, state: "pending" },
      { id: "links", title: linksTitle, subtitle: linksSubtitle, state: "pending" },
      { id: "complete", title: doneTitle, subtitle: doneSubtitle, state: "pending" },
    ];
  }

  const ev = snapshot.tool_events ?? [];
  const st = snapshot.run.status;

  const employees = selectedEmployees(snapshot, selectedIds);
  const hasRoster = employees.length > 0;
  const intl = intlInSelection(employees);
  const needsCompliance = intl.length > 0;
  const complianceDone =
    !needsCompliance ||
    intl.every((e) => snapshot.compliance_reports.some((c) => c.employee_id === e.id));

  const calcDone =
    hasRoster &&
    employees.every((e) => snapshot.payroll_items.some((p) => p.employee_id === e.id));

  const awaiting = st === "awaiting_approval";
  const rejected = st === "rejected";
  const pastTreasuryApproval =
    st === "approved" || st === "paying" || st === "done";

  const linksDone =
    hasRoster &&
    employees.every((e) => snapshot.payment_links.some((p) => p.employee_id === e.id));

  const runComplete = st === "done";

  const rosterAt = lastEvent(ev, "collect_employees")?.created_at;
  const complianceAt = lastEvent(ev, "check_cross_border_compliance")?.created_at;
  const calcAt =
    lastEvent(ev, "calculate_international_payroll")?.created_at ??
    lastEvent(ev, "calculate_domestic_payroll")?.created_at;
  const approvalAt = lastEvent(ev, "request_human_approval")?.created_at;
  const linksAt = lastEvent(ev, "create_payment_link")?.created_at;

  const complianceState: PipelineStep["state"] = !hasRoster
    ? "pending"
    : needsCompliance
      ? complianceDone
        ? "done"
        : "active"
      : "skipped";

  const calculationState: PipelineStep["state"] = !hasRoster
    ? "pending"
    : !complianceDone
      ? "pending"
      : calcDone
        ? "done"
        : "active";

  const morState: PipelineStep["state"] = rejected
    ? "skipped"
    : !calcDone
      ? "pending"
      : awaiting
        ? "active"
        : pastTreasuryApproval
          ? "done"
          : "pending";

  const payslipState: PipelineStep["state"] = !calcDone
    ? "pending"
    : calcDone
      ? "done"
      : "active";

  const linksState: PipelineStep["state"] = rejected
    ? "skipped"
    : !pastTreasuryApproval
      ? "pending"
      : linksDone
        ? "done"
        : "active";

  const completeState: PipelineStep["state"] = runComplete
    ? "done"
    : rejected
      ? "skipped"
      : "pending";

  return [
    {
      id: "roster",
      title: rosterTitle,
      subtitle: rosterSubtitle,
      state: hasRoster ? "done" : "active",
      completedAt: rosterAt,
    },
    {
      id: "compliance",
      title: complianceTitle,
      subtitle: complianceSubtitle,
      state: complianceState,
      completedAt: needsCompliance ? complianceAt : undefined,
    },
    {
      id: "calculation",
      title: calcTitle,
      subtitle: calcSubtitle,
      state: calculationState,
      completedAt: calcDone ? calcAt : undefined,
    },
    {
      id: "mor",
      title: morTitle,
      subtitle: morSubtitle,
      state: morState,
      completedAt: pastTreasuryApproval ? approvalAt : undefined,
    },
    {
      id: "payslip",
      title: slipTitle,
      subtitle: slipSubtitle,
      state: payslipState,
      completedAt: calcDone ? calcAt : undefined,
    },
    {
      id: "links",
      title: linksTitle,
      subtitle: linksSubtitle,
      state: linksState,
      completedAt: linksDone ? linksAt : undefined,
    },
    {
      id: "complete",
      title: doneTitle,
      subtitle: doneSubtitle,
      state: completeState,
    },
  ];
}
