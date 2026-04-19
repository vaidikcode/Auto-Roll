"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UsageReport } from "@/lib/db/types";

interface UsageReportCardProps {
  state: ToolState;
  result?: UsageReport;
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function UsageReportCard({ state, result }: UsageReportCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  const totalEstimate = result
    ? result.tool_breakdown.reduce((s, r) => s + r.line_total_usd, 0)
    : 0;

  const stats = result
    ? [
        { label: "Payroll Runs",    value: result.run_count,              note: "$2.00/run" },
        { label: "Employees",       value: result.employee_count,         note: "$0.25 each" },
        { label: "Compliance Chks", value: result.compliance_check_count, note: "$0.50 each" },
        { label: "Domestic Calcs",  value: result.domestic_calc_count,    note: "$0.15 each" },
      ]
    : [];

  return (
    <ToolCardShell
      title="Usage Report"
      icon={<BarChart3 size={14} />}
      state={state}
      summary={result ? `${result.run_count} run${result.run_count !== 1 ? "s" : ""} · est. ${formatCurrency(totalEstimate)}` : undefined}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-3/4 bg-zinc-100" />
          <Skeleton className="h-3 w-1/2 bg-zinc-100" />
          <Skeleton className="h-16 w-full bg-zinc-100" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* Period */}
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Period</span>
            <span className="font-mono text-zinc-700">
              {fmt(result.period_start)} – {fmt(result.period_end)}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stats.map(({ label, value, note }) => (
              <div
                key={label}
                className="border-2 border-zinc-900 bg-white p-2.5 shadow-[3px_3px_0_0_#18181b]"
              >
                <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</div>
                <div className="text-xl font-black text-zinc-900 tabular-nums">{value}</div>
                <div className="text-[10px] text-zinc-400">{note}</div>
              </div>
            ))}
          </div>

          {/* Breakdown table */}
          {result.tool_breakdown.length > 0 && (
            <div className="border-2 border-zinc-900 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-900 text-white">
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-[10px]">Item</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Qty</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Unit</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tool_breakdown.map((row, i) => (
                    <tr key={row.tool_name} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                      <td className="px-3 py-2 text-zinc-800">{row.tool_name}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-700">{row.call_count}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-500">{formatCurrency(row.unit_price_usd)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-900">{formatCurrency(row.line_total_usd)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-900 bg-[#e8ff5a]">
                    <td colSpan={3} className="px-3 py-2 font-black text-zinc-900 uppercase tracking-wide text-[10px]">Estimated Total</td>
                    <td className="px-3 py-2 text-right font-black font-mono text-zinc-900">{formatCurrency(totalEstimate)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </ToolCardShell>
  );
}
