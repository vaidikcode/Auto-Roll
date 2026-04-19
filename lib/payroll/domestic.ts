import type { Employee, PayrollBreakdown } from "@/lib/db/types";

// Simplified 2026 federal income tax brackets (MFJ / single approximation)
const FEDERAL_BRACKETS = [
  { limit: 11600, rate: 0.10 },
  { limit: 47150, rate: 0.12 },
  { limit: 100525, rate: 0.22 },
  { limit: 191950, rate: 0.24 },
  { limit: 243725, rate: 0.32 },
  { limit: 609350, rate: 0.35 },
  { limit: Infinity, rate: 0.37 },
];

// State flat rates by state (simplified)
const STATE_RATES: Record<string, number> = {
  CA: 0.093,
  NY: 0.0685,
  TX: 0,
  FL: 0,
  WA: 0,
  IL: 0.0495,
  MA: 0.05,
  CO: 0.044,
  GA: 0.055,
  AZ: 0.025,
  NV: 0,
  OR: 0.099,
  NC: 0.0525,
  VA: 0.0575,
  NJ: 0.0637,
  PA: 0.0307,
  MI: 0.0425,
  OH: 0.04,
  MN: 0.0985,
  MD: 0.0575,
};

// FICA: Social Security + Medicare
const FICA_SS_RATE = 0.062;
const FICA_SS_WAGE_BASE = 176100; // 2026 estimate
const FICA_MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_THRESHOLD = 200000;
const ADDITIONAL_MEDICARE_RATE = 0.009;

// 401k limits 2026
const K401_LIMIT = 23500;
const HEALTHCARE_DEDUCTIONS: Record<string, number> = {
  basic: 150,
  premium: 350,
  none: 0,
};

export function calculateFederalTax(annualGross: number): number {
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of FEDERAL_BRACKETS) {
    if (annualGross <= prev) break;
    const taxable = Math.min(annualGross, limit) - prev;
    tax += taxable * rate;
    prev = limit;
  }
  return tax;
}

export function calculateStateTax(annualGross: number, state?: string): number {
  if (!state) return 0;
  const rate = STATE_RATES[state.toUpperCase()] ?? 0.05;
  return annualGross * rate;
}

export function calculateFICA(annualGross: number): { ss: number; medicare: number } {
  const ss = Math.min(annualGross, FICA_SS_WAGE_BASE) * FICA_SS_RATE;
  let medicare = annualGross * FICA_MEDICARE_RATE;
  if (annualGross > ADDITIONAL_MEDICARE_THRESHOLD) {
    medicare += (annualGross - ADDITIONAL_MEDICARE_THRESHOLD) * ADDITIONAL_MEDICARE_RATE;
  }
  return { ss, medicare };
}

export interface DomesticPayrollResult {
  gross: number;
  federal_tax: number;
  state_tax: number;
  fica: number;
  healthcare: number;
  retirement: number;
  net_usd: number;
  breakdown: PayrollBreakdown;
}

export function calculateDomesticPayroll(employee: Employee): DomesticPayrollResult {
  const gross = employee.base_salary_usd;
  const state = employee.tax_locale.state;
  const healthcarePlan = employee.benefits.healthcare_plan ?? "basic";
  const healthcareMonthly = HEALTHCARE_DEDUCTIONS[healthcarePlan] ?? 150;
  const healthcareAnnual = healthcareMonthly * 12;

  // 401k: employee contributes a percentage up to limit, employer matches up to cap
  const retirementPct = employee.retirement_match_pct / 100;
  const retirementEmployeeContrib = Math.min(gross * retirementPct, K401_LIMIT);
  // Employer match: assume dollar-for-dollar up to 3%
  const employerMatchPct = Math.min(retirementPct, 0.03);
  const employerMatch = gross * employerMatchPct;

  // Taxable gross after pre-tax deductions
  const taxableGross = gross - retirementEmployeeContrib - healthcareAnnual;

  const federalTax = calculateFederalTax(taxableGross);
  const stateTax = calculateStateTax(taxableGross, state);
  const { ss, medicare } = calculateFICA(taxableGross);
  const ficaTotal = ss + medicare;

  const totalDeductions = federalTax + stateTax + ficaTotal + healthcareAnnual + retirementEmployeeContrib;
  const netUsd = Math.max(0, gross - totalDeductions);

  const breakdown: PayrollBreakdown = {
    gross_monthly: gross / 12,
    federal_rate: federalTax / (taxableGross || 1),
    state_rate: STATE_RATES[(state ?? "").toUpperCase()] ?? 0,
    fica_rate: FICA_SS_RATE + FICA_MEDICARE_RATE,
    healthcare_plan: healthcarePlan,
    retirement_employee_pct: retirementPct * 100,
    retirement_employer_match: employerMatch,
  };

  return {
    gross,
    federal_tax: Math.round(federalTax * 100) / 100,
    state_tax: Math.round(stateTax * 100) / 100,
    fica: Math.round(ficaTotal * 100) / 100,
    healthcare: Math.round(healthcareAnnual * 100) / 100,
    retirement: Math.round(retirementEmployeeContrib * 100) / 100,
    net_usd: Math.round(netUsd * 100) / 100,
    breakdown,
  };
}
