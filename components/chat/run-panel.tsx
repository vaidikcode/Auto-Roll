"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RunSnapshot, RunStatus, ToolEvent } from "@/lib/db/types";
import { formatCurrency, countryFlag } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Circle,
  Clock,
  Users,
  DollarSign,
  Globe,
  Link2,
  Shield,
  Loader2,
} from "lucide-react";

interface RunPanelProps {
  runId: string | null;
}

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string }> = {
  collecting: { label: "Collecting", color: "warning" },
  calculating: { label: "Calculating", color: "warning" },
  awaiting_approval: { label: "Awaiting Approval", color: "warning" },
  approved: { label: "Approved", color: "info" },
  paying: { label: "Paying", color: "info" },
  done: { label: "Complete", color: "success" },
  rejected: { label: "Rejected", color: "danger" },
};

const TOOL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  collect_employees: { label: "Collected employees", icon: <Users size={11} /> },
  calculate_domestic_payroll: { label: "Domestic payroll calc", icon: <DollarSign size={11} /> },
  fetch_fx_rate: { label: "Fetched FX rate", icon: <Globe size={11} /> },
  check_cross_border_compliance: { label: "Compliance check", icon: <Shield size={11} /> },
  calculate_international_payroll: { label: "International payroll calc", icon: <Globe size={11} /> },
  request_human_approval: { label: "Approval requested", icon: <Clock size={11} /> },
  human_approval: { label: "Human approved/rejected", icon: <CheckCircle size={11} /> },
  create_payment_link: { label: "Payment link created", icon: <Link2 size={11} /> },
};

export function RunPanel({ runId }: RunPanelProps) {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  // Track latest status in a ref so the interval callback never becomes stale
  const statusRef = useRef<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    if (!runId) return;
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data: RunSnapshot = await res.json();
        setSnapshot(data);
        statusRef.current = data.run.status;
      }
    } catch {
      // silent
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    statusRef.current = null;
    fetchSnapshot().finally(() => setLoading(false));

    const interval = setInterval(() => {
      const s = statusRef.current;
      if (s !== "done" && s !== "rejected") fetchSnapshot();
    }, 2000);

    return () => clearInterval(interval);
    // Only re-run when runId changes — NOT on every snapshot update
  }, [runId, fetchSnapshot]);

  if (!runId) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-400 p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
          <DollarSign size={20} />
        </div>
        <p className="text-sm font-medium text-zinc-500">No active run</p>
        <p className="text-xs text-zinc-400">
          Click "Release Payroll" to start a new payroll run.
        </p>
      </div>
    );
  }

  if (loading && !snapshot) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  const run = snapshot?.run;
  const statusCfg = run ? STATUS_CONFIG[run.status] : null;
  const isActive = run && !["done", "rejected"].includes(run.status);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Run status header */}
        {run && (
          <div className="rounded-xl border border-zinc-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Payroll Run
              </span>
              {statusCfg && (
                <Badge variant={statusCfg.color as "warning" | "info" | "success" | "danger"} className="gap-1">
                  {isActive && <Loader2 size={9} className="spinner" />}
                  {statusCfg.label}
                </Badge>
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 truncate">{run.id}</div>

            {/* Totals */}
            {run.totals && Object.keys(run.totals).length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {run.totals.total_gross_usd != null && (
                  <div>
                    <div className="text-[10px] text-zinc-400">Total Gross</div>
                    <div className="text-sm font-bold font-mono text-zinc-900">
                      {formatCurrency(run.totals.total_gross_usd)}
                    </div>
                  </div>
                )}
                {run.totals.total_net_usd != null && (
                  <div>
                    <div className="text-[10px] text-zinc-400">Total Net</div>
                    <div className="text-sm font-bold font-mono text-zinc-900">
                      {formatCurrency(run.totals.total_net_usd)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Employees */}
        {snapshot && snapshot.employees.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Employees ({snapshot.employees.length})
            </p>
            <div className="space-y-1">
              {snapshot.employees.map((emp) => {
                const item = snapshot.payroll_items.find((i) => i.employee_id === emp.id);
                const link = snapshot.payment_links.find((l) => l.employee_id === emp.id);
                const compliance = snapshot.compliance_reports.find((c) => c.employee_id === emp.id);

                return (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <span className="text-sm">{countryFlag(emp.country)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-900 truncate">{emp.name}</div>
                      <div className="text-[10px] text-zinc-400">{emp.country} · {emp.currency}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {item ? (
                        <div className="text-xs font-mono font-semibold text-zinc-900">
                          {formatCurrency(item.net_usd)}
                        </div>
                      ) : (
                        <Skeleton className="h-3 w-14" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      {link && (
                        <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                          <Link2 size={8} className="text-green-600" />
                        </div>
                      )}
                      {compliance?.status === "flagged" && (
                        <div className="h-4 w-4 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Shield size={8} className="text-yellow-600" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment links */}
        {snapshot && snapshot.payment_links.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Payment Links ({snapshot.payment_links.length})
            </p>
            <div className="space-y-1.5">
              {snapshot.payment_links.map((link) => {
                const emp = snapshot.employees.find((e) => e.id === link.employee_id);
                return (
                  <a
                    key={link.id}
                    href={link.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors group"
                  >
                    <Link2 size={11} className="text-zinc-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-900">
                        {emp?.name ?? "Employee"}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">{link.url}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono">{formatCurrency(link.amount)}</div>
                      <Badge
                        variant={link.status === "paid" ? "success" : "default"}
                        className="text-[9px] mt-0.5"
                      >
                        {link.status}
                      </Badge>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Tool events timeline */}
        {snapshot && snapshot.tool_events.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Activity
            </p>
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-zinc-100" />
              <div className="space-y-2">
                {snapshot.tool_events.map((event) => {
                  const cfg = TOOL_LABELS[event.tool_name];
                  return (
                    <div key={event.id} className="flex items-start gap-2 relative">
                      <div className="absolute -left-3 top-0.5 h-3 w-3 rounded-full border-2 border-zinc-200 bg-white flex items-center justify-center">
                        <Circle size={5} className="text-zinc-400 fill-zinc-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-700">
                          {cfg?.icon}
                          <span>{cfg?.label ?? event.tool_name}</span>
                        </div>
                        <div className="text-[9px] text-zinc-400">
                          {new Date(event.created_at).toLocaleTimeString()}
                          {event.duration_ms != null && ` · ${event.duration_ms}ms`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
