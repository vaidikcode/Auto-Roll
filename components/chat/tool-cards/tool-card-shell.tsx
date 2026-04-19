"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type ToolState = "input-streaming" | "input-available" | "output-available" | "output-error";

interface ToolCardShellProps {
  title: string;
  icon: React.ReactNode;
  state: ToolState;
  children?: React.ReactNode;
  className?: string;
  statusLabel?: string;
}

const STATE_DOT: Record<ToolState, string> = {
  "input-streaming": "bg-amber-400 pulse-dot",
  "input-available": "bg-amber-400 pulse-dot",
  "output-available": "bg-green-500",
  "output-error": "bg-red-500",
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
}: ToolCardShellProps) {
  const isLoading = state === "input-streaming" || state === "input-available";

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white overflow-hidden fade-in",
        state === "output-error" && "border-red-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex-1">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              STATE_DOT[state]
            )}
          />
          <span className="text-xs text-zinc-500">
            {statusLabel ?? STATE_TEXT[state]}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {isLoading && !children ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : state === "output-error" ? (
          <p className="text-sm text-red-600">An error occurred processing this step.</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
