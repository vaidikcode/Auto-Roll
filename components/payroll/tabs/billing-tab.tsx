"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Message } from "@/components/chat/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { PRICING_TABLE_ROWS } from "@/lib/billing/pricing";
import { useUsageReport } from "@/hooks/use-usage-report";
import {
  CreditCard,
  RefreshCw,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHIP_PROMPTS = [
  "What do I owe this month?",
  "Show pricing table",
  "Break down my usage",
];

export function BillingTab() {
  const { report, loading, error, refresh } = useUsageReport();
  const [inputValue, setInputValue]         = useState("");
  const [pricingOpen, setPricingOpen]       = useState(false);
  const endRef                               = useRef<HTMLDivElement>(null);
  const textareaRef                          = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/billing" }),
    []
  );

  const { messages, sendMessage, status, stop } = useChat({ transport });
  const isBusy = status === "streaming" || status === "submitted";

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isBusy) return;
    setInputValue("");
    sendMessage({ text });
    // Scroll to bottom after sending
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [inputValue, isBusy, sendMessage]);

  const handleChip = (prompt: string) => {
    if (isBusy) return;
    sendMessage({ text: prompt });
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const totalEstimate = report
    ? report.run_count              * 2.00
    + report.employee_count         * 0.25
    + report.compliance_check_count * 0.50
    + report.domestic_calc_count    * 0.15
    : 0;

  const metricCards = report
    ? [
        { label: "Payroll Runs",    value: report.run_count,              cost: report.run_count              * 2.00 },
        { label: "Employees",       value: report.employee_count,         cost: report.employee_count         * 0.25 },
        { label: "Compliance Chks", value: report.compliance_check_count, cost: report.compliance_check_count * 0.50 },
        { label: "Calcs (Dom.)",    value: report.domestic_calc_count,    cost: report.domestic_calc_count    * 0.15 },
      ]
    : [];

  return (
    <div className="space-y-6 -mx-4 sm:-mx-6 -my-8 px-4 sm:px-6 py-8">
      {/* ── Metrics Panel ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">
            Usage · Last 30 days
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="h-7 gap-1.5 rounded-none border-2 border-zinc-900 bg-white text-zinc-900 font-bold uppercase text-[10px] tracking-wide hover:bg-zinc-100 shadow-[2px_2px_0_0_#18181b] active:translate-x-px active:translate-y-px active:shadow-none transition-all"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="border-2 border-red-400 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full bg-zinc-100 rounded-none" />
                ))
              : metricCards.map(({ label, value, cost }) => (
                  <div
                    key={label}
                    className="border-2 border-zinc-900 bg-white p-3 shadow-[3px_3px_0_0_#18181b]"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</div>
                    <div className="text-2xl font-black text-zinc-900 tabular-nums leading-tight mt-1">{value}</div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{formatCurrency(cost)}</div>
                  </div>
                ))}

            {/* Total card */}
            {!loading && report && (
              <div className="border-2 border-zinc-900 bg-[#e8ff5a] p-3 shadow-[3px_3px_0_0_#18181b] col-span-2 sm:col-span-1 flex flex-col justify-between">
                <div className="text-[10px] font-black uppercase tracking-wide text-zinc-900">Estimated Total</div>
                <div className="text-2xl font-black text-zinc-900 tabular-nums font-mono mt-1">
                  {formatCurrency(totalEstimate)}
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">pay-as-you-go</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Billing Agent Chat ───────────────────────────────────── */}
      <div className="border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#18181b] overflow-hidden">
        <div className="border-b-2 border-zinc-900 bg-zinc-50 px-4 py-2.5 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-zinc-700" />
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-700">
            Billing Agent
          </span>
          {isBusy && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin text-zinc-900" />
              Running
            </span>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="h-[40dvh] min-h-[180px] bg-white [&_[data-radix-scroll-area-viewport]]:outline-none"
          type="always"
        >
          <div className="px-4 sm:px-6 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="h-10 w-10 border-2 border-zinc-900 bg-[#e8ff5a] flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-zinc-900" />
                </div>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Ask about your usage, billing, or pricing. Try a quick action below.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {CHIP_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleChip(p)}
                      disabled={isBusy}
                      className="border-2 border-zinc-900 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-900 hover:bg-[#e8ff5a] transition-colors shadow-[2px_2px_0_0_#18181b] active:translate-x-px active:translate-y-px active:shadow-none disabled:opacity-40"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <Message key={msg.id} message={msg} tone="vault" />
              ))
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Compose bar */}
        <div className="border-t-2 border-zinc-900 bg-white px-4 py-3">
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {CHIP_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleChip(p)}
                  disabled={isBusy}
                  className="border border-zinc-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              placeholder="Ask about usage, billing, or pricing…"
              className="flex-1 resize-none border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors rounded-none"
            />
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isBusy && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stop}
                  className="rounded-none border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-100 text-[10px] font-bold uppercase h-8 px-3"
                >
                  Stop
                </Button>
              )}
              <Button
                type="button"
                className="h-10 w-10 rounded-none border-2 border-zinc-900 bg-[#e8ff5a] text-zinc-900 hover:brightness-90 shadow-[0_2px_0_0_#18181b] active:translate-y-px active:shadow-none disabled:opacity-40"
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || isBusy}
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-zinc-400">
            {isBusy ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Agent running
              </span>
            ) : (
              "Enter to send · Shift+Enter for new line"
            )}
          </div>
        </div>
      </div>

      {/* ── Pricing Reference (collapsible) ─────────────────────── */}
      <div className="border-2 border-zinc-900 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setPricingOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors"
        >
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-700">
            Pricing Schedule
          </span>
          {pricingOpen ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        {pricingOpen && (
          <div className="border-t-2 border-zinc-900 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-900 text-white">
                  <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-[10px]">Feature</th>
                  <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-[10px]">Description</th>
                  <th className="px-4 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Unit</th>
                  <th className="px-4 py-2 text-right font-bold uppercase tracking-wide text-[10px]">Price</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_TABLE_ROWS.map((row, i) => (
                  <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                    <td className="px-4 py-2 font-semibold text-zinc-900 whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-2 text-zinc-500">{row.description}</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-500 whitespace-nowrap">{row.unit}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-zinc-900">{formatCurrency(row.price_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
