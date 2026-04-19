export const PRICING = {
  per_run:           2.00,
  per_employee:      0.25,
  per_compliance:    0.50,
  per_domestic_calc: 0.15,
} as const;

export const PRICING_TABLE_ROWS: Array<{
  name: string;
  description: string;
  unit: string;
  price_usd: number;
}> = [
  { name: "Payroll Run",          description: "Each initiated payroll cycle",          unit: "per run",      price_usd: PRICING.per_run },
  { name: "Employee Processed",   description: "Each employee calculated",              unit: "per employee", price_usd: PRICING.per_employee },
  { name: "Compliance Check",     description: "Cross-border Tavily compliance search", unit: "per check",    price_usd: PRICING.per_compliance },
  { name: "Domestic Calculation", description: "US gross-to-net payroll calculation",   unit: "per employee", price_usd: PRICING.per_domestic_calc },
];
