import { getBagClient, BAG_PLANS, type PlanKey } from "./client";

export async function createSubscriptionPaymentLink(
  plan: PlanKey,
  network: "base" | "base_sepolia" = "base_sepolia"
) {
  const bag = getBagClient();
  const planConfig = BAG_PLANS[plan];

  const link = await bag.paymentLinks.create({
    name: `Auto-Roll ${planConfig.name}`,
    amount: planConfig.priceUsd,
    network,
    description: planConfig.description,
  });

  return link;
}

export function getCheckoutUrl(paymentLinkId: string): string {
  return `https://getbags.app/pay/${paymentLinkId}`;
}
