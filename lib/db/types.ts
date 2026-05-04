export type RunStatus =
  | "collecting"
  | "calculating"
  | "awaiting_approval"
  | "approved"
  | "paying"
  | "done"
  | "rejected";

export type EmploymentType = "domestic" | "international";

export type ComplianceStatus = "pending" | "clear" | "flagged";

export type PaymentLinkStatus = "created" | "paid" | "expired" | "failed";

export interface PayrollRun {
  id: string;
  company_id: string;
  status: RunStatus;
  totals: RunTotals;
  created_at: string;
  updated_at: string;
}

export interface RunTotals {
  total_gross_usd?: number;
  total_net_usd?: number;
  total_taxes_usd?: number;
  employee_count?: number;
  domestic_count?: number;
  international_count?: number;
  by_country?: Record<string, number>;
}

export interface Employee {
  id: string;
  run_id: string;
  name: string;
  email: string;
  country: string;
  currency: string;
  base_salary_usd: number;
  employment_type: EmploymentType;
  tax_locale: TaxLocale;
  dependents: number;
  benefits: Benefits;
  retirement_match_pct: number;
  payout_destination: PayoutDestination;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TaxLocale {
  state?: string;
  state_tax_rate?: number;
  federal_filing_status?: "single" | "married_joint" | "married_separate" | "head_of_household";
}

export interface Benefits {
  healthcare_plan?: "basic" | "premium" | "none";
  healthcare_monthly_deduction?: number;
}

export interface PayoutDestination {
  type: "ach" | "wire" | "crypto";
  bank_name?: string;
  last4?: string;
  wallet?: string;
  routing?: string;
}

export interface PayrollItem {
  id: string;
  run_id: string;
  employee_id: string;
  gross: number;
  federal_tax: number;
  state_tax: number;
  fica: number;
  healthcare: number;
  retirement: number;
  other_deductions: number;
  net_usd: number;
  net_local: number | null;
  fx_rate: number | null;
  fees: number;
  breakdown: PayrollBreakdown;
  created_at: string;
}

export interface PayrollBreakdown {
  gross_monthly?: number;
  federal_rate?: number;
  state_rate?: number;
  fica_rate?: number;
  healthcare_plan?: string;
  retirement_employee_pct?: number;
  retirement_employer_match?: number;
  corridor?: string;
  transfer_fee_pct?: number;
  compliance_flags?: string[];
}

export interface ComplianceReport {
  id: string;
  run_id: string;
  employee_id: string;
  country: string;
  summary: string;
  sources: ComplianceSource[];
  actionable_steps: ActionableStep[];
  status: ComplianceStatus;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ActionableStep {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "documentation" | "reporting" | "limit" | "tax" | "regulatory";
}

export interface PaymentLink {
  id: string;
  run_id: string;
  employee_id: string;
  bag_link_id: string | null;
  url: string | null;
  amount: number;
  currency: string;
  chain: string | null;
  status: PaymentLinkStatus;
  tx_hash: string | null;
  last_webhook_delivery_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolEvent {
  id: string;
  run_id: string;
  tool_name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  duration_ms: number | null;
  created_at: string;
}

// ── Billing types ────────────────────────────────────────────

export interface ToolUsageSummary {
  tool_name: string;
  call_count: number;
  unit_price_usd: number;
  line_total_usd: number;
}

export interface UsageReport {
  company_id: string;
  period_start: string;
  period_end: string;
  run_count: number;
  employee_count: number;
  compliance_check_count: number;
  domestic_calc_count: number;
  tool_breakdown: ToolUsageSummary[];
}

export interface BillLineItem {
  description: string;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
}

export interface BillResult {
  company_id: string;
  period_start: string;
  period_end: string;
  line_items: BillLineItem[];
  subtotal_usd: number;
  tax_usd: number;
  total_usd: number;
  generated_at: string;
}

export interface PricingTable {
  items: Array<{ name: string; description: string; unit: string; price_usd: number }>;
}

// Full run snapshot for right panel
export interface RunSnapshot {
  run: PayrollRun;
  employees: Employee[];
  payroll_items: PayrollItem[];
  compliance_reports: ComplianceReport[];
  payment_links: PaymentLink[];
  tool_events: ToolEvent[];
}
