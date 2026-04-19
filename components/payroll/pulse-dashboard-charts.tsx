"use client";

import { useMemo } from "react";
import type { RunSnapshot } from "@/lib/db/types";
import { buildPipelineSteps } from "@/lib/payroll/workflow-engine";
import { formatCurrency } from "@/lib/utils";

interface PulseRunChartsProps {
  snapshot: RunSnapshot | null;
  effectiveSelectedIds: string[] | null;
}

/** Solid, high-contrast “treasury desk” visuals — SVG + CSS only, no chart libs. */
export function PulseRunCharts({ snapshot, effectiveSelectedIds }: PulseRunChartsProps) {
  const bars = useMemo(() => {
    if (!snapshot?.payroll_items.length) return [];
    const items = [...snapshot.payroll_items]
      .filter((p) => {
        if (!effectiveSelectedIds) return true;
        return effectiveSelectedIds.includes(p.employee_id);
      })
      .sort((a, b) => b.net_usd - a.net_usd)
      .slice(0, 8);
    const max = Math.max(...items.map((i) => i.net_usd), 1);
    return items.map((p) => {
      const emp = snapshot.employees.find((e) => e.id === p.employee_id);
      return {
        id: p.id,
        name: emp?.name?.split(" ")[0] ?? "—",
        net: p.net_usd,
        pct: Math.round((p.net_usd / max) * 100),
      };
    });
  }, [snapshot, effectiveSelectedIds]);

  const { pct: pipelinePct, done, total } = useMemo(() => {
    const steps = buildPipelineSteps(snapshot, effectiveSelectedIds);
    const doneSteps = steps.filter((s) => s.state === "done").length;
    return {
      pct: Math.round((doneSteps / steps.length) * 100),
      done: doneSteps,
      total: steps.length,
    };
  }, [snapshot, effectiveSelectedIds]);

  const mix = useMemo(() => {
    if (!snapshot?.employees.length) return { dom: 0, intl: 0, domPct: 50 };
    const dom = snapshot.employees.filter((e) => e.employment_type === "domestic").length;
    const intl = snapshot.employees.length - dom;
    const t = dom + intl;
    return { dom, intl, domPct: t ? (dom / t) * 100 : 50 };
  }, [snapshot]);

  const ledger = useMemo(() => {
    if (!snapshot?.payroll_items.length) return null;
    const items = snapshot.payroll_items.filter((p) => {
      if (!effectiveSelectedIds) return true;
      return effectiveSelectedIds.includes(p.employee_id);
    });
    if (!items.length) return null;
    let gross = 0;
    let withhold = 0;
    let benefits = 0;
    let fees = 0;
    let net = 0;
    for (const p of items) {
      gross += p.gross;
      withhold += p.federal_tax + p.state_tax + p.fica;
      benefits += p.healthcare + p.retirement + p.other_deductions;
      fees += p.fees;
      net += p.net_usd;
    }
    const scale = gross > 0 ? gross : 1;
    return {
      gross,
      net,
      segments: [
        { key: "wh", label: "Withholding", w: (withhold / scale) * 100, fill: "#52525b" },
        { key: "ben", label: "Benefits & deferrals", w: (benefits / scale) * 100, fill: "#a1a1aa" },
        { key: "fees", label: "Fees & FX", w: (fees / scale) * 100, fill: "#71717a" },
        { key: "net", label: "Net settlement", w: (net / scale) * 100, fill: "#e8ff5a" },
      ],
    };
  }, [snapshot, effectiveSelectedIds]);

  const filledBlocks = Math.min(10, Math.max(0, Math.round((pipelinePct / 100) * 10)));

  return (
    <div className="grid gap-4 lg:grid-cols-12">

      {/* Orthogonal net ladder */}
      <div className="lg:col-span-5 border-2 border-zinc-900 bg-white p-5 shadow-[5px_5px_0_0_#18181b]">
        <div className="flex items-start justify-between gap-2 border-b-2 border-zinc-200 pb-3 mb-4">
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-500">
              Net ladder
            </h4>
            <p className="text-[11px] text-zinc-600 mt-1 font-mono tabular-nums">
              Ranked take-home · USD
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-900 border-2 border-zinc-900 bg-[#e8ff5a] px-2 py-0.5">
            TOP {bars.length || "—"}
          </span>
        </div>
        {bars.length === 0 ? (
          <div className="h-44 flex items-center justify-center border-2 border-dashed border-zinc-300 text-sm text-zinc-500 font-medium bg-zinc-50">
            No payroll lines yet
          </div>
        ) : (
          <div className="space-y-3">
            {bars.map((b) => (
              <div key={b.id} className="group">
                <div className="flex justify-between text-[11px] font-mono tabular-nums mb-1">
                  <span className="font-bold text-zinc-900 truncate pr-2 uppercase tracking-tight">
                    {b.name}
                  </span>
                  <span className="text-zinc-900 font-black shrink-0">{formatCurrency(b.net)}</span>
                </div>
                <div className="h-3 w-full bg-zinc-200 border-2 border-zinc-300">
                  <div
                    className="h-full bg-zinc-900 border-r-2 border-zinc-900 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${Math.max(6, b.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Square-ring settlement gauge + roster split */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="flex-1 border-2 border-zinc-900 bg-white p-5 flex flex-col items-center justify-center min-h-[200px] shadow-[5px_5px_0_0_#18181b]">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-500 self-start w-full border-b-2 border-zinc-200 pb-2 mb-4">
            Run completion
          </p>
          <div className="grid grid-cols-5 gap-1.5 w-[150px]" aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-8 border-2 border-zinc-900 ${i < filledBlocks ? "bg-[#e8ff5a]" : "bg-zinc-200"}`}
              />
            ))}
          </div>
          <p className="text-3xl font-black tabular-nums text-zinc-900 mt-4 leading-none">{pipelinePct}%</p>
          <p className="text-[11px] font-mono text-zinc-600 mt-2 tabular-nums">
            {done}/{total} gates
          </p>
        </div>

        <div className="border-2 border-zinc-900 bg-white p-4 shadow-[5px_5px_0_0_#18181b]">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-500 border-b-2 border-zinc-200 pb-2 mb-3">
            Payroll mix
          </p>
          <div className="h-8 w-full flex border-2 border-zinc-900">
            <div
              className="h-full bg-white flex items-center justify-center text-[10px] font-black text-black uppercase tracking-tighter motion-reduce:transition-none transition-all duration-500"
              style={{ width: `${mix.domPct}%` }}
            >
              {mix.domPct > 14 ? `US ${mix.dom}` : ""}
            </div>
            <div
              className="h-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-tighter border-l-2 border-zinc-900 motion-reduce:transition-none transition-all duration-500"
              style={{ width: `${100 - mix.domPct}%` }}
            >
              {100 - mix.domPct > 14 ? `INTL ${mix.intl}` : ""}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-[11px] font-mono font-bold text-zinc-600 tabular-nums">
            <span>US · {mix.dom}</span>
            <span>INTL · {mix.intl}</span>
          </div>
        </div>
      </div>

      {/* Ledger strip — gross composition */}
      <div className="lg:col-span-3 border-2 border-zinc-900 bg-white p-5 shadow-[5px_5px_0_0_#18181b] flex flex-col">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-500 border-b-2 border-zinc-200 pb-2 mb-4">
          Gross flow
        </p>
        {!ledger ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 text-center font-medium bg-zinc-50 border-2 border-dashed border-zinc-200">
            Awaiting calculated lines
          </div>
        ) : (
          <>
            <p className="text-[11px] text-zinc-600 font-mono mb-3 tabular-nums">
              Σ gross {formatCurrency(ledger.gross)}
            </p>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="h-10 w-full flex border-2 border-zinc-900">
                {ledger.segments.map((s) => (
                  <div
                    key={s.key}
                    title={`${s.label}: ${s.w.toFixed(1)}% of gross`}
                    className="h-full min-w-[3px] border-r-2 border-zinc-900 last:border-r-0 motion-reduce:transition-none transition-[flex] duration-700"
                    style={{
                      flex: `${Math.max(s.w, 0.15)} 1 0%`,
                      backgroundColor: s.fill,
                      backgroundImage:
                        s.key === "net"
                          ? "repeating-linear-gradient(-45deg, rgba(0,0,0,0.12) 0 3px, transparent 3px 6px)"
                          : undefined,
                    }}
                  />
                ))}
              </div>
              <ul className="space-y-2 text-[10px] font-mono uppercase tracking-tight text-zinc-600">
                {ledger.segments.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 border-2 border-zinc-900 shrink-0"
                      style={{ backgroundColor: s.fill }}
                    />
                    <span className="flex-1 truncate text-zinc-800">{s.label}</span>
                    <span className="tabular-nums text-zinc-500">{s.w.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[10px] text-zinc-500 mt-4 leading-snug border-t border-zinc-200 pt-3">
              Strip width is each bucket as a share of total gross for the selected roster.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
