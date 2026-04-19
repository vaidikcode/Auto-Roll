"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Message } from "@/components/chat/message";
import { RunPanel } from "@/components/chat/run-panel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Play,
  Loader2,
  Zap,
  ChevronRight,
} from "lucide-react";

export default function ChatPage() {
  const [runId, setRunId] = useState<string | null>(null);
  const [isInitializingRun, setIsInitializingRun] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef<string | null>(null);

  // Keep runIdRef in sync with state
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

  const { messages, sendMessage, status, stop } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const initRun = useCallback(async (): Promise<string | null> => {
    if (runIdRef.current) return runIdRef.current;
    setIsInitializingRun(true);
    try {
      const res = await fetch("/api/runs/init", { method: "POST" });
      if (!res.ok) throw new Error("Failed to init run");
      const { run_id } = await res.json();
      setRunId(run_id);
      runIdRef.current = run_id;
      return run_id;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setIsInitializingRun(false);
    }
  }, []);

  const handleReleasePayroll = async () => {
    const id = await initRun();
    if (!id) return;
    sendMessage({
      text: "Release this month's payroll. Start collecting employees and calculating everything.",
    });
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    if (!runIdRef.current) await initRun();
    setInputValue("");
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApprove = useCallback(() => {
    sendMessage({
      text: "Approved. Please proceed to create payment links for all employees.",
    });
  }, [sendMessage]);

  const handleReject = useCallback(() => {
    sendMessage({
      text: "Rejected. Please cancel the payroll run.",
    });
  }, [sendMessage]);

  const isEmpty = messages.length === 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Top bar */}
      <header className="h-14 border-b border-zinc-200 flex items-center px-5 gap-4 shrink-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-zinc-900">Auto-Roll</span>
            <span className="text-xs text-zinc-400 ml-2">Payroll Agent</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-3 text-xs text-zinc-400">
          <ChevronRight size={12} />
          <span>April 2026 Payroll</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Loader2 size={12} className="spinner" />
              <span>Agent running…</span>
            </div>
          )}
          <Button
            onClick={handleReleasePayroll}
            disabled={isLoading || isInitializingRun}
            size="sm"
            className="gap-2"
          >
            {isInitializingRun ? (
              <Loader2 size={13} className="spinner" />
            ) : (
              <Play size={13} />
            )}
            Release Payroll
          </Button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="px-5 py-6 space-y-5 max-w-3xl mx-auto w-full">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-900 flex items-center justify-center">
                    <Zap size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      April 2026 Payroll
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                      Click <strong>Release Payroll</strong> to start the autonomous payroll run —
                      data collection, calculations, compliance, and payments all in one flow.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-left text-xs text-zinc-500">
                    {[
                      "Collects from Rippling, Gusto, Deel",
                      "Federal & state tax calculations",
                      "FX rates + cross-border compliance",
                      "Bag payment links per employee",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-100 bg-zinc-50">
                        <ChevronRight size={10} className="text-zinc-400" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleReleasePayroll}
                    disabled={isLoading || isInitializingRun}
                    className="mt-2 gap-2"
                  >
                    {isInitializingRun ? (
                      <Loader2 size={14} className="spinner" />
                    ) : (
                      <Play size={14} />
                    )}
                    Release Payroll
                  </Button>
                </div>
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

          {/* Input area */}
          <div className="border-t border-zinc-200 px-5 py-4 bg-white shrink-0">
            <div className="flex gap-2 max-w-3xl mx-auto w-full">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message the payroll agent… (Enter to send)"
                  rows={1}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-colors"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
              </div>
              <div className="flex gap-1.5 items-end">
                {isLoading && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={stop}
                    className="text-xs h-[44px] w-[44px]"
                    title="Stop"
                  >
                    <span className="h-3 w-3 rounded-sm bg-zinc-900" />
                  </Button>
                )}
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="h-[44px] w-[44px]"
                >
                  <Send size={15} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <Separator orientation="vertical" />

        {/* Right: Run panel */}
        <div className="w-80 shrink-0 overflow-hidden">
          <div className="h-12 border-b border-zinc-100 px-4 flex items-center">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Run Inspector
            </span>
          </div>
          <div className="h-[calc(100%-48px)]">
            <RunPanel runId={runId} />
          </div>
        </div>
      </div>
    </div>
  );
}
