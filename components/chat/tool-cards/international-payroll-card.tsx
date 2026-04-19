"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { Badge } from "@/components/ui/badge";
import { countryFlag, formatCurrency } from "@/lib/utils";
import { Globe, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InternationalPayrollResult {
  employee_name: string;
  country: string;
  currency: string;
  gross: number;
  net_usd: number;
  net_local: number;
  fx_rate: number;
  fees: number;
  corridor: string;
  compliance_flags: string[];
  breakdown: {
    transfer_fee_pct?: number;
  };
}

interface InternationalPayrollCardProps {
  state: ToolState;
  result?: InternationalPayrollResult;
}

export function InternationalPayrollCard({ state, result }: InternationalPayrollCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  const summary = !isLoading && result
    ? `Payslip ready — ${result.employee_name} · ${countryFlag(result.country)} ${result.country} · net ${formatCurrency(result.net_usd)}`
    : undefined;

  return (
    <ToolCardShell
      title="International Payroll"
      icon={<Globe size={14} />}
      state={state}
      summary={summary}
      statusLabel={isLoading ? "Calculating…" : result?.employee_name}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : result ? (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span>{countryFlag(result.country)}</span>
            <span className="text-sm font-semibold text-zinc-900">{result.employee_name}</span>
            <Badge variant="info" className="ml-auto text-[10px]">{result.corridor}</Badge>
          </div>

          {/* Breakdown */}
          <div className="rounded-lg border border-zinc-100 overflow-hidden">
            <div className="grid grid-cols-2 text-xs">
              <div className="px-3 py-2 border-b border-zinc-100 text-zinc-500">Gross (USD)</div>
              <div className="px-3 py-2 border-b border-zinc-100 text-right font-mono font-medium text-zinc-900">
                {formatCurrency(result.gross)}
              </div>
              <div className="px-3 py-2 border-b border-zinc-100 text-zinc-500">Flat Withholding (15%)</div>
              <div className="px-3 py-2 border-b border-zinc-100 text-right font-mono text-red-600">
                -{formatCurrency(result.gross * 0.15)}
              </div>
              <div className="px-3 py-2 border-b border-zinc-100 text-zinc-500">
                Transfer Fees
                {result.breakdown.transfer_fee_pct != null && (
                  <span className="text-zinc-400 ml-1">
                    ({result.breakdown.transfer_fee_pct.toFixed(2)}%)
                  </span>
                )}
              </div>
              <div className="px-3 py-2 border-b border-zinc-100 text-right font-mono text-red-600">
                -{formatCurrency(result.fees)}
              </div>
              <div className="px-3 py-2 border-b border-zinc-100 text-zinc-500">FX Rate (USD/{result.currency})</div>
              <div className="px-3 py-2 border-b border-zinc-100 text-right font-mono text-zinc-900">
                {result.fx_rate.toFixed(4)}
              </div>
              <div className="px-3 py-2 bg-zinc-900 text-white font-semibold">Net (USD)</div>
              <div className="px-3 py-2 bg-zinc-900 text-right font-mono font-bold text-white">
                {formatCurrency(result.net_usd)}
              </div>
              <div className="px-3 py-2 bg-zinc-800 text-zinc-300">Net ({result.currency})</div>
              <div className="px-3 py-2 bg-zinc-800 text-right font-mono font-bold text-white">
                {result.net_local.toLocaleString("en-US", { maximumFractionDigits: 0 })} {result.currency}
              </div>
            </div>
          </div>

          {/* Compliance flags */}
          {result.compliance_flags.length > 0 && (
            <div className="space-y-1">
              {result.compliance_flags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded bg-yellow-50 border border-yellow-200"
                >
                  <AlertTriangle size={11} className="text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-800">{flag}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </ToolCardShell>
  );
}
