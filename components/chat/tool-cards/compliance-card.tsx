"use client";

import { ToolCardShell, type ToolState } from "./tool-card-shell";
import { Badge } from "@/components/ui/badge";
import { countryFlag } from "@/lib/utils";
import { AlertTriangle, CheckCircle, ExternalLink, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActionableStep, ComplianceSource } from "@/lib/db/types";

interface ComplianceResult {
  employee_name: string;
  country: string;
  summary: string;
  status: "clear" | "flagged";
  sources: ComplianceSource[];
  actionable_steps: ActionableStep[];
}

interface ComplianceCardProps {
  state: ToolState;
  result?: ComplianceResult;
  args?: { employee_id: string; amount_usd: number };
}

const PRIORITY_COLORS = {
  high: "danger",
  medium: "warning",
  low: "default",
} as const;

const CATEGORY_LABELS = {
  documentation: "Docs",
  reporting: "Report",
  limit: "Limit",
  tax: "Tax",
  regulatory: "Legal",
};

const SUMMARY_CHAR_LIMIT = 240;
const STEP_CHAR_LIMIT = 140;

function truncate(text: string, limit: number): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  const slice = trimmed.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > limit * 0.6 ? lastSpace : limit).trimEnd()}…`;
}

export function ComplianceCard({ state, result }: ComplianceCardProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  const cardSummary = !isLoading && result
    ? `${result.employee_name} · ${result.country} · ${
        result.status === "flagged" ? "⚠ flagged" : "clear"
      } · ${result.actionable_steps.length} action${result.actionable_steps.length === 1 ? "" : "s"}`
    : undefined;

  return (
    <ToolCardShell
      title="Cross-Border Compliance"
      icon={<Shield size={14} />}
      state={state}
      summary={cardSummary}
      statusLabel={
        isLoading
          ? "Searching regulations…"
          : result?.status === "flagged"
          ? "⚠ Flagged"
          : "✓ Clear"
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <div className="text-xs text-zinc-500 animate-pulse">
            Searching Tavily for latest compliance regulations…
          </div>
          <div className="flex flex-wrap gap-2">
            {["Searching RBI", "Checking FEMA", "CBDT guidelines"].map((s) => (
              <div key={s} className="flex items-center gap-1 px-2 py-1 bg-zinc-50 rounded-full border border-zinc-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 pulse-dot" />
                <span className="text-[10px] text-zinc-600">{s}</span>
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ) : result ? (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-base">{countryFlag(result.country)}</span>
            <div>
              <span className="text-sm font-semibold text-zinc-900">{result.employee_name}</span>
              <span className="text-xs text-zinc-400 ml-2">· {result.country}</span>
            </div>
            <div className="ml-auto">
              {result.status === "flagged" ? (
                <Badge variant="danger" className="gap-1">
                  <AlertTriangle size={10} />
                  Flagged
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1">
                  <CheckCircle size={10} />
                  Clear
                </Badge>
              )}
            </div>
          </div>

          {/* Summary — hard-capped so the compliance essay doesn't blow up the chat */}
          <p className="text-xs text-zinc-600 leading-relaxed">
            {truncate(result.summary, SUMMARY_CHAR_LIMIT)}
          </p>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Sources</p>
              <div className="flex flex-wrap gap-1.5">
                {result.sources.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    {src.title.slice(0, 30)}{src.title.length > 30 ? "…" : ""}
                    <ExternalLink size={8} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actionable steps */}
          {result.actionable_steps.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Action Items · {result.actionable_steps.length}
              </p>
              <div className="space-y-1.5">
                {result.actionable_steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-100"
                  >
                    <div className="mt-0.5">
                      {step.priority === "high" ? (
                        <AlertTriangle size={11} className="text-red-500" />
                      ) : (
                        <CheckCircle size={11} className="text-zinc-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-700 flex-1 leading-snug">
                      {truncate(step.description, STEP_CHAR_LIMIT)}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant={PRIORITY_COLORS[step.priority]} className="text-[9px] px-1.5 py-0">
                        {step.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {CATEGORY_LABELS[step.category]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </ToolCardShell>
  );
}
