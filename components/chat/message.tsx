"use client";

import type { UIMessage } from "ai";
import { CollectEmployeesCard } from "./tool-cards/collect-employees-card";
import { DomesticPayrollCard } from "./tool-cards/domestic-payroll-card";
import { FxRateCard } from "./tool-cards/fx-rate-card";
import { ComplianceCard } from "./tool-cards/compliance-card";
import { InternationalPayrollCard } from "./tool-cards/international-payroll-card";
import { ApprovalCard } from "./tool-cards/approval-card";
import { PaymentLinkCard } from "./tool-cards/payment-link-card";
import type { ToolState } from "./tool-cards/tool-card-shell";
import { Bot, User } from "lucide-react";

interface MessageProps {
  message: UIMessage;
  onApprove?: () => void;
  onReject?: () => void;
  /** Solid high-contrast bubbles on payroll Operations desk */
  tone?: "default" | "cosmos" | "vault";
}

type MessagePart = UIMessage["parts"][number];

/** AI SDK v6 tool parts use `output` when complete; older examples used `result`. */
function getToolOutput(part: unknown): unknown {
  const p = part as { output?: unknown; result?: unknown };
  return p.output ?? p.result;
}

/** Tool arguments are exposed as `input` in v6; keep `args` fallback. */
function getToolInput(part: unknown): unknown {
  const p = part as { input?: unknown; args?: unknown };
  return p.input ?? p.args;
}

function getToolState(part: MessagePart & { type: string }): ToolState {
  if (part.type.startsWith("tool-")) {
    const tp = part as { type: string; state?: string };
    if (!tp.state || tp.state === "input-streaming") return "input-streaming";
    if (tp.state === "input-available") return "input-available";
    if (tp.state === "output-available") return "output-available";
    if (tp.state === "output-error") return "output-error";
  }
  return "output-available";
}

export function Message({ message, onApprove, onReject, tone = "default" }: MessageProps) {
  const isAssistant = message.role === "assistant";
  const cosmos = tone === "cosmos";
  const vault = tone === "vault";

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={[
          "h-8 w-8 flex items-center justify-center shrink-0 mt-0.5 border-2",
          vault
            ? isAssistant
              ? "rounded-lg border-zinc-900 bg-[#e8ff5a] text-black"
              : "rounded-lg border-zinc-200 bg-white text-zinc-900"
            : cosmos
              ? isAssistant
                ? "rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.55)] border-transparent"
                : "rounded-xl bg-slate-700 text-slate-100 border-white/15"
              : isAssistant
                ? "rounded-xl neu-accent-fill text-white border-transparent shadow-[3px_3px_8px_rgba(99,102,241,0.32),-3px_-3px_8px_rgba(255,255,255,0.9)]"
                : "rounded-xl neu-raised-xs text-[color:var(--ink-muted)] border-transparent",
        ].join(" ")}
      >
        {isAssistant ? <Bot size={14} /> : <User size={14} />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[88%] ${isAssistant ? "" : "items-end"}`}>
        {message.parts.map((part, i) => {
          // Text parts
          if (part.type === "text") {
            if (!part.text?.trim()) return null;
            return (
              <div
                key={i}
                className={[
                  "px-4 py-3 text-sm leading-relaxed border-2",
                  vault
                    ? isAssistant
                      ? "rounded-xl rounded-tl-sm border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                      : "rounded-xl rounded-tr-sm border border-zinc-300 bg-[#e8ff5a] text-black shadow-sm"
                    : cosmos
                      ? isAssistant
                        ? "rounded-2xl rounded-tl-md border-cyan-500/30 bg-slate-900/90 text-slate-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                        : "rounded-2xl rounded-tr-md bg-gradient-to-br from-fuchsia-600 via-violet-600 to-cyan-500 text-white shadow-[0_0_28px_rgba(217,70,239,0.35)] border-transparent"
                      : isAssistant
                        ? "neu-raised-xs rounded-2xl rounded-tl-md text-[color:var(--ink)] border-transparent"
                        : "neu-accent-fill text-white rounded-2xl rounded-tr-md shadow-[4px_4px_10px_rgba(99,102,241,0.28),-4px_-4px_10px_rgba(255,255,255,0.9)] border-transparent",
                ].join(" ")}
              >
                {part.text}
              </div>
            );
          }

          // Tool call parts
          const p = part as MessagePart & { type: string };
          const toolState = getToolState(p);
          const out =
            toolState === "output-available"
              ? getToolOutput(p)
              : undefined;
          const inp = getToolInput(p) as Record<string, unknown> | undefined;

          if (p.type === "tool-collect_employees") {
            return (
              <CollectEmployeesCard
                key={i}
                state={toolState}
                result={out as Parameters<typeof CollectEmployeesCard>[0]["result"]}
              />
            );
          }

          if (p.type === "tool-calculate_domestic_payroll") {
            return (
              <DomesticPayrollCard
                key={i}
                state={toolState}
                args={inp as Parameters<typeof DomesticPayrollCard>[0]["args"]}
                result={out as Parameters<typeof DomesticPayrollCard>[0]["result"]}
              />
            );
          }

          if (p.type === "tool-fetch_fx_rate") {
            return (
              <FxRateCard
                key={i}
                state={toolState}
                args={inp as Parameters<typeof FxRateCard>[0]["args"]}
                result={out as Parameters<typeof FxRateCard>[0]["result"]}
              />
            );
          }

          if (p.type === "tool-check_cross_border_compliance") {
            return (
              <ComplianceCard
                key={i}
                state={toolState}
                args={inp as Parameters<typeof ComplianceCard>[0]["args"]}
                result={out as Parameters<typeof ComplianceCard>[0]["result"]}
              />
            );
          }

          if (p.type === "tool-calculate_international_payroll") {
            return (
              <InternationalPayrollCard
                key={i}
                state={toolState}
                result={out as Parameters<typeof InternationalPayrollCard>[0]["result"]}
              />
            );
          }

          if (p.type === "tool-request_human_approval") {
            return (
              <ApprovalCard
                key={i}
                state={toolState}
                result={out as Parameters<typeof ApprovalCard>[0]["result"]}
                onApprove={onApprove}
                onReject={onReject}
              />
            );
          }

          if (p.type === "tool-create_payment_link") {
            return (
              <PaymentLinkCard
                key={i}
                state={toolState}
                result={out as Parameters<typeof PaymentLinkCard>[0]["result"]}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
