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
  const [approveError, setApproveError] = useState<string | null>(null);
  const isLoading = state === "input-streaming" || state === "input-available";

  const handleApprove = async () => {
    if (!result?.run_id || actionState !== "idle") return;
    setApproveError(null);
    setActionState("approving");
    try {
      const res = await fetch(`/api/runs/${result.run_id}/approve`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        link_errors?: string[];
        error?: string;
      };
      if (!res.ok) {
        setActionState("idle");
        setApproveError(data.error ?? "Approval request failed.");
        return;
      }
      if (data.success === false) {
        setActionState("idle");
        const detail =
          data.link_errors?.length ? data.link_errors.join(" · ") : "Some payment links could not be created.";
        setApproveError(detail);
        return;
      }
      setActionState("approved");
      onApprove?.();
    } catch {
      setActionState("idle");
      setApproveError("Network error — try again.");
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
          <div className="grid grid-cols-2 gap-3">
            <div className="neu-inset-sm rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-[color:var(--ink-soft)]" />
                <span className="text-[10px] text-[color:var(--ink-soft)] uppercase tracking-[0.14em] font-semibold">
                  Total Gross
                </span>
              </div>
              <div className="text-lg font-semibold font-mono text-[color:var(--ink)]">
                {formatCurrency(result.total_gross)}
              </div>
            </div>
            <div className="rounded-xl p-3 neu-accent-fill shadow-[4px_4px_10px_rgba(99,102,241,0.28),-4px_-4px_10px_rgba(255,255,255,0.9)]">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-white/70" />
                <span className="text-[10px] text-white/80 uppercase tracking-[0.14em] font-semibold">
                  Total Net
                </span>
              </div>
              <div className="text-lg font-semibold font-mono text-white">
                {formatCurrency(result.total_net)}
              </div>
            </div>
            <div className="neu-inset-sm rounded-xl p-3">
              <div className="text-[10px] text-[color:var(--ink-soft)] uppercase tracking-[0.14em] font-semibold mb-1">
                Taxes Withheld
              </div>
              <div className="text-sm font-semibold font-mono text-[color:var(--ink)]">
                {formatCurrency(result.total_taxes)}
              </div>
            </div>
            <div className="neu-inset-sm rounded-xl p-3">
              <div className="text-[10px] text-[color:var(--ink-soft)] uppercase tracking-[0.14em] font-semibold mb-1">
                Transfer Fees
              </div>
              <div className="text-sm font-semibold font-mono text-[color:var(--ink)]">
                {formatCurrency(result.total_fees)}
              </div>
            </div>
          </div>

          {/* By country */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-soft)] mb-2">
              By Country · {result.employee_count} Employees
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.by_country).map(([country, data]) => (
                <div
                  key={country}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-raised-xs text-xs"
                >
                  <span>{countryFlag(country)}</span>
                  <span className="font-semibold text-[color:var(--ink)]">{country}</span>
                  <span className="text-[color:var(--ink-soft)]">×{data.count}</span>
                  <span className="font-mono text-[color:var(--ink-muted)]">
                    {formatCurrency(data.net_usd)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance warnings */}
          {result.compliance_flags > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl neu-inset-sm">
              <AlertTriangle size={14} className="text-[color:var(--warning)] shrink-0" />
              <p className="text-xs text-[color:var(--ink-muted)]">
                {result.compliance_flags} employee
                {result.compliance_flags > 1 ? "s have" : " has"} compliance flags. Review action
                items before approving.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!isActioned ? (
            <div className="flex flex-col gap-2 pt-1">
              {approveError ? (
                <p className="text-xs text-[color:var(--danger)] font-medium px-1">{approveError}</p>
              ) : null}
              <div className="flex gap-2">
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
                variant="destructive"
                size="sm"
                className="gap-2"
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
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                actionState === "approved"
                  ? "bg-[color:var(--success-soft)] text-[#065f46]"
                  : "bg-[color:var(--danger-soft)] text-[#9f1239]"
              }`}
            >
              {actionState === "approved" ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {actionState === "approved"
                ? "Approved — payment links are on the Payments tab."
                : "Payroll run rejected."}
            </div>
          )}
        </div>
      ) : null}
    </ToolCardShell>
  );
}
