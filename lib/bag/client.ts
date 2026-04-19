const BAG_BASE_URL = "https://api.getbags.app";

export interface BagPaymentLinkParams {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  redirect_url?: string;
  description?: string;
}

export interface BagPaymentLinkResponse {
  id: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export async function createBagPaymentLink(
  params: BagPaymentLinkParams
): Promise<BagPaymentLinkResponse> {
  const apiKey = process.env.BAG_API_KEY;
  if (!apiKey) throw new Error("BAG_API_KEY not configured");

  const response = await fetch(`${BAG_BASE_URL}/v1/payment-links`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100), // Bag uses cents
      currency: params.currency.toLowerCase(),
      metadata: params.metadata ?? {},
      redirect_url: params.redirect_url,
      description: params.description,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bag API error ${response.status}: ${body}`);
  }

  return response.json();
}
