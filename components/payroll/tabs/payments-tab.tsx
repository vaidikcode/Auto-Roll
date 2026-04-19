"use client";

import { useMemo, useState } from "react";
import { usePayrollRun } from "@/components/payroll/payroll-run-context";
import { gatewayEmpty } from "@/lib/payroll/gateway-copy";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Copy, Check } from "lucide-react";

export function PaymentsTab() {
  const { snapshot, loading, effectiveSelectedIds } = usePayrollRun();
  const [copied, setCopied] = useState<string | null>(null);

  const links = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.payment_links
      .filter((l) => {
        if (!effectiveSelectedIds) return true;
        return effectiveSelectedIds.includes(l.employee_id);
      })
      .map((pl) => ({
        pl,
        emp: snapshot.employees.find((e) => e.id === pl.employee_id),
      }));
  }, [snapshot, effectiveSelectedIds]);

  const copy = (id: string, url: string | null) => {
    if (!url) return;
    void navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <header className="mb-8 border-b-2 border-zinc-300 pb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Money</p>
        <h2 className="ar-font-display text-3xl font-black text-zinc-900 mt-1">Disbursements</h2>
        <p className="text-sm text-zinc-600 mt-2 max-w-xl leading-relaxed">
          Checkout links—copy or open in a new tab.
        </p>
      </header>

      {loading && !snapshot ? (
        <Skeleton className="h-56 rounded-none bg-zinc-200 border-2 border-zinc-300" />
      ) : links.length === 0 ? (
        <p className="text-sm text-zinc-600">{gatewayEmpty.payments}</p>
      ) : (
        <ul className="space-y-4">
          {links.map(({ pl, emp }) => (
            <li
              key={pl.id}
              className="border-2 border-zinc-900 bg-white px-5 py-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[4px_4px_0_0_#18181b] hover:bg-zinc-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="font-black text-zinc-900 text-lg">{emp?.name ?? "Employee"}</div>
                <div className="text-sm text-zinc-600 mt-0.5 tabular-nums font-bold">
                  {formatCurrency(pl.amount)} · {pl.currency}
                </div>
                <Badge
                  variant="outline"
                  className="mt-2 text-[10px] rounded-none border-2 border-zinc-300 text-zinc-600 font-black uppercase"
                >
                  {pl.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 rounded-none border-2 border-zinc-900 bg-white text-zinc-900 font-black uppercase text-[10px] h-9 hover:bg-zinc-100 shadow-[2px_2px_0_0_#18181b]"
                  onClick={() => copy(pl.id, pl.url)}
                  disabled={!pl.url}
                >
                  {copied === pl.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy
                </Button>
                {pl.url ? (
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-none border-2 border-zinc-900 bg-[#e8ff5a] text-black font-black uppercase text-[10px] h-9 shadow-[3px_3px_0_0_#18181b] hover:brightness-95"
                    asChild
                  >
                    <a href={pl.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" className="rounded-none border-2 border-zinc-300 text-zinc-500" disabled>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
