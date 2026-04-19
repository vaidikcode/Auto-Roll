"use client";

import { useState } from "react";
import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countryFlag, formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2, Users, DollarSign, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ApprovalResult {
  run_id: string;
  total_gross: number;
  total_net: number;
  total_taxes: number;
  total_fees: number;
  employee_count: number;
  by_country: Record<string, { count: number; net_usd: number }>;
  compliance_flags: number;
  status: string;
}

interface ApprovalCardProps {
  state: ToolState;
  result?: ApprovalResult;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApprovalCard({ state, result, onApprove, onReject }: ApprovalCardProps) {
  const [actionState, setActionState] = useState<"idle" | "approving" | "rejecting" | "approved" | "rejected">("idle");
  const isLoading = state === "input-streaming" || state === "input-available";

  const handleApprove = async () => {
    if (!result?.run_id || actionState !== "idle") return;
    setActionState("approving");
    try {
      const res = await fetch(`/api/runs/${result.run_id}/approve`, { method: "POST" });
      if (res.ok) {
        setActionState("approved");
        onApprove?.();
      } else {
        setActionState("idle");
      }
    } catch {
      setActionState("idle");
    }
  };

  const handleReject = async () => {
    if (!result?.run_id || actionState !== "idle") return;
    setActionState("rejecting");
    try {
      const res = await fetch(`/api/runs/${result.run_id}/approve`, { method: "DELETE" });
      if (res.ok) {
        setActionState("rejected");
        onReject?.();
      } else {
        setActionState("idle");
      }
    } catch {
      setActionState("idle");
    }
  };

  const isActioned = actionState === "approved" || actionState === "rejected";

  return (
    <ToolCardShell
      title="Human Approval Required"
      icon={<Users size={14} />}
      state={isActioned ? "output-available" : state}
      statusLabel={
        isLoading
          ? "Preparing summary…"
          : actionState === "approved"
          ? "Approved ✓"
          : actionState === "rejected"
          ? "Rejected"
          : "Awaiting your review"
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* Totals grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-zinc-100 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Gross</span>
              </div>
              <div className="text-lg font-bold font-mono text-zinc-900">
                {formatCurrency(result.total_gross)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 p-3 bg-zinc-900">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Net</span>
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {formatCurrency(result.total_net)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 p-3">
              <div className="text-[10px] text-zinc-400 mb-1">Taxes Withheld</div>
              <div className="text-sm font-semibold font-mono text-zinc-900">
                {formatCurrency(result.total_taxes)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 p-3">
              <div className="text-[10px] text-zinc-400 mb-1">Transfer Fees</div>
              <div className="text-sm font-semibold font-mono text-zinc-900">
                {formatCurrency(result.total_fees)}
              </div>
            </div>
          </div>

          {/* By country */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              By Country · {result.employee_count} Employees
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.by_country).map(([country, data]) => (
                <div
                  key={country}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-100 bg-zinc-50 text-xs"
                >
                  <span>{countryFlag(country)}</span>
                  <span className="font-medium text-zinc-700">{country}</span>
                  <span className="text-zinc-400">×{data.count}</span>
                  <span className="font-mono text-zinc-900">{formatCurrency(data.net_usd)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance warnings */}
          {result.compliance_flags > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle size={14} className="text-yellow-600 shrink-0" />
              <p className="text-xs text-yellow-800">
                {result.compliance_flags} employee{result.compliance_flags > 1 ? "s have" : " has"} compliance flags.
                Review action items before approving.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!isActioned ? (
            <div className="flex gap-2 pt-1">
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleApprove}
                disabled={actionState !== "idle"}
              >
                {actionState === "approving" ? (
                  <Loader2 size={14} className="spinner" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Approve & Release
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleReject}
                disabled={actionState !== "idle"}
              >
                {actionState === "rejecting" ? (
                  <Loader2 size={14} className="spinner" />
                ) : (
                  <XCircle size={14} />
                )}
                Reject
              </Button>
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                actionState === "approved"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {actionState === "approved" ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {actionState === "approved"
                ? "Approved — generating payment links…"
                : "Payroll run rejected."}
            </div>
          )}
        </div>
      ) : null}
    </ToolCardShell>
  );
}
