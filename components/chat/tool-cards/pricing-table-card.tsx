"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { formatCurrency } from "@/lib/utils";
import { Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PricingTable } from "@/lib/db/types";

interface PricingTableCardProps {
  state: ToolState;
  result?: PricingTable;
}

export function PricingTableCard({ state, result }: PricingTableCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  return (
    <ToolCardShell
      title="Pricing"
      icon={<Tag size={14} />}
      state={state}
      summary={result ? `${result.items.length} metered items` : undefined}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-3/4 bg-zinc-100" />
          <Skeleton className="h-3 w-1/2 bg-zinc-100" />
          <Skeleton className="h-20 w-full bg-zinc-100" />
        </div>
      ) : result ? (
        <div className="border-2 border-zinc-900 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-900 text-white">
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-[10px]">Feature</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-[10px]">Description</th>
                <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Unit</th>
                <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Price</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item, i) => (
                <tr key={item.name} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                  <td className="px-3 py-2 font-semibold text-zinc-900 whitespace-nowrap">{item.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{item.description}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500 whitespace-nowrap">{item.unit}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900">{formatCurrency(item.price_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </ToolCardShell>
  );
}
