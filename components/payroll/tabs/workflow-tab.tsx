"use client";

import { useMemo } from "react";
import { usePayrollRun } from "@/components/payroll/payroll-run-context";
import { PulseRunCharts } from "@/components/payroll/pulse-dashboard-charts";
import { buildPipelineSteps } from "@/lib/payroll/workflow-engine";
import { runStatusHr } from "@/lib/payroll/hr-copy";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Circle,
  Minus,
  Users,
  Shield,
  Calculator,
  Landmark,
  FileSpreadsheet,
  Link2,
  Flag,
} from "lucide-react";

const STEP_ICONS = {
  roster: Users,
  compliance: Shield,
  calculation: Calculator,
  mor: Landmark,
  payslip: FileSpreadsheet,
  links: Link2,
  complete: Flag,
} as const;

export function WorkflowTab() {
  const {
    snapshot,
    loading,
    selectionMode,
    setSelectionMode,
    selectedIds,
    toggleEmployee,
    selectAllInRoster,
    effectiveSelectedIds,
    setTab,
  } = usePayrollRun();

  const steps = useMemo(
    () => buildPipelineSteps(snapshot, effectiveSelectedIds),
    [snapshot, effectiveSelectedIds]
  );

  const employees = snapshot?.employees ?? [];
  const status = snapshot?.run.status;
  const statusCopy = status ? runStatusHr[status] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b-2 border-zinc-300 pb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Command</p>
          <h2 className="ar-font-display mt-2 text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
            Run overview
          </h2>
          <p className="mt-2 text-sm text-zinc-600 max-w-xl leading-relaxed">
            Ledger charts, scope, and pipeline—all high-contrast so you can scan in seconds.
          </p>
        </div>
      </div>

      <PulseRunCharts snapshot={snapshot} effectiveSelectedIds={effectiveSelectedIds} />

      <div className="border-2 border-zinc-900 bg-white px-5 py-5 shadow-[5px_5px_0_0_#18181b]">
        {loading && !snapshot ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-56 bg-zinc-200" />
            <Skeleton className="h-4 w-full max-w-md bg-zinc-200" />
          </div>
        ) : statusCopy ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Run status</p>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight mt-1">{statusCopy.title}</h3>
              <p className="text-sm text-zinc-600 mt-2 max-w-lg leading-relaxed">{statusCopy.hint}</p>
            </div>
            {snapshot?.run.totals?.total_net_usd != null && (
              <div className="text-right shrink-0 border-2 border-zinc-900 bg-[#e8ff5a] px-5 py-3 text-black shadow-[4px_4px_0_0_#18181b]">
                <p className="text-[10px] font-black uppercase tracking-wider">Net payroll</p>
                <p className="text-2xl font-black tabular-nums mt-0.5">
                  {formatCurrency(snapshot.run.totals.total_net_usd)}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <section className="border-2 border-zinc-900 bg-white p-5 shadow-[5px_5px_0_0_#18181b]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="ar-font-display text-lg font-black text-zinc-900">Payroll scope</h3>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed max-w-md">
              Charts and pipeline respect this selection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelectionMode("all")}
              className={
                selectionMode === "all"
                  ? "rounded-none border-2 border-zinc-900 bg-zinc-900 text-white font-black uppercase text-[10px] h-9 shadow-[3px_3px_0_0_#18181b]"
                  : "rounded-none border-2 border-zinc-300 bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px] h-9 hover:border-zinc-900 hover:text-zinc-900"
              }
            >
              Full roster
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelectionMode("subset")}
              className={
                selectionMode === "subset"
                  ? "rounded-none border-2 border-zinc-900 bg-[#e8ff5a] text-black font-black uppercase text-[10px] h-9 shadow-[3px_3px_0_0_#18181b]"
                  : "rounded-none border-2 border-zinc-300 bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px] h-9 hover:border-zinc-900 hover:text-zinc-900"
              }
            >
              Choose people
            </Button>
          </div>
        </div>

        {employees.length > 0 && selectionMode === "subset" && (
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {employees.map((e) => {
              const on = selectedIds.includes(e.id);
              return (
                <li key={e.id}>
                  <label className="flex items-center gap-3 border-2 border-zinc-200 bg-zinc-50 px-3 py-2.5 cursor-pointer hover:border-zinc-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleEmployee(e.id)}
                      className="rounded-none border-2 border-zinc-500 text-black accent-[#e8ff5a]"
                      aria-label={`Include ${e.name}`}
                    />
                    <span className="text-sm font-semibold text-zinc-900 truncate">{e.name}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] shrink-0 rounded-none border-2 border-zinc-300 text-zinc-600"
                    >
                      {e.employment_type === "domestic" ? "US" : "INTL"}
                    </Badge>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {employees.length > 0 && (
          <p className="mt-3 text-[11px] text-zinc-600">
            {selectionMode === "all"
              ? `${employees.length} people on this run.`
              : `${selectedIds.length} of ${employees.length} selected.`}{" "}
            <button
              type="button"
              className="text-zinc-900 font-bold underline decoration-2 underline-offset-2 hover:text-emerald-800"
              onClick={selectAllInRoster}
            >
              Select everyone
            </button>
            {" · "}
            <button
              type="button"
              className="text-zinc-900 font-bold underline decoration-2 underline-offset-2 hover:text-emerald-800"
              onClick={() => setTab("roster")}
            >
              Roster tab
            </button>
          </p>
        )}
      </section>

      <section>
        <h3 className="ar-font-display text-xl font-black text-zinc-900 mb-1">Automation pipeline</h3>
        <p className="text-xs text-zinc-600 mb-6 max-w-2xl leading-relaxed">
          Seven gates from roster to settlement. Active step is highlighted in chartreuse.
        </p>

        <ol className="relative pl-1">
          <span className="absolute left-[19px] top-4 bottom-4 w-1 bg-zinc-300" aria-hidden />
          {steps.map((step, idx) => {
            const Icon = STEP_ICONS[step.id];
            const done = step.state === "done";
            const active = step.state === "active";
            const skipped = step.state === "skipped";
            return (
              <li key={step.id} className="relative flex gap-5 pb-10 last:pb-0">
                <div
                  className={[
                    "relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center border-2 transition-colors duration-200",
                    done
                      ? "border-zinc-900 bg-emerald-400 text-black"
                      : active
                        ? "border-zinc-900 bg-[#e8ff5a] text-black ring-2 ring-zinc-900 ring-offset-2 ring-offset-[#e4e4e9]"
                        : skipped
                          ? "border-zinc-300 bg-zinc-200 text-zinc-500"
                          : "border-zinc-300 bg-white text-zinc-400",
                  ].join(" ")}
                >
                  {done ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : skipped ? (
                    <Minus className="h-4 w-4" />
                  ) : active ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 fill-zinc-300 text-zinc-300" />
                  )}
                </div>
                <div className="min-w-0 pt-0.5 border-2 border-zinc-200 bg-zinc-50 px-4 py-3 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2 gap-y-0">
                    <span className="text-[11px] font-mono font-black text-zinc-400 tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className="text-sm font-black text-zinc-900">{step.title}</h4>
                    {skipped && (
                      <Badge variant="outline" className="text-[10px] rounded-none border-zinc-400 text-zinc-500">
                        Not required
                      </Badge>
                    )}
                    {active && (
                      <Badge className="text-[10px] rounded-none border-2 border-zinc-900 bg-[#e8ff5a] text-black font-black uppercase">
                        Active
                      </Badge>
                    )}
                    {done && (
                      <Badge className="text-[10px] rounded-none border-2 border-zinc-900 bg-white text-zinc-900 font-black uppercase">
                        Done
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{step.subtitle}</p>
                  {step.completedAt && (
                    <p className="text-[11px] text-zinc-600 mt-2 font-mono tabular-nums">
                      Last signal ·{" "}
                      {new Date(step.completedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
