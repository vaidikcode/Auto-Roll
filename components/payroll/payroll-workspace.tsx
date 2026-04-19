"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Message } from "@/components/chat/message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRunSnapshot } from "@/hooks/use-run-snapshot";
import { useStaggeredReveal } from "@/hooks/use-staggered-reveal";
import { runStatusHr, toolLabelForHr } from "@/lib/payroll/hr-copy";
import { formatCurrency, countryFlag } from "@/lib/utils";
import type { RunSnapshot } from "@/lib/db/types";
import { PhaseTracker, type PhaseStep } from "./phase-tracker";
import {
  Loader2,
  Send,
  Play,
  Users,
  Calculator,
  Shield,
  ClipboardCheck,
  Link2,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

/** Pause between each person’s card appearing (~cinematic pacing). */
const REVEAL_MS = 850;

function buildPhaseSteps(snapshot: RunSnapshot | null): PhaseStep[] {
  if (!snapshot) {
    return [
      { id: "team", label: "Pull in everyone on this run", done: false, active: true },
      { id: "pay", label: "Work out each person’s pay", done: false, active: false },
      { id: "rules", label: "Review rules for people outside the U.S.", done: false, active: false },
      { id: "approve", label: "You review and confirm", done: false, active: false },
      { id: "links", label: "Share how each person gets paid", done: false, active: false },
    ];
  }

  const st = snapshot.run.status;
  const e = snapshot.employees.length > 0;
  const p = snapshot.payroll_items.length > 0;
  const hasIntl = snapshot.employees.some((x) => x.employment_type === "international");
  const c = snapshot.compliance_reports.length > 0;
  const rulesDone = !hasIntl || c;
  const approveDone =
    st === "approved" || st === "paying" || st === "done" || st === "rejected";
  const awaiting = st === "awaiting_approval";
  const linksDone = snapshot.payment_links.length > 0 || st === "done";

  const steps: PhaseStep[] = [
    { id: "team", label: "Pull in everyone on this run", done: e, active: false },
    { id: "pay", label: "Work out each person’s pay", done: p, active: false },
    { id: "rules", label: "Review rules for people outside the U.S.", done: rulesDone, active: false },
    {
      id: "approve",
      label: "You review and confirm",
      done: approveDone,
      active: false,
    },
    { id: "links", label: "Share how each person gets paid", done: linksDone, active: false },
  ];

  if (awaiting) {
    steps.forEach((s) => {
      s.active = s.id === "approve";
    });
    steps[3].done = false;
  } else {
    const idx = steps.findIndex((s) => !s.done);
    steps.forEach((s, i) => {
      s.active = i === (idx >= 0 ? idx : steps.length - 1);
    });
  }

  return steps;
}

export function PayrollWorkspace({ runId }: { runId: string }) {
  const { snapshot, loading } = useRunSnapshot(runId, 2200);
  const runIdRef = useRef(runId);
  useEffect(() => {
    runIdRef.current = runId;
  }, [runId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ runId: runIdRef.current }),
      }),
    []
  );

  const { messages, sendMessage, status, stop } = useChat({ transport });
  const isAgentBusy = status === "streaming" || status === "submitted";

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const employees = snapshot?.employees ?? [];
  const revealedEmployees = useStaggeredReveal(employees, runId, REVEAL_MS);

  const scrollChat = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollChat();
  }, [messages, scrollChat]);

  const statusCopy = snapshot ? runStatusHr[snapshot.run.status] : null;
  const phaseSteps = useMemo(() => buildPhaseSteps(snapshot), [snapshot]);

  const handleStartRun = () => {
    sendMessage({
      text: "Please run this month’s payroll: gather the team, calculate pay, check any overseas rules, then ask me to approve before sending pay details.",
    });
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isAgentBusy) return;
    setInputValue("");
    sendMessage({ text });
  };

  const handleApprove = useCallback(() => {
    sendMessage({
      text: "I approve. Please create the payment links for everyone.",
    });
  }, [sendMessage]);

  const handleReject = useCallback(() => {
    sendMessage({
      text: "I’m not approving this run. Please stop here.",
    });
  }, [sendMessage]);

  const recentActivity = useMemo(() => {
    const ev = snapshot?.tool_events ?? [];
    return ev.slice(-12).reverse();
  }, [snapshot]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/payroll"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            All runs
          </Link>
          <ChevronRight size={12} className="text-zinc-300" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight truncate">
                This month’s payroll
              </h1>
              <p className="text-[11px] text-zinc-500 truncate">
                April 2026 · Auto-Roll walks through each step with you
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isAgentBusy && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500">
                <Loader2 size={12} className="spinner" />
                Working…
              </span>
            )}
            <Button
              size="sm"
              onClick={handleStartRun}
              disabled={isAgentBusy}
              className="gap-1.5"
            >
              {isAgentBusy ? (
                <Loader2 size={13} className="spinner" />
              ) : (
                <Play size={13} />
              )}
              Run payroll
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8 pb-28">
        <PhaseTracker steps={phaseSteps} />

        {/* Status hero */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          {loading && !snapshot ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3 max-w-md" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          ) : statusCopy ? (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Where things stand
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-zinc-900 tracking-tight">
                  {statusCopy.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-600 max-w-xl leading-relaxed">
                  {statusCopy.hint}
                </p>
              </div>
              {snapshot?.run.totals && (
                <div className="flex gap-6 shrink-0">
                  {snapshot.run.totals.total_gross_usd != null && (
                    <div>
                      <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                        Total before taxes
                      </div>
                      <div className="text-lg font-semibold tabular-nums">
                        {formatCurrency(snapshot.run.totals.total_gross_usd)}
                      </div>
                    </div>
                  )}
                  {snapshot.run.totals.total_net_usd != null && (
                    <div>
                      <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                        Take-home (all staff)
                      </div>
                      <div className="text-lg font-semibold tabular-nums">
                        {formatCurrency(snapshot.run.totals.total_net_usd)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </section>

        {/* Team */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-zinc-700" />
              <h3 className="text-base font-semibold">People on this payroll</h3>
            </div>
            {employees.length > 0 && (
              <Badge variant="default" className="text-xs font-normal">
                {revealedEmployees.length} of {employees.length} shown
              </Badge>
            )}
          </div>
          {employees.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center text-sm text-zinc-500">
              When the assistant pulls your HR systems, each person will appear here.
              Use <strong>Run payroll</strong> above to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {revealedEmployees.map((emp, idx) => {
                const item = snapshot?.payroll_items.find((i) => i.employee_id === emp.id);
                const link = snapshot?.payment_links.find((l) => l.employee_id === emp.id);
                const compliance = snapshot?.compliance_reports.find(
                  (c) => c.employee_id === emp.id
                );
                return (
                  <Link
                    key={emp.id}
                    href={`/payroll/${runId}/people/${emp.id}`}
                    className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:shadow-md transition-all duration-500"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{countryFlag(emp.country)}</span>
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900 truncate group-hover:underline">
                            {emp.name}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {emp.employment_type === "domestic"
                              ? "U.S. payroll"
                              : "Outside the U.S."}{" "}
                            · {emp.currency}
                          </div>
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-zinc-300 group-hover:text-zinc-900 shrink-0 mt-0.5"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item && (
                        <Badge variant="outline" className="text-[10px] font-normal tabular-nums">
                          Take-home {formatCurrency(item.net_usd)}
                        </Badge>
                      )}
                      {compliance && (
                        <Badge
                          variant={compliance.status === "flagged" ? "warning" : "success"}
                          className="text-[10px] font-normal"
                        >
                          {compliance.status === "flagged"
                            ? "Rules: needs attention"
                            : "Rules: looks clear"}
                        </Badge>
                      )}
                      {link && (
                        <Badge variant="default" className="text-[10px] font-normal gap-1">
                          <Link2 size={10} />
                          Pay link ready
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Numbers + rules snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={16} className="text-zinc-700" />
              <h3 className="text-sm font-semibold">Pay breakdown</h3>
            </div>
            {!snapshot || snapshot.payroll_items.length === 0 ? (
              <p className="text-sm text-zinc-500 leading-relaxed">
                Totals for taxes, benefits, and any currency conversion will land here as the
                assistant finishes each person.
              </p>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {snapshot.payroll_items.map((row) => {
                  const emp = snapshot.employees.find((e) => e.id === row.employee_id);
                  return (
                    <li
                      key={row.id}
                      className="flex justify-between gap-3 text-sm border-b border-zinc-100 pb-2 last:border-0"
                    >
                      <span className="text-zinc-600 truncate">{emp?.name ?? "Team member"}</span>
                      <span className="font-medium tabular-nums shrink-0">
                        {formatCurrency(row.net_usd)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-zinc-700" />
              <h3 className="text-sm font-semibold">Rules & overseas checks</h3>
            </div>
            {!snapshot || snapshot.compliance_reports.length === 0 ? (
              <p className="text-sm text-zinc-500 leading-relaxed">
                If someone is paid outside the U.S., we’ll summarize what to watch for and link to
                trusted sources—not legal advice, just a clear heads-up.
              </p>
            ) : (
              <ul className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {snapshot.compliance_reports.map((r) => {
                  const emp = snapshot.employees.find((e) => e.id === r.employee_id);
                  return (
                    <li key={r.id} className="text-sm">
                      <Link
                        href={`/payroll/${runId}/people/${r.employee_id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {emp?.name ?? "Team member"}
                      </Link>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{r.summary}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Payment links */}
        {(snapshot?.payment_links.length ?? 0) > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck size={16} className="text-zinc-700" />
              <h3 className="text-sm font-semibold">How people get paid</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {snapshot!.payment_links.map((pl) => {
                const emp = snapshot!.employees.find((e) => e.id === pl.employee_id);
                return (
                  <a
                    key={pl.id}
                    href={pl.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm hover:bg-zinc-100 transition-colors"
                  >
                    <span className="truncate font-medium">{emp?.name}</span>
                    <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
                      {formatCurrency(pl.amount)}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Activity */}
        {recentActivity.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">Recent assistant steps</h3>
            <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
              {recentActivity.map((ev) => (
                <div
                  key={ev.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-zinc-700">{toolLabelForHr(ev.tool_name)}</span>
                  <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">
                    {new Date(ev.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chat */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Assistant</h3>
              <p className="text-[11px] text-zinc-500">
                Ask questions in everyday language—the page above updates as we go.
              </p>
            </div>
            {isAgentBusy && (
              <Button variant="outline" size="sm" onClick={() => stop()}>
                Pause
              </Button>
            )}
          </div>
          <ScrollArea className="h-[min(420px,50vh)]">
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No messages yet. Use <strong>Run payroll</strong> in the header, or type below.
                </p>
              ) : (
                messages.map((msg) => (
                  <Message
                    key={msg.id}
                    message={msg}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-zinc-100 flex gap-2 bg-zinc-50/80">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="e.g. Can you explain Priya’s take-home pay?"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 min-h-[44px] max-h-28"
            />
            <Button
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
              onClick={handleSend}
              disabled={!inputValue.trim() || isAgentBusy}
            >
              <Send size={16} />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
