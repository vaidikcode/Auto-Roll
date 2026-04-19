"use client";

import { Check } from "lucide-react";

export interface PhaseStep {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
}

/**
 * Floating neumorphic stepper. Completed steps get an accent-gradient disc,
 * the active step is "pressed" into the surface, future steps stay soft.
 */
export function PhaseTracker({ steps }: { steps: PhaseStep[] }) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
      <div
        className="flex min-w-[640px] items-stretch gap-2 p-2 rounded-2xl neu-raised-sm"
      >
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={[
              "flex-1 px-3 py-3 flex items-start gap-3 rounded-xl",
              "transition-all duration-200",
              s.active ? "neu-pressed" : "",
            ].join(" ")}
          >
            <div
              className={[
                "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                "transition-all duration-200",
                s.done
                  ? "neu-accent-fill text-white shadow-[3px_3px_8px_rgba(99,102,241,0.35),-3px_-3px_8px_rgba(255,255,255,0.9)]"
                  : s.active
                    ? "bg-[color:var(--surface)] text-[color:var(--accent-ink)] shadow-[var(--nu-raised-xs)]"
                    : "bg-[color:var(--surface)] text-[color:var(--ink-soft)] shadow-[var(--nu-inset-sm)]",
              ].join(" ")}
            >
              {s.done ? (
                <Check size={13} strokeWidth={3} />
              ) : (
                <span className="text-[11px] font-semibold tabular-nums">
                  {i + 1}
                </span>
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                Step {i + 1}
              </div>
              <div
                className={[
                  "text-xs font-semibold leading-snug mt-0.5",
                  s.done || s.active
                    ? "text-[color:var(--ink)]"
                    : "text-[color:var(--ink-soft)]",
                ].join(" ")}
              >
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
