import { Bag } from "@tbagtapp/sdk";

let _bag: Bag | null = null;

export function getBagClient(): Bag {
  if (!_bag) {
    _bag = new Bag({
      apiKey: process.env.BAG_SECRET_KEY!,
      maxRetries: 2,
      timeout: 30_000,
    });
  }
  return _bag;
}

export const BAG_PLANS = {
  starter: {
    name: "Starter",
    priceUsd: 49,
    description: "Up to 10 employees. Core payroll automation.",
    features: [
      "Up to 10 active employees",
      "Bi-weekly payroll runs",
      "AI payroll agent",
      "Pay stub generation",
      "Basic compliance monitoring",
    ],
  },
  growth: {
    name: "Growth",
    priceUsd: 149,
    description: "Up to 50 employees. Full agent suite.",
    features: [
      "Up to 50 active employees",
      "Unlimited payroll runs",
      "Full AI agent suite",
      "Anomaly detection",
      "Employee Q&A assistant",
      "Year-end tax packets",
    ],
  },
  enterprise: {
    name: "Enterprise",
    priceUsd: 499,
    description: "Unlimited employees. Priority support + x402.",
    features: [
      "Unlimited employees",
      "Everything in Growth",
      "Billing reconciliation agent",
      "x402 agentic payroll endpoint",
      "Dedicated support",
      "Custom integrations",
    ],
  },
} as const;

export type PlanKey = keyof typeof BAG_PLANS;
