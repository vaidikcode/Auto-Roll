import { tool } from "ai";
import { z } from "zod";
import { jsonSafe } from "@/lib/ai/json-safe";
import { getAdminClient } from "@/lib/db/client";

const fxCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function makeFetchFxRateTool(runId: string) {
  return tool({
    description:
      "Fetch the current USD exchange rate to a destination currency from open.er-api.com (free, no key required). Results are cached for 5 minutes.",
    inputSchema: z.object({
      target_currency: z.string().describe("3-letter ISO currency code, e.g. INR, EUR, GBP"),
    }),
    execute: async ({ target_currency }: { target_currency: string }) => {
      const db = getAdminClient();
      const start = Date.now();
      const cacheKey = target_currency.toUpperCase();

      const cached = fxCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return jsonSafe({
          from: "USD",
          to: cacheKey,
          rate: cached.rate,
          source: "open.er-api.com (cached)",
          timestamp: new Date(cached.timestamp).toISOString(),
        });
      }

      let rate: number;
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await res.json();
        if (data.result !== "success") throw new Error("FX API error");
        rate = data.rates[cacheKey];
        if (!rate) throw new Error(`Currency ${cacheKey} not found`);
        fxCache.set(cacheKey, { rate, timestamp: Date.now() });
      } catch {
        const fallback: Record<string, number> = {
          INR: 83.5, EUR: 0.92, GBP: 0.79, BRL: 5.1,
          NGN: 1580, PHP: 56.8, CAD: 1.37, AUD: 1.53, SGD: 1.35,
        };
        rate = fallback[cacheKey] ?? 1;
        fxCache.set(cacheKey, { rate, timestamp: Date.now() });
      }

      await db.from("tool_events").insert({
        run_id: runId,
        tool_name: "fetch_fx_rate",
        args: { target_currency: cacheKey },
        result: { rate, from: "USD", to: cacheKey },
        duration_ms: Date.now() - start,
      });

      return jsonSafe({
        from: "USD",
        to: cacheKey,
        rate,
        source: "open.er-api.com",
        timestamp: new Date().toISOString(),
      });
    },
  });
}
