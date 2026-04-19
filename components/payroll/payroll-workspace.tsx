"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRunSnapshot } from "@/hooks/use-run-snapshot";
import { runStatusHr } from "@/lib/payroll/hr-copy";
import { parseGatewayTab, type GatewayTabId } from "@/lib/payroll/gateway-copy";
import { PayrollRunProvider } from "@/components/payroll/payroll-run-context";
import { GatewayTabBar } from "@/components/payroll/tabs/gateway-tab-bar";
import { WorkflowTab } from "@/components/payroll/tabs/workflow-tab";
import { RosterTab } from "@/components/payroll/tabs/roster-tab";
import { ComplianceTab } from "@/components/payroll/tabs/compliance-tab";
import { PayslipsTab } from "@/components/payroll/tabs/payslips-tab";
import { PaymentsTab } from "@/components/payroll/tabs/payments-tab";
import { AssistantTab } from "@/components/payroll/tabs/assistant-tab";

import { BillingTab } from "@/components/payroll/tabs/billing-tab";
import { ChevronRight, Loader2, Play, UserPlus } from "lucide-react";


const ADD_PEOPLE_PROMPT =
  "Please collect employees from our HR systems (Rippling, Gusto, Deel) and add everyone to this payroll run.";

export function PayrollWorkspace({ runId }: { runId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseGatewayTab(searchParams.get("tab"));

  const setTab = useCallback(
    (t: GatewayTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (t === "workflow") params.delete("tab");
      else params.set("tab", t);
      const q = params.toString();
      router.replace(q ? `/payroll/${runId}?${q}` : `/payroll/${runId}`, { scroll: false });
    },
    [router, runId, searchParams]
  );

  const { snapshot, loading, refresh } = useRunSnapshot(runId, 2200);
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
  const [assistFocusEpoch, setAssistFocusEpoch] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const handleStartRun = () => {
    sendMessage({
      text: "Run this month’s payroll end to end. Keep each reply to one short line; put details in the tool cards only.",
    });
    setTab("assistant");
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isAgentBusy) return;
    setInputValue("");
    sendMessage({ text });
  };

  const handleApprove = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleReject = useCallback(() => {
    sendMessage({
      text: "I’m not approving this run. Please stop here.",
    });
  }, [sendMessage]);

  const handleAddPeople = useCallback(() => {
    setInputValue(ADD_PEOPLE_PROMPT);
    setAssistFocusEpoch((n) => n + 1);
    setTab("assistant");
  }, [setTab]);

  const handleUploadDone = useCallback((count: number) => {
    void refresh();
    if (count > 0) setTab("roster");
  }, [refresh, setTab]);

  useEffect(() => {
    if (tab !== "assistant") return;
    queueMicrotask(() => chatInputRef.current?.focus());
  }, [tab, assistFocusEpoch]);

  const statusLabel = snapshot?.run.status
    ? runStatusHr[snapshot.run.status].title
    : loading
      ? "Loading…"
      : "—";

  const flaggedCount = useMemo(() => {
    if (!snapshot) return 0;
    return snapshot.compliance_reports.filter((c) => c.status === "flagged").length;
  }, [snapshot]);

  const tabBadges = useMemo(
    () => ({
      compliance: flaggedCount,
    }),
    [flaggedCount]
  );

  return (
    <PayrollRunProvider
      runId={runId}
      snapshot={snapshot}
      loading={loading}
      tab={tab}
      setTab={setTab}
    >
      <div className="ar-vault h-dvh min-h-0 flex flex-col overflow-hidden text-[color:var(--vault-ink)]">
        <div className="ar-vault-main flex flex-col min-h-0 flex-1">
          <header className="shrink-0 z-30 border-b-4 border-zinc-900 bg-white shadow-sm">
            <div className="h-14 px-4 sm:px-5 flex items-center gap-3 min-w-0">
              <Link
                href="/payroll"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
              >
                Runs
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" aria-hidden />
              <div className="h-8 w-8 shrink-0 border-2 border-zinc-900 bg-[color:var(--vault-accent)] text-zinc-900 flex items-center justify-center font-black text-[10px]">
                AR
              </div>
              <code className="text-[11px] font-mono text-zinc-700 truncate max-w-[88px] sm:max-w-[200px]">
                {runId.slice(0, 8)}…
              </code>
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-wide ml-1 hidden md:inline-flex border-2 border-zinc-900 bg-zinc-100 text-zinc-900 rounded-none"
              >
                {statusLabel}
              </Badge>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {isAgentBusy && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <Loader2 className="h-3.5 w-3.5 spinner text-zinc-900" />
                    Live
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setUploadOpen(true)}
                  disabled={isAgentBusy}
                  className="h-9 gap-1.5 rounded-none border-2 border-zinc-900 bg-white text-zinc-900 font-bold uppercase text-[10px] tracking-wide hover:bg-zinc-100 shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import CSV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddPeople}
                  disabled={isAgentBusy}
                  className="h-9 gap-1.5 rounded-none border-2 border-zinc-900 bg-white text-zinc-900 font-bold uppercase text-[10px] tracking-wide hover:bg-zinc-100 shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add people
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartRun}
                  disabled={isAgentBusy}
                  className="h-9 gap-1.5 rounded-none border-2 border-zinc-900 !bg-zinc-900 !text-white font-black uppercase text-[10px] tracking-wide hover:!bg-zinc-800 hover:!text-white shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isAgentBusy ? (
                    <Loader2 className="h-3.5 w-3.5 spinner" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  Run payout
                </Button>
              </div>
            </div>
            <GatewayTabBar active={tab} onChange={setTab} badgeCounts={tabBadges} />
          </header>

          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-full">
              {tab === "workflow" && <WorkflowTab />}
              {tab === "roster" && <RosterTab />}
              {tab === "compliance" && <ComplianceTab />}
              {tab === "payslips" && <PayslipsTab />}
              {tab === "payments" && <PaymentsTab />}
              {tab === "assistant" && (
                <AssistantTab
                  messages={messages}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onSend={handleSend}
                  busy={isAgentBusy}
                  onStop={() => stop()}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  chatInputRef={chatInputRef}
                />
              )}
              {tab === "billing" && <BillingTab />}
            </div>
          </main>
        </div>
      </div>

      <UploadEmployeesModal
        runId={runId}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploadDone}
      />
    </PayrollRunProvider>
  );
}
