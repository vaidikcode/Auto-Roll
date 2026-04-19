/**
 * Bag payment links — REST client.
 * @see https://docs.getbags.app/docs — use dashboard keys; set {@link BAG_API_BASE_URL} for sandbox if your project uses a separate host.
 */

const DEFAULT_BAG_BASE = "https://api.getbags.app";

export interface BagPaymentLinkParams {
  amount: number;
  /** ISO currency code, e.g. "usd" */
  currency: string;
  metadata?: Record<string, string>;
  redirect_url?: string;
  description?: string;
}

export interface BagPaymentLinkResponse {
  id: string;
  url: string;
  amount?: number;
  currency?: string;
  status?: string;
  created_at?: string;
}

function bagBaseUrl(): string {
  const raw = process.env.BAG_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_BAG_BASE;
}

/** Normalize Bag / MoR JSON variants into id + hosted URL. */
export function parseBagPaymentLinkResponse(json: unknown): BagPaymentLinkResponse {
  const j = json as Record<string, unknown>;
  const nested = (j.data ?? j.payment_link ?? j.result) as Record<string, unknown> | undefined;
  const bag = { ...j, ...(nested && typeof nested === "object" ? nested : {}) } as Record<
    string,
    unknown
  >;

  const id = String(
    bag.id ?? bag.payment_link_id ?? bag.link_id ?? bag.payment_id ?? ""
  ).trim();
  const url = String(
    bag.url ??
      bag.checkout_url ??
      bag.hosted_url ??
      bag.payment_url ??
      bag.link ??
      ""
  ).trim();

  if (!id || !url) {
    throw new Error(
      `Bag API returned an unexpected shape (missing id/url). Raw: ${JSON.stringify(json).slice(0, 600)}`
    );
  }

  return {
    id,
    url,
    amount: typeof bag.amount === "number" ? bag.amount : undefined,
    currency: typeof bag.currency === "string" ? bag.currency : undefined,
    status: typeof bag.status === "string" ? bag.status : undefined,
    created_at: typeof bag.created_at === "string" ? bag.created_at : undefined,
  };
}

/**
 * Create a hosted payment link. Uses `BAG_API_KEY` (Bearer).
 * Amount is sent in the smallest currency unit (e.g. USD cents), which is typical for payment APIs.
 */
export async function createBagPaymentLink(
  params: BagPaymentLinkParams
): Promise<BagPaymentLinkResponse> {
  const apiKey = process.env.BAG_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "BAG_API_KEY is not set. Leave BAG_USE_REAL unset (or 0) to use demo links, or set BAG_USE_REAL=1 with a valid key."
    );
  }

  /** Default `cents` (smallest currency unit). Set `BAG_AMOUNT_UNIT=dollars` if your Bag project expects decimal major units. */
  const unit = process.env.BAG_AMOUNT_UNIT?.toLowerCase() === "dollars" ? "dollars" : "cents";
  const amountPayload: number =
    unit === "dollars" ? Math.round(params.amount * 100) / 100 : Math.round(params.amount * 100);
  if (!Number.isFinite(amountPayload) || amountPayload <= 0) {
    throw new Error(`Invalid payment amount: ${params.amount}`);
  }

  const base = bagBaseUrl();
  const useXApiKey = process.env.BAG_AUTH_STYLE?.toLowerCase() === "x-api-key";
  const response = await fetch(`${base}/v1/payment-links`, {
    method: "POST",
    headers: {
      ...(useXApiKey
        ? { "x-api-key": apiKey }
        : { Authorization: `Bearer ${apiKey}` }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPayload,
      currency: params.currency.toLowerCase(),
      metadata: params.metadata ?? {},
      redirect_url: params.redirect_url,
      description: params.description,
    }),
  });

  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Bag API returned non-JSON (${response.status}): ${text.slice(0, 400)}`);
  }

  if (!response.ok) {
    throw new Error(`Bag API error ${response.status}: ${text.slice(0, 800)}`);
  }

  return parseBagPaymentLinkResponse(json);
}
