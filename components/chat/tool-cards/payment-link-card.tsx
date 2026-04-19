"use client";

import { useState } from "react";
import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countryFlag, formatCurrency } from "@/lib/utils";
import { Link2, Copy, Check, ExternalLink, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentLinkResult {
  employee_name: string;
  employee_id: string;
  country: string;
  amount_usd: number;
  currency: string;
  bag_link_id: string;
  url: string;
  compliance_status: "clear" | "flagged";
  compliance_steps_count: number;
}

interface PaymentLinkCardProps {
  state: ToolState;
  result?: PaymentLinkResult;
}

export function PaymentLinkCard({ state, result }: PaymentLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const isLoading = state === "input-streaming" || state === "input-available";

  const handleCopy = () => {
    if (!result?.url) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolCardShell
      title="Payment Link"
      icon={<Link2 size={14} />}
      state={state}
      statusLabel={isLoading ? "Creating link…" : `${result?.employee_name}`}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-7 flex-1" />
            <Skeleton className="h-7 flex-1" />
          </div>
        </div>
      ) : result ? (
        <div className="space-y-3">
          {/* Employee header */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl neu-inset-sm flex items-center justify-center text-sm font-semibold text-[color:var(--ink-muted)]">
              {result.employee_name[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--ink)]">
                {result.employee_name}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[color:var(--ink-soft)]">
                {countryFlag(result.country)} {result.country}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-base font-semibold font-mono neu-accent-text">
                {formatCurrency(result.amount_usd)}
              </div>
              <div className="text-[10px] text-[color:var(--ink-soft)]">USD</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl neu-inset-sm">
            <Link2 size={12} className="text-[color:var(--ink-soft)] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-[color:var(--ink-soft)] uppercase tracking-[0.14em]">
                Hosted checkout
              </div>
              <span
                className="text-xs text-[color:var(--ink-muted)] truncate block"
                title={result.url}
              >
                {(() => {
                  try {
                    const u = new URL(result.url);
                    const tail =
                      u.pathname.length > 22 ? `${u.pathname.slice(0, 14)}…` : u.pathname;
                    return `${u.host}${tail}`;
                  } catch {
                    return result.url.slice(0, 48);
                  }
                })()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <Check size={12} className="text-[color:var(--success)]" />
              ) : (
                <Copy size={12} />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              asChild
            >
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} />
                Open Link
              </a>
            </Button>
          </div>

          {/* Compliance callout */}
          {result.compliance_status === "flagged" && result.compliance_steps_count > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl neu-inset-sm">
              <Shield size={12} className="text-[color:var(--warning)]" />
              <span className="text-xs text-[color:var(--ink-muted)]">
                {result.compliance_steps_count} compliance action item
                {result.compliance_steps_count > 1 ? "s" : ""} to review before payment clears
              </span>
            </div>
          )}
        </div>
      ) : null}
    </ToolCardShell>
  );
}
