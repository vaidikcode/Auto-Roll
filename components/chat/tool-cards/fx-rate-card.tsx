"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FxRateResult {
  from: string;
  to: string;
  rate: number;
  source: string;
  timestamp: string;
}

interface FxRateCardProps {
  state: ToolState;
  result?: FxRateResult;
  args?: { target_currency: string };
}

export function FxRateCard({ state, result, args }: FxRateCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  const summary = !isLoading && result
    ? `USD → ${result.to} · ${result.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
    : undefined;

  return (
    <ToolCardShell
      title="FX Rate"
      icon={<TrendingUp size={14} />}
      state={state}
      summary={summary}
      statusLabel={
        isLoading
          ? `Fetching USD → ${args?.target_currency ?? "..."}`
          : `USD → ${result?.to}`
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-20" />
        </div>
      ) : result ? (
        <div className="flex items-center gap-4 py-1">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-zinc-900">1</div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{result.from}</div>
          </div>
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 h-[1px] bg-zinc-200" />
            <TrendingUp size={12} className="text-zinc-400" />
            <div className="flex-1 h-[1px] bg-zinc-200" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-zinc-900">
              {result.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{result.to}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-zinc-400">{result.source}</div>
            <div className="text-[10px] text-zinc-400">
              {new Date(result.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ) : null}
    </ToolCardShell>
  );
}
