"use client";

import Link from "next/link";
import { usePayrollRun } from "@/components/payroll/payroll-run-context";
import { formatCurrency, countryFlag } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Link2 } from "lucide-react";

export function RosterTab() {
  const { runId, snapshot, loading, selectionMode, selectedIds, toggleEmployee } = usePayrollRun();
  const employees = snapshot?.employees ?? [];

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <header className="mb-8 border-b-2 border-zinc-300 pb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">People</p>
        <h2 className="ar-font-display text-3xl font-black text-zinc-900 mt-1">Roster</h2>
        <p className="text-sm text-zinc-600 mt-2 max-w-xl leading-relaxed">
          Open a row for rails, compliance, and payslip PDFs.
        </p>
      </header>

      {loading && !snapshot ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-none bg-zinc-200 border-2 border-zinc-300" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-400 bg-white px-6 py-14 text-center text-sm text-zinc-600 shadow-[4px_4px_0_0_#18181b]">
          No roster yet. Use <strong className="text-zinc-900">Add people</strong> or{" "}
          <strong className="text-emerald-800">Run payout</strong> from the bar above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {employees.map((emp) => {
            const item = snapshot?.payroll_items.find((i) => i.employee_id === emp.id);
            const link = snapshot?.payment_links.find((l) => l.employee_id === emp.id);
            const compliance = snapshot?.compliance_reports.find((c) => c.employee_id === emp.id);
            const showCheck = selectionMode === "subset";
            const checked = selectedIds.includes(emp.id);
            return (
              <div
                key={emp.id}
                className="group relative border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#18181b] hover:bg-zinc-50 transition-colors"
              >
                {showCheck && (
                  <div className="absolute left-3 top-3 z-[1]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEmployee(emp.id)}
                      className="rounded-none border-2 border-zinc-500 accent-[#e8ff5a] h-4 w-4"
                      aria-label={`Include ${emp.name} in scope`}
                    />
                  </div>
                )}
                <Link
                  href={`/payroll/${runId}/people/${emp.id}`}
                  className={`block p-5 ${showCheck ? "pl-12" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{countryFlag(emp.country)}</span>
                      <div className="min-w-0">
                        <div className="font-black text-zinc-900 truncate group-hover:text-emerald-900 transition-colors">
                          {emp.name}
                        </div>
                        <div className="text-xs text-zinc-600 mt-0.5 font-medium">
                          {emp.employment_type === "domestic" ? "Domestic (US)" : "International"} ·{" "}
                          {emp.currency}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors shrink-0 mt-1" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item && (
                      <Badge className="text-[10px] font-bold tabular-nums rounded-none border-2 border-zinc-900 bg-[#e8ff5a] text-black">
                        Net {formatCurrency(item.net_usd)}
                      </Badge>
                    )}
                    {compliance && (
                      <Badge
                        variant={compliance.status === "flagged" ? "warning" : "success"}
                        className="text-[10px] font-bold rounded-none border-2"
                      >
                        {compliance.status === "flagged" ? "Review" : "Clear"}
                      </Badge>
                    )}
                    {link && (
                      <Badge className="text-[10px] font-bold gap-0.5 rounded-none border-2 border-zinc-300 bg-zinc-100 text-zinc-800">
                        <Link2 className="h-3 w-3" />
                        Link
                      </Badge>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
