"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { Badge } from "@/components/ui/badge";
import { countryFlag, formatCurrency } from "@/lib/utils";
import { Database, FileText, Users } from "lucide-react";
import type { Employee } from "@/lib/db/types";
import { Skeleton } from "@/components/ui/skeleton";

const SOURCES = [
  { name: "Rippling", icon: "⚙️" },
  { name: "Gusto", icon: "📋" },
  { name: "Deel", icon: "🌍" },
  { name: "PDF — Q2 Offer Letters.pdf", icon: "📄" },
];

interface CollectEmployeesCardProps {
  state: ToolState;
  result?: {
    employees: Employee[];
    sources_checked: string[];
    domestic_count: number;
    international_count: number;
  };
}

export function CollectEmployeesCard({ state, result }: CollectEmployeesCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  return (
    <ToolCardShell
      title="Collect Employees"
      icon={<Users size={14} />}
      state={state}
      statusLabel={
        isLoading
          ? "Fetching roster…"
          : result?.employees?.length
            ? `${result.employees.length} employees`
            : "Complete"
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">Connecting to HR platforms…</p>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 bg-zinc-50"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <span className="text-[11px] pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-xs text-zinc-600">{s.icon} {s.name}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </div>
      ) : result && result.employees?.length ? (
        <div className="space-y-3">
          {/* Source chips */}
          <div className="flex flex-wrap gap-1.5">
            {result.sources_checked.map((src) => {
              const s = SOURCES.find((x) => x.name === src);
              const isPdf = src.includes("PDF");
              return (
                <Badge key={src} variant="default" className="gap-1">
                  {isPdf ? <FileText size={10} /> : <Database size={10} />}
                  {src}
                </Badge>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex gap-3 text-xs text-zinc-500">
            <span className="font-medium text-zinc-900">{result.employees.length}</span> total ·
            <span className="font-medium text-zinc-900">{result.domestic_count}</span> domestic ·
            <span className="font-medium text-zinc-900">{result.international_count}</span> international
          </div>

          {/* Employee table */}
          <div className="rounded-lg border border-zinc-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="text-left px-3 py-2 font-medium text-zinc-500">Employee</th>
                  <th className="text-left px-3 py-2 font-medium text-zinc-500">Location</th>
                  <th className="text-right px-3 py-2 font-medium text-zinc-500">Annual Base</th>
                  <th className="text-left px-3 py-2 font-medium text-zinc-500">Source</th>
                </tr>
              </thead>
              <tbody>
                {result.employees.map((emp, i) => (
                  <tr
                    key={emp.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-zinc-900">{emp.name}</div>
                      <div className="text-zinc-400 text-[10px]">{emp.email}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1">
                        {countryFlag(emp.country)} {emp.country}
                        {emp.tax_locale?.state && (
                          <span className="text-zinc-400">· {emp.tax_locale.state}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-zinc-900">
                      {formatCurrency(emp.base_salary_usd)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={emp.source.includes("PDF") ? "info" : "default"} className="text-[10px]">
                        {emp.source.includes("PDF") ? <FileText size={9} /> : <Database size={9} />}
                        {emp.source.replace("PDF — ", "").replace(".pdf", "")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !isLoading ? (
        <p className="text-xs text-zinc-500">
          Collection finished — roster details are in the Run Inspector if they did not stream here.
        </p>
      ) : null}
    </ToolCardShell>
  );
}
