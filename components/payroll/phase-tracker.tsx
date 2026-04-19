"use client";

import { Check, Circle } from "lucide-react";

export interface PhaseStep {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
}

export function PhaseTracker({ steps }: { steps: PhaseStep[] }) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex min-w-[640px] items-stretch gap-0 border border-zinc-200 rounded-xl bg-white/80 backdrop-blur-sm divide-x divide-zinc-200">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 px-3 py-3 flex items-start gap-2.5 transition-colors ${
              s.active ? "bg-zinc-50" : ""
            }`}
          >
            <div
              className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 border ${
                s.done
                  ? "bg-zinc-900 border-zinc-900 text-white"
                  : s.active
                    ? "border-zinc-900 text-zinc-900 bg-white"
                    : "border-zinc-200 text-zinc-300 bg-zinc-50"
              }`}
            >
              {s.done ? <Check size={12} strokeWidth={3} /> : <Circle size={10} />}
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Step {i + 1}
              </div>
              <div
                className={`text-xs font-semibold leading-snug ${
                  s.done || s.active ? "text-zinc-900" : "text-zinc-400"
                }`}
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
