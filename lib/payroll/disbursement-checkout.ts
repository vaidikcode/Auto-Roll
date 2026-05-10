import { CONSTANT_DISBURSEMENT_URL } from "@/lib/bag/mock-payment-link";
import type { PaymentLink } from "@/lib/db/types";
import { defaultAppOrigin, resolveAppOrigin } from "@/lib/payroll/app-origin";

/** Disbursement line item amount shown in the ledger (USD). */
export const DISBURSEMENT_CHECKOUT_USD = 2;

export function disbursementCheckoutPath(paymentLinkId: string): string {
  return `/disburse/${paymentLinkId}`;
}

export function disbursementCheckoutUrl(
  appOrigin: string | undefined,
  paymentLinkId: string
): string {
  const origin = resolveAppOrigin(appOrigin) ?? defaultAppOrigin();
  return `${origin}${disbursementCheckoutPath(paymentLinkId)}`;
}

function bagCheckoutUrlFromStored(stored: string | null): string {
  if (stored?.includes("getbags.app")) return stored;
  return CONSTANT_DISBURSEMENT_URL;
}

/**
 * Snapshot shape: `url` = Bag pay link (Open); `verify_url` = in-app confirmation after Bag.
 */
export function normalizePaymentLinksForSnapshot(
  links: PaymentLink[],
  appOrigin?: string
): PaymentLink[] {
  return links.map((pl) => ({
    ...pl,
    url: bagCheckoutUrlFromStored(pl.url),
    verify_url: disbursementCheckoutUrl(appOrigin, pl.id),
    amount: DISBURSEMENT_CHECKOUT_USD,
  }));
}
