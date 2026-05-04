import { tool } from "ai";
import { z } from "zod";
import { getAdminClient } from "@/lib/db/client";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import type { Employee } from "@/lib/db/types";

const MOCK_EMPLOYEES: Omit<Employee, "id" | "run_id" | "created_at">[] = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@acme.com",
    country: "US",
    currency: "USD",
    base_salary_usd: 145000,
    employment_type: "domestic",
    tax_locale: { state: "CA", federal_filing_status: "single" },
    dependents: 1,
    benefits: { healthcare_plan: "premium", healthcare_monthly_deduction: 350 },
    retirement_match_pct: 6,
    payout_destination: { type: "ach", bank_name: "Chase", last4: "4821", routing: "021000021" },
    source: "Rippling",
    metadata: { department: "Engineering", title: "Staff Engineer", hire_date: "2021-03-15" },
  },
  {
    name: "Marcus Thompson",
    email: "marcus.t@acme.com",
    country: "US",
    currency: "USD",
    base_salary_usd: 120000,
    employment_type: "domestic",
    tax_locale: { state: "TX", federal_filing_status: "married_joint" },
    dependents: 2,
    benefits: { healthcare_plan: "basic", healthcare_monthly_deduction: 150 },
    retirement_match_pct: 4,
    payout_destination: { type: "ach", bank_name: "Wells Fargo", last4: "7733", routing: "121000248" },
    source: "Gusto",
    metadata: { department: "Sales", title: "Senior Account Executive", hire_date: "2022-07-01" },
  },
  {
    name: "Priya Sharma",
    email: "p.sharma@acme.com",
    country: "IN",
    currency: "INR",
    base_salary_usd: 72000,
    employment_type: "international",
    tax_locale: {},
    dependents: 0,
    benefits: { healthcare_plan: "none" },
    retirement_match_pct: 0,
    payout_destination: { type: "wire", bank_name: "HDFC Bank", last4: "9901" },
    source: "Deel",
    metadata: { department: "Engineering", title: "Senior Backend Engineer", hire_date: "2023-01-10" },
  },
  {
    name: "Felix Wagner",
    email: "felix.w@acme.com",
    country: "DE",
    currency: "EUR",
    base_salary_usd: 95000,
    employment_type: "international",
    tax_locale: {},
    dependents: 1,
    benefits: { healthcare_plan: "none" },
    retirement_match_pct: 0,
    payout_destination: { type: "wire", bank_name: "Deutsche Bank", last4: "5522" },
    source: "Deel",
    metadata: { department: "Product", title: "Product Manager", hire_date: "2022-11-20" },
  },
  {
    name: "Ana Oliveira",
    email: "ana.oliveira@acme.com",
    country: "BR",
    currency: "BRL",
    base_salary_usd: 58000,
    employment_type: "international",
    tax_locale: {},
    dependents: 0,
    benefits: { healthcare_plan: "none" },
    retirement_match_pct: 0,
    payout_destination: { type: "wire", bank_name: "Bradesco", last4: "3310" },
    source: "PDF — Q2 Offer Letters.pdf",
    metadata: { department: "Design", title: "UX Designer", hire_date: "2023-06-05" },
  },
  {
    name: "James Okafor",
    email: "j.okafor@acme.com",
    country: "NG",
    currency: "NGN",
    base_salary_usd: 48000,
    employment_type: "international",
    tax_locale: {},
    dependents: 3,
    benefits: { healthcare_plan: "none" },
    retirement_match_pct: 0,
    payout_destination: { type: "wire", bank_name: "Access Bank", last4: "6640" },
    source: "Rippling",
    metadata: { department: "Engineering", title: "Frontend Developer", hire_date: "2023-09-12" },
  },
  {
    name: "Emily Park",
    email: "emily.park@acme.com",
    country: "US",
    currency: "USD",
    base_salary_usd: 165000,
    employment_type: "domestic",
    tax_locale: { state: "NY", federal_filing_status: "single" },
    dependents: 0,
    benefits: { healthcare_plan: "premium", healthcare_monthly_deduction: 350 },
    retirement_match_pct: 8,
    payout_destination: { type: "ach", bank_name: "Citi", last4: "1192", routing: "021000089" },
    source: "Gusto",
    metadata: { department: "Engineering", title: "Engineering Manager", hire_date: "2020-08-22" },
  },
  {
    name: "Liam O'Brien",
    email: "liam.obrien@acme.com",
    country: "GB",
    currency: "GBP",
    base_salary_usd: 88000,
    employment_type: "international",
    tax_locale: {},
    dependents: 2,
    benefits: { healthcare_plan: "none" },
    retirement_match_pct: 0,
    payout_destination: { type: "wire", bank_name: "Barclays", last4: "8843" },
    source: "PDF — Q2 Offer Letters.pdf",
    metadata: { department: "Sales", title: "Regional Director EMEA", hire_date: "2021-05-17" },
  },
  {
    name: "Test Contractor",
    email: "test.contractor@acme.com",
    country: "US",
    currency: "USD",
    base_salary_usd: 3,
    employment_type: "domestic",
    tax_locale: { state: "WY", state_tax_rate: 0, federal_filing_status: "single" },
    dependents: 0,
    benefits: { healthcare_plan: "none" },
    retirement_match_pct: 0,
    payout_destination: { type: "crypto", wallet: "0xTestWallet000000000000000000000000000000" },
    source: "Manual",
    metadata: { department: "QA", title: "Test Contractor", hire_date: "2026-01-01" },
  },
];

export function makeCollectEmployeesTool(runId: string) {
  return tool({
    description:
      "Collect all employees from connected HR platforms (Rippling, Gusto, Deel) and parse any pending offer letter PDFs. Returns the full employee roster for this payroll run.",
    inputSchema: z.object({}),
    execute: async () => {
      await agentProcessingDelay();
      const db = getAdminClient();
      const start = Date.now();

      // Check if employees were already uploaded for this run (via CSV/Excel import)
      const { data: existing } = await db
        .from("employees")
        .select("*")
        .eq("run_id", runId);

      let employees: Employee[];

      if (existing && existing.length > 0) {
        // Use the uploaded / previously collected employees — do NOT overwrite them
        employees = existing as Employee[];
      } else {
        // No uploaded data — insert demo roster so the agent can still run
        const { data: inserted, error } = await db
          .from("employees")
          .insert(MOCK_EMPLOYEES.map((e) => ({ ...e, run_id: runId })))
          .select();
        if (error) throw new Error(`Failed to insert employees: ${error.message}`);
        employees = (inserted ?? []) as Employee[];
      }

      const sources = existing && existing.length > 0
        ? [...new Set(employees.map((e) => e.source).filter(Boolean))]
        : ["Rippling", "Gusto", "Deel", "PDF — Q2 Offer Letters.pdf"];

      await db.from("tool_events").insert({
        run_id: runId,
        tool_name: "collect_employees",
        args: {},
        result: { count: employees.length },
        duration_ms: Date.now() - start,
      });

      await db
        .from("payroll_runs")
        .update({ status: "calculating" })
        .eq("id", runId);

      const domestic_count = employees.filter((e) => e.employment_type === "domestic").length;
      const international_count = employees.filter((e) => e.employment_type === "international").length;

      return jsonSafe({
        employees,
        sources_checked: sources,
        domestic_count,
        international_count,
      });
    },
  });
}
