"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

export type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

interface ToolCardShellProps {
  title: string;
  icon: React.ReactNode;
  state: ToolState;
  children?: React.ReactNode;
  className?: string;
  statusLabel?: string;
  /** One-line compact summary. When set, the card body is collapsed until the user expands. */
  summary?: React.ReactNode;
  /** Force-open regardless of summary. Default false when `summary` is provided. */
  defaultOpen?: boolean;
}

const STATE_DOT: Record<ToolState, string> = {
  "input-streaming": "bg-amber-400 pulse-dot",
  "input-available": "bg-amber-400 pulse-dot",
  "output-available":
    "bg-[linear-gradient(135deg,var(--accent-from),var(--accent-to))]",
  "output-error": "bg-[color:var(--danger)]",
};

const STATE_TEXT: Record<ToolState, string> = {
  "input-streaming": "Running",
  "input-available": "Running",
  "output-available": "Done",
  "output-error": "Error",
};

export function ToolCardShell({
  title,
  icon,
  state,
  children,
  className,
  statusLabel,
  summary,
  defaultOpen,
}: ToolCardShellProps) {
  const isLoading = state === "input-streaming" || state === "input-available";
  const collapsible = Boolean(summary) && !isLoading && state !== "output-error";
  const [open, setOpen] = useState<boolean>(defaultOpen ?? !collapsible);

  return (
    <div
      className={cn(
        "overflow-hidden fade-in rounded-xl border border-zinc-200 bg-white shadow-sm",
        className
      )}
    >
      {/* Header — click to toggle when collapsible */}
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-zinc-50/70 hover:bg-zinc-100/70 text-left transition-colors"
        >
          <span className="h-7 w-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
            {icon}
          </span>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.14em] shrink-0">
            {title}
          </span>
          <span className="text-xs text-zinc-700 flex-1 min-w-0 truncate">{summary}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATE_DOT[state])} />
            <span className="text-xs text-zinc-500">{statusLabel ?? STATE_TEXT[state]}</span>
            <ChevronDown
              size={14}
              className={cn("text-zinc-400 transition-transform", open && "rotate-180")}
            />
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-zinc-50/70">
          <span className="h-7 w-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
            {icon}
          </span>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.14em] flex-1">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATE_DOT[state])} />
            <span className="text-xs text-zinc-500">{statusLabel ?? STATE_TEXT[state]}</span>
          </div>
        </div>
      )}

      {/* Body */}
      {(open || isLoading || state === "output-error") && (
        <div className="p-4 bg-white">
          {isLoading && !children ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-3/4 bg-zinc-100" />
              <Skeleton className="h-3 w-1/2 bg-zinc-100" />
              <Skeleton className="h-3 w-2/3 bg-zinc-100" />
            </div>
          ) : state === "output-error" ? (
            <p className="text-sm text-red-500">An error occurred processing this step.</p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
