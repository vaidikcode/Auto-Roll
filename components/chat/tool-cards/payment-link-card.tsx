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
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-600">
              {result.employee_name[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">{result.employee_name}</div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                {countryFlag(result.country)} {result.country}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-base font-bold font-mono text-zinc-900">
                {formatCurrency(result.amount_usd)}
              </div>
              <div className="text-[10px] text-zinc-400">USD</div>
            </div>
          </div>

          {/* Link display */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <Link2 size={12} className="text-zinc-400 shrink-0" />
            <span className="text-xs font-mono text-zinc-600 flex-1 truncate">{result.url}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
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

          {/* Compliance badge */}
          {result.compliance_status === "flagged" && result.compliance_steps_count > 0 && (
            <div className="flex items-center gap-1.5 p-2 rounded bg-yellow-50 border border-yellow-200">
              <Shield size={11} className="text-yellow-600" />
              <span className="text-xs text-yellow-800">
                {result.compliance_steps_count} compliance action item
                {result.compliance_steps_count > 1 ? "s" : ""} required before payment clears
              </span>
            </div>
          )}

          {/* Bag link ID */}
          <div className="text-[10px] text-zinc-400 font-mono">
            Bag ID: {result.bag_link_id}
          </div>
        </div>
      ) : null}
    </ToolCardShell>
  );
}
