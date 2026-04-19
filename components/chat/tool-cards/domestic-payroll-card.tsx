"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { formatCurrency } from "@/lib/utils";
import { Calculator } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DomesticPayrollResult {
  employee_name: string;
  gross: number;
  federal_tax: number;
  state_tax: number;
  fica: number;
  healthcare: number;
  retirement: number;
  net_usd: number;
  breakdown: {
    state_rate?: number;
    healthcare_plan?: string;
    retirement_employee_pct?: number;
    retirement_employer_match?: number;
    gross_monthly?: number;
  };
}

interface DomesticPayrollCardProps {
  state: ToolState;
  result?: DomesticPayrollResult;
  args?: { employee_id: string };
}

function Row({
  label,
  value,
  sub,
  highlight,
  net,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
  net?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 px-3 ${
        net
          ? "bg-zinc-900 text-white rounded-lg mt-1"
          : highlight
          ? "bg-zinc-50 rounded"
          : ""
      }`}
    >
      <div>
        <span className={`text-xs ${net ? "font-semibold text-white" : "text-zinc-700"}`}>
          {label}
        </span>
        {sub && <span className="text-[10px] text-zinc-400 ml-1.5">{sub}</span>}
      </div>
      <span
        className={`text-xs font-mono font-medium ${
          net ? "text-white" : value < 0 ? "text-red-600" : "text-zinc-900"
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export function DomesticPayrollCard({ state, result }: DomesticPayrollCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  return (
    <ToolCardShell
      title="Domestic Payroll"
      icon={<Calculator size={14} />}
      state={state}
      statusLabel={isLoading ? "Calculating…" : result?.employee_name}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : result ? (
        <div className="space-y-0.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 mb-2">
            {result.employee_name} · Annual
          </div>
          <Row label="Gross Salary" value={result.gross} />
          <div className="border-t border-zinc-100 my-1" />
          <Row
            label="Federal Income Tax"
            value={-result.federal_tax}
            sub={`${((result.federal_tax / result.gross) * 100).toFixed(1)}% eff. rate`}
          />
          <Row
            label="State Tax"
            value={-result.state_tax}
            sub={result.breakdown.state_rate != null
              ? `${(result.breakdown.state_rate * 100).toFixed(1)}% flat`
              : undefined}
          />
          <Row label="FICA (SS + Medicare)" value={-result.fica} sub="7.65% employee share" />
          <Row
            label="Healthcare Premium"
            value={-result.healthcare}
            sub={result.breakdown.healthcare_plan ?? undefined}
          />
          <Row
            label="401(k) Employee Contribution"
            value={-result.retirement}
            sub={result.breakdown.retirement_employee_pct != null
              ? `${result.breakdown.retirement_employee_pct}% of gross`
              : undefined}
          />
          {result.breakdown.retirement_employer_match != null &&
            result.breakdown.retirement_employer_match > 0 && (
              <div className="flex items-center justify-between py-1 px-3">
                <span className="text-[10px] text-green-600">
                  + Employer 401(k) Match
                </span>
                <span className="text-[10px] font-mono text-green-600">
                  +{formatCurrency(result.breakdown.retirement_employer_match)}
                </span>
              </div>
            )}
          <div className="border-t border-zinc-200 my-1" />
          <Row label="Net Take-Home" value={result.net_usd} net />
          <div className="text-[10px] text-zinc-400 px-3 mt-1">
            Monthly: {formatCurrency(result.net_usd / 12)} · Bi-weekly: {formatCurrency(result.net_usd / 26)}
          </div>
        </div>
      ) : null}
    </ToolCardShell>
  );
}
