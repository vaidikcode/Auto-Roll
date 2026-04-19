"use client";

import { cn } from "@/lib/utils";
import { gatewayTabs, type GatewayTabId } from "@/lib/payroll/gateway-copy";
import {
  GitBranch,
  Users,
  Shield,
  FileSpreadsheet,
  Banknote,
  MessageSquare,
  CreditCard,
} from "lucide-react";

const ICONS: Record<GatewayTabId, typeof Users> = {
  workflow: GitBranch,
  roster: Users,
  compliance: Shield,
  payslips: FileSpreadsheet,
  payments: Banknote,
  assistant: MessageSquare,
  billing: CreditCard,
};

const ORDER: GatewayTabId[] = [
  "workflow",
  "roster",
  "compliance",
  "payslips",
  "payments",
  "assistant",
  "billing",
];

export function GatewayTabBar({
  active,
  onChange,
  badgeCounts,
}: {
  active: GatewayTabId;
  onChange: (t: GatewayTabId) => void;
  badgeCounts?: Partial<Record<GatewayTabId, number>>;
}) {
  return (
    <div className="border-t-2 border-zinc-200 bg-zinc-50">
      <nav
        className="max-w-7xl mx-auto px-2 sm:px-4 flex gap-0 overflow-x-auto py-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Payroll workspace sections"
      >
        {ORDER.map((id) => {
          const Icon = ICONS[id];
          const isActive = active === id;
          const n = badgeCounts?.[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "relative flex items-center gap-2 shrink-0 px-4 py-3 text-[11px] font-black uppercase tracking-wide border-b-4 transition-colors duration-150",
                isActive
                  ? "text-zinc-900 bg-[color:var(--vault-accent)] border-zinc-900"
                  : "text-zinc-500 border-transparent bg-transparent hover:text-zinc-900 hover:bg-white"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-zinc-900" : "text-zinc-400")} aria-hidden />
              <span className="whitespace-nowrap">{gatewayTabs[id]}</span>
              {n != null && n > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 border-2 border-zinc-900 bg-white text-zinc-900 text-[10px] font-black tabular-nums flex items-center justify-center">
                  {n > 9 ? "9+" : n}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
