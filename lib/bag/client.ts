/**
 * Bag V1 Checkout — REST client.
 * @see https://docs.getbags.app/docs/getting-started/sample-integration
 *
 * Endpoint: POST https://getbags.app/api/v1/checkout (Bearer auth)
 * Body: { name, amount, network }
 * Response: { status: "success", data: { id, url, ... } }
 */

const DEFAULT_BAG_ORIGIN = "https://getbags.app";

export interface BagCheckout {
  id: string;
  url: string;
}

function bagOrigin(): string {
  const raw = process.env.BAG_API_BASE_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : DEFAULT_BAG_ORIGIN;
}

function resolveNetwork(explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  return process.env.BAG_NETWORK?.trim() ?? "base_sepolia";
}

/**
 * Create a V1 checkout session. Uses `BAG_API_KEY` (Bearer).
 * Amount is USD major units (e.g. 49.0).
 */
export async function createBagCheckout(params: {
  name: string;
  amount: number;
  network?: string;
}): Promise<BagCheckout> {
  const apiKey = process.env.BAG_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "BAG_API_KEY is not set. Leave BAG_USE_REAL unset (or 0) to use demo links, or set BAG_USE_REAL=1 with a valid key."
    );
  }

  const amount = Math.round(params.amount * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid payment amount: ${params.amount}`);
  }

  const network = resolveNetwork(params.network);
  const origin = bagOrigin();

  const res = await fetch(`${origin}/api/v1/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: params.name, amount, network }),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Bag API returned non-JSON (${res.status}): ${text.slice(0, 400)}`);
  }

  if (!res.ok) {
    const msg = (json as Record<string, unknown>)?.message ?? text.slice(0, 800);
    throw new Error(`Bag API error ${res.status}: ${msg}`);
  }

  const data = (json as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const id = String(data?.id ?? "").trim();
  const url = String(data?.url ?? "").trim();

  if (!id) {
    throw new Error(
      `Bag API returned unexpected shape (missing data.id). Raw: ${text.slice(0, 600)}`
    );
  }

  return { id, url: url || `${origin}/pay/${encodeURIComponent(id)}` };
}
