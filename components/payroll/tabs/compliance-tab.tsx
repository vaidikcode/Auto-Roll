"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePayrollRun } from "@/components/payroll/payroll-run-context";
import { gatewayEmpty } from "@/lib/payroll/gateway-copy";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { countryFlag, formatCurrency } from "@/lib/utils";
import { ExternalLink, Shield } from "lucide-react";

export function ComplianceTab() {
  const { runId, snapshot, loading, effectiveSelectedIds } = usePayrollRun();

  const rows = useMemo(() => {
    if (!snapshot) return [];
    const emps = snapshot.employees.filter((e) => {
      if (!effectiveSelectedIds) return true;
      return effectiveSelectedIds.includes(e.id);
    });
    return emps.map((emp) => {
      const report = snapshot.compliance_reports.find((c) => c.employee_id === emp.id);
      const item = snapshot.payroll_items.find((p) => p.employee_id === emp.id);
      return { emp, report, item };
    });
  }, [snapshot, effectiveSelectedIds]);

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <header className="mb-8 border-b-2 border-zinc-300 pb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Risk</p>
        <h2 className="ar-font-display text-3xl font-black text-zinc-900 mt-1">Compliance</h2>
        <p className="text-sm text-zinc-600 mt-2 max-w-2xl leading-relaxed">
          Per-person packets—guidance only, not legal advice.
        </p>
      </header>

      {loading && !snapshot ? (
        <Skeleton className="h-72 rounded-none bg-zinc-200 border-2 border-zinc-300" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-600">{gatewayEmpty.compliance}</p>
      ) : (
        <div className="border-2 border-zinc-900 bg-white overflow-hidden shadow-[5px_5px_0_0_#18181b]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-100 text-left text-[10px] font-black uppercase tracking-wider text-zinc-600 border-b-2 border-zinc-200">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Jurisdiction</th>
                  <th className="px-4 py-3">Packet</th>
                  <th className="px-4 py-3 text-right">Net (context)</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ emp, report, item }) => {
                  const isDomestic = emp.employment_type === "domestic";
                  const hasPacket = !!report;
                  return (
                    <tr
                      key={emp.id}
                      className="border-b-2 border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/payroll/${runId}/people/${emp.id}`}
                          className="font-black text-zinc-900 hover:text-emerald-800 transition-colors"
                        >
                          {emp.name}
                        </Link>
                        <div className="text-xs text-zinc-600 truncate max-w-[200px]">{emp.email}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        <span className="mr-1">{countryFlag(emp.country)}</span>
                        {emp.country}
                        {emp.tax_locale?.state && (
                          <span className="text-zinc-600"> · {emp.tax_locale.state}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isDomestic && !hasPacket ? (
                          <span className="inline-flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                            <Shield className="h-3.5 w-3.5 text-zinc-600" />
                            No cross-border filing
                          </span>
                        ) : hasPacket ? (
                          <div className="space-y-1">
                            <Badge
                              variant={report!.status === "flagged" ? "warning" : "success"}
                              className="text-[10px] font-black rounded-none border-2"
                            >
                              {report!.status === "flagged" ? "Review" : "Clear"}
                            </Badge>
                            <p className="text-xs text-zinc-600 line-clamp-2 max-w-xs leading-relaxed">
                              {report!.summary}
                            </p>
                            {report!.sources?.[0] && (
                              <a
                                href={report!.sources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-zinc-900 font-bold inline-flex items-center gap-1 underline decoration-2 underline-offset-2 hover:text-emerald-800"
                              >
                                Primary source
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-800 text-xs font-black uppercase">Awaiting fetch…</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-900 font-black">
                        {item ? formatCurrency(item.net_usd) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/payroll/${runId}/people/${emp.id}`}
                          className="text-zinc-900 hover:text-emerald-800 text-xs font-black uppercase"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
