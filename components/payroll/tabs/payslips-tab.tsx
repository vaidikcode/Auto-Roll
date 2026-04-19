"use client";

import { useMemo } from "react";
import { usePayrollRun } from "@/components/payroll/payroll-run-context";
import { PayslipPreview } from "@/components/payroll/payslip-preview";
import { gatewayEmpty } from "@/lib/payroll/gateway-copy";
import { Skeleton } from "@/components/ui/skeleton";

export function PayslipsTab() {
  const { snapshot, loading, effectiveSelectedIds } = usePayrollRun();

  const slips = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.payroll_items
      .filter((p) => {
        if (!effectiveSelectedIds) return true;
        return effectiveSelectedIds.includes(p.employee_id);
      })
      .map((item) => ({
        item,
        emp: snapshot.employees.find((e) => e.id === item.employee_id)!,
      }))
      .filter((x) => x.emp);
  }, [snapshot, effectiveSelectedIds]);

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <header className="mb-8 border-b-2 border-zinc-300 pb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Statements</p>
        <h2 className="ar-font-display text-3xl font-black text-zinc-900 mt-1">Payslips</h2>
        <p className="text-sm text-zinc-600 mt-2 max-w-xl leading-relaxed">
          Earnings cards with print-friendly styling.
        </p>
      </header>

      {loading && !snapshot ? (
        <Skeleton className="h-96 rounded-none bg-zinc-200 border-2 border-zinc-300" />
      ) : slips.length === 0 ? (
        <p className="text-sm text-zinc-600">{gatewayEmpty.payslips}</p>
      ) : (
        <div className="space-y-8">
          {slips.map(({ item, emp }) => (
            <div key={item.id} className="border-2 border-zinc-900 bg-white overflow-hidden shadow-[5px_5px_0_0_#18181b]">
              <PayslipPreview employee={emp} item={item} theme="vault" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
