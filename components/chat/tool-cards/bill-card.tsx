"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { formatCurrency } from "@/lib/utils";
import { Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { BillResult } from "@/lib/db/types";

interface BillCardProps {
  state: ToolState;
  result?: BillResult;
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function fmtTs(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function BillCard({ state, result }: BillCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  return (
    <ToolCardShell
      title="Invoice"
      icon={<Receipt size={14} />}
      state={state}
      summary={result ? `Total due ${formatCurrency(result.total_usd)}` : undefined}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-3/4 bg-zinc-100" />
          <Skeleton className="h-3 w-1/2 bg-zinc-100" />
          <Skeleton className="h-24 w-full bg-zinc-100" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Bill To</div>
              <div className="text-sm font-black text-zinc-900 font-mono">{result.company_id}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Period</div>
              <div className="text-xs font-mono text-zinc-700">
                {fmt(result.period_start)} – {fmt(result.period_end)}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="border-2 border-zinc-900 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-900 text-white">
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-[10px]">Description</th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Qty</th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Unit</th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {result.line_items.map((item, i) => (
                  <tr key={item.description} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                    <td className="px-3 py-2 text-zinc-800">{item.description}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-700">{item.quantity}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">{formatCurrency(item.unit_price_usd)}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-900">{formatCurrency(item.subtotal_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-2 border-zinc-900 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-white border-b border-zinc-200">
              <span className="text-xs font-semibold text-zinc-700">Subtotal</span>
              <span className="text-sm font-mono text-zinc-900">{formatCurrency(result.subtotal_usd)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2 bg-zinc-50 border-b border-zinc-200">
              <span className="text-xs text-zinc-500">Tax</span>
              <span className="text-xs font-mono text-zinc-400">{formatCurrency(result.tax_usd)} — no tax applied</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-[#e8ff5a]">
              <span className="text-sm font-black uppercase tracking-wide text-zinc-900">Total Due</span>
              <span className="text-lg font-black font-mono text-zinc-900">{formatCurrency(result.total_usd)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-[10px] font-mono text-zinc-400 text-right">
            Generated {fmtTs(result.generated_at)}
          </div>
        </div>
      ) : null}
    </ToolCardShell>
  );
}
