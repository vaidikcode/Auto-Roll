import { tool } from "ai";
import { z } from "zod";

interface TaxBreakdown {
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  totalTaxes: number;
  netPay: number;
}

export function calculateGrossToNet(
  grossPay: number,
  jurisdiction: { country: string; state?: string | null },
  classification: "employee" | "contractor"
): TaxBreakdown {
  if (classification === "contractor") {
    const selfEmploymentTax = grossPay * 0.153;
    const federalTax = grossPay * 0.22;
    const stateTax = grossPay * (jurisdiction.state ? 0.06 : 0);
    const totalTaxes = selfEmploymentTax + federalTax + stateTax;
    return {
      federalTax,
      stateTax,
      socialSecurity: selfEmploymentTax * 0.5,
      medicare: selfEmploymentTax * 0.5,
      totalTaxes,
      netPay: grossPay - totalTaxes,
    };
  }

  const federalTax = grossPay * 0.22;
  const stateTax = grossPay * (jurisdiction.state ? 0.055 : 0);
  const socialSecurity = Math.min(grossPay * 0.062, 9932.4 / 12);
  const medicare = grossPay * 0.0145;
  const totalTaxes = federalTax + stateTax + socialSecurity + medicare;

  return {
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    totalTaxes,
    netPay: grossPay - totalTaxes,
  };
}

const computePayrollTotalsSchema = z.object({
  employee_id: z.string(),
  annual_salary: z.number().describe("Annual base salary in USD"),
  classification: z.enum(["employee", "contractor"]),
  jurisdiction_country: z.string(),
  jurisdiction_state: z.string().optional(),
  bonus: z.number().default(0).describe("One-time bonus in USD"),
  reimbursements: z.number().default(0).describe("Expense reimbursements (tax-free)"),
  hours_worked: z.number().optional().describe("For hourly employees only"),
  hourly_rate: z.number().optional(),
  pay_period_divisor: z
    .number()
    .default(24)
    .describe("How many pay periods per year (24 = semi-monthly, 26 = bi-weekly)"),
});

const detectAnomalySchema = z.object({
  current_total: z.number(),
  prior_total: z.number(),
  threshold_pct: z.number().default(15).describe("Percentage deviation threshold"),
});

type ComputePayrollInput = z.infer<typeof computePayrollTotalsSchema>;
type DetectAnomalyInput = z.infer<typeof detectAnomalySchema>;

export const calcTools = {
  computePayrollTotals: tool({
    description:
      "Compute gross-to-net payroll calculations for an employee given their comp and jurisdiction. Returns tax breakdown and net pay.",
    inputSchema: computePayrollTotalsSchema,
    execute: async ({
      employee_id,
      annual_salary,
      classification,
      jurisdiction_country,
      jurisdiction_state,
      bonus,
      reimbursements,
      hours_worked,
      hourly_rate,
      pay_period_divisor,
    }: ComputePayrollInput) => {
      let basePay: number;
      if (hours_worked && hourly_rate) {
        basePay = hours_worked * hourly_rate;
      } else {
        basePay = annual_salary / pay_period_divisor;
      }

      const grossPay = basePay + bonus;
      const breakdown = calculateGrossToNet(
        grossPay,
        { country: jurisdiction_country, state: jurisdiction_state },
        classification
      );

      return {
        employee_id,
        gross_pay: grossPay,
        bonus,
        reimbursements,
        ...breakdown,
        net_pay_with_reimbursements: breakdown.netPay + reimbursements,
        hours_worked: hours_worked ?? null,
      };
    },
  }),

  detectAnomaly: tool({
    description:
      "Compare current payroll totals to prior cycle. Returns anomaly flag if deviation exceeds threshold.",
    inputSchema: detectAnomalySchema,
    execute: async ({ current_total, prior_total, threshold_pct }: DetectAnomalyInput) => {
      if (prior_total === 0)
        return { anomaly: false, deviation_pct: 0, message: "No prior run to compare" };
      const deviation = Math.abs((current_total - prior_total) / prior_total) * 100;
      const anomaly = deviation > threshold_pct;
      return {
        anomaly,
        deviation_pct: Math.round(deviation * 10) / 10,
        direction: current_total > prior_total ? "increase" : "decrease",
        message: anomaly
          ? `Payroll ${current_total > prior_total ? "increased" : "decreased"} by ${Math.round(deviation)}% — exceeds ${threshold_pct}% threshold. Human approval required.`
          : `Within normal range (${Math.round(deviation)}% deviation).`,
      };
    },
  }),
};
