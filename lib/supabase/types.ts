export type PayoutMethod = "ach" | "wire" | "usdc";
export type EmployeeClassification = "employee" | "contractor";
export type PayrollRunStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "paid"
  | "failed";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "paused" | "trialing";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TenantRole = "owner" | "admin" | "viewer";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  bag_customer_id: string | null;
  bag_subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  plan: "starter" | "growth" | "enterprise" | null;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  classification: EmployeeClassification;
  department: string | null;
  job_title: string | null;
  base_salary_annual: number;
  hourly_rate: number | null;
  jurisdiction_country: string;
  jurisdiction_state: string | null;
  payout_method: PayoutMethod;
  wallet_address: string | null;
  bank_account_last4: string | null;
  tax_id_last4: string | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollRun {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  pay_date: string;
  status: PayrollRunStatus;
  total_gross: number;
  total_net: number;
  total_taxes: number;
  employee_count: number;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollLineItem {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  tenant_id: string;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  other_deductions: number;
  net_pay: number;
  hours_worked: number | null;
  bonus: number;
  reimbursements: number;
  notes: string | null;
  employees?: Employee;
}

export interface PayStub {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  tenant_id: string;
  storage_path: string;
  period_start: string;
  period_end: string;
  pay_date: string;
  gross_pay: number;
  net_pay: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  bag_subscription_id: string;
  bag_payment_link_id: string | null;
  plan: "starter" | "growth" | "enterprise";
  status: SubscriptionStatus;
  current_period_end: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  bag_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

export interface AgentRun {
  id: string;
  tenant_id: string;
  agent: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  tools_called: string[];
  cost_usd: number | null;
  status: "running" | "completed" | "failed";
  approved_by: string | null;
  payroll_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  tenant_id: string;
  agent_run_id: string;
  payroll_run_id: string | null;
  type: "payroll_run" | "anomaly_override" | "compliance_action";
  status: ApprovalStatus;
  summary: string;
  details: Record<string, unknown>;
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  storage_path: string;
  type: "policy" | "pay_stub" | "tax_form" | "other";
  employee_id: string | null;
  embedding_status: "pending" | "processing" | "done" | "failed";
  created_at: string;
}
