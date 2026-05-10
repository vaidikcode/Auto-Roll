import type { PaymentLink } from "@/lib/db/types";
import { defaultAppOrigin, resolveAppOrigin } from "@/lib/payroll/app-origin";

/** Demo disbursement amount shown on every payment link (USD). */
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

/** Rewrites stored rows so the UI always shows the in-app $2 checkout URL. */
export function normalizePaymentLinksForSnapshot(
  links: PaymentLink[],
  appOrigin?: string
): PaymentLink[] {
  return links.map((pl) => ({
    ...pl,
    url: disbursementCheckoutUrl(appOrigin, pl.id),
    amount: DISBURSEMENT_CHECKOUT_USD,
  }));
}
