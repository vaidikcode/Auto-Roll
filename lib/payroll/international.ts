import type { Employee, PayrollBreakdown } from "@/lib/db/types";

// Transfer fee by corridor (percentage)
const CORRIDOR_FEES: Record<string, number> = {
  "USD-INR": 0.0035,
  "USD-PHP": 0.004,
  "USD-NGN": 0.006,
  "USD-BRL": 0.005,
  "USD-GBP": 0.002,
  "USD-EUR": 0.002,
  "USD-CAD": 0.0025,
  "USD-AUD": 0.003,
  "USD-SGD": 0.003,
  DEFAULT: 0.005,
};

// Compliance limits per country (annual USD equivalent)
export const COUNTRY_LIMITS: Record<string, number> = {
  IN: 250000,
  PH: 50000,
  NG: 100000,
  BR: 300000,
  GB: Infinity,
  DE: Infinity,
  CA: Infinity,
  AU: Infinity,
  SG: Infinity,
};

export interface InternationalPayrollResult {
  gross: number;
  net_usd: number;
  net_local: number;
  fx_rate: number;
  fees: number;
  corridor: string;
  breakdown: PayrollBreakdown;
  compliance_flags: string[];
}

export function calculateInternationalPayroll(
  employee: Employee,
  fxRate: number
): InternationalPayrollResult {
  const gross = employee.base_salary_usd;
  const currency = employee.currency;
  const country = employee.country;
  const corridor = `USD-${currency}`;
  const feeRate = CORRIDOR_FEES[corridor] ?? CORRIDOR_FEES.DEFAULT;

  // International employees: simplified flat withholding (no US state tax)
  // Use a standard 15% flat withholding + FICA exemption for non-residents
  const flatWithholding = gross * 0.15;
  const afterWithholding = gross - flatWithholding;
  const fees = afterWithholding * feeRate;
  const netUsd = afterWithholding - fees;
  const netLocal = netUsd * fxRate;

  const limit = COUNTRY_LIMITS[country] ?? 100000;
  const complianceFlags: string[] = [];
  if (gross > limit * 0.8) {
    complianceFlags.push(`Annual payment approaches ${country} inbound limit (~$${limit.toLocaleString()})`);
  }

  const breakdown: PayrollBreakdown = {
    gross_monthly: gross / 12,
    corridor,
    transfer_fee_pct: feeRate * 100,
    compliance_flags: complianceFlags,
  };

  return {
    gross,
    net_usd: Math.round(netUsd * 100) / 100,
    net_local: Math.round(netLocal * 100) / 100,
    fx_rate: fxRate,
    fees: Math.round(fees * 100) / 100,
    corridor,
    breakdown,
    compliance_flags: complianceFlags,
  };
}
