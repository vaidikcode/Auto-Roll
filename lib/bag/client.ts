/**
 * Bag payment links — REST client (hosted checkout).
 * @see https://docs.getbags.app/docs/guides/create-payment-link
 *
 * Endpoint: `POST {BAG_API_BASE_URL}/api/payment-links` (Bearer).
 */

/** Use `www` — `https://getbags.app` 301s here and fetch drops `Authorization` on that cross-origin redirect, causing false `AUTH_INVALID_JWT`. */
const DEFAULT_BAG_ORIGIN = "https://www.getbags.app";

export interface BagPaymentLinkParams {
  /** Checkout title (required by Bag). */
  name: string;
  /** Price in USD (major units), per Bag API. */
  amount: number;
  /** ISO currency; defaults to USD. */
  currency?: string;
  description?: string;
  /** Sandbox/production network slug; defaults to `BAG_NETWORK` or `solana_devnet`. */
  network?: string;
  /** Optional multi-chain list; defaults to `BAG_NETWORKS` (comma-separated env). */
  networks?: string[];
  /** HTTPS redirect after payment (Bag field: `targetUrl`). */
  targetUrl?: string;
}

export interface BagPaymentLinkResponse {
  id: string;
  url: string;
  amount?: number;
  currency?: string;
  status?: string;
  created_at?: string;
}

function bagOrigin(): string {
  const raw = process.env.BAG_API_BASE_URL?.trim();
  let origin = raw ? raw.replace(/\/$/, "") : DEFAULT_BAG_ORIGIN;
  // Apex redirects to www; following that redirect strips Bearer (fetch / undici). Always call API on www.
  if (origin === "https://getbags.app" || origin === "http://getbags.app") {
    origin = "https://www.getbags.app";
  }
  return origin;
}

function defaultCheckoutUrl(linkId: string): string {
  return `${bagOrigin()}/pay/${encodeURIComponent(linkId)}`;
}

function envNetworkList(): string[] | undefined {
  const raw = process.env.BAG_NETWORKS?.trim();
  if (!raw) return undefined;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

function resolvePrimaryNetwork(explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  const fromEnv = process.env.BAG_NETWORK?.trim();
  if (fromEnv) return fromEnv;
  const list = envNetworkList();
  if (list?.[0]) return list[0];
  return "solana_devnet";
}

/** Normalize Bag JSON (including `{ data }` and camelCase) into id + hosted URL. */
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
      bag.checkoutUrl ??
      ""
  ).trim();

  if (!id) {
    throw new Error(
      `Bag API returned an unexpected shape (missing id). Raw: ${JSON.stringify(json).slice(0, 600)}`
    );
  }

  const checkout = url || defaultCheckoutUrl(id);

  return {
    id,
    url: checkout,
    amount: typeof bag.amount === "number" ? bag.amount : undefined,
    currency: typeof bag.currency === "string" ? bag.currency : undefined,
    status: typeof bag.status === "string" ? bag.status : undefined,
    created_at:
      typeof bag.created_at === "string"
        ? bag.created_at
        : typeof bag.createdAt === "string"
          ? bag.createdAt
          : undefined,
  };
}

/**
 * Create a hosted payment link. Uses `BAG_API_KEY` (Bearer).
 * Amount is USD major units (e.g. 49.0), matching Bag’s public API.
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

  const amountPayload = Math.round(params.amount * 100) / 100;
  if (!Number.isFinite(amountPayload) || amountPayload <= 0) {
    throw new Error(`Invalid payment amount: ${params.amount}`);
  }

  const origin = bagOrigin();
  const network = resolvePrimaryNetwork(params.network);
  const envNetworks = envNetworkList();
  const networks =
    params.networks ??
    (envNetworks && envNetworks.length > 1 ? envNetworks : undefined);

  const body: Record<string, unknown> = {
    name: params.name,
    amount: amountPayload,
    currency: (params.currency ?? "USD").toUpperCase(),
    network,
    ...(params.description ? { description: params.description } : {}),
    ...(params.targetUrl ? { targetUrl: params.targetUrl } : {}),
    ...(networks && networks.length ? { networks } : {}),
  };

  const useXApiKey = process.env.BAG_AUTH_STYLE?.toLowerCase() === "x-api-key";
  const response = await fetch(`${origin}/api/payment-links`, {
    method: "POST",
    headers: {
      ...(useXApiKey
        ? { "x-api-key": apiKey }
        : { Authorization: `Bearer ${apiKey}` }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
