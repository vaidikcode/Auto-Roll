"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import type { RefObject } from "react";
import { Message } from "@/components/chat/message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { gatewayEmpty } from "@/lib/payroll/gateway-copy";

interface AssistantTabProps {
  messages: UIMessage[];
  inputValue: string;
  setInputValue: (v: string) => void;
  onSend: () => void;
  busy: boolean;
  onStop: () => void;
  onApprove: () => void;
  onReject: () => void;
  chatInputRef?: RefObject<HTMLTextAreaElement | null>;
}

export function AssistantTab({
  messages,
  inputValue,
  setInputValue,
  onSend,
  busy,
  onStop,
  onApprove,
  onReject,
  chatInputRef: chatInputRefProp,
}: AssistantTabProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = chatInputRefProp ?? localRef;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] min-h-[420px] ar-vault-fade -mx-4 sm:-mx-6 -my-8">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white border-t border-zinc-200">
        <ScrollArea className="flex-1 min-h-[280px] bg-white [&_[data-radix-scroll-area-viewport]]:outline-none">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="h-14 w-14 border-2 border-zinc-900 bg-[color:var(--vault-accent)] flex items-center justify-center font-black text-lg text-zinc-900">
                  AR
                </div>
                <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                  {gatewayEmpty.assistant}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <Message
                  key={msg.id}
                  message={msg}
                  onApprove={onApprove}
                  onReject={onReject}
                  tone="vault"
                />
              ))
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Compose bar */}
        <div className="border-t border-zinc-200 bg-white px-4 sm:px-8 py-3">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              rows={2}
              placeholder="Instructions to the payroll agent…"
              className="flex-1 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-0 focus:bg-white transition-colors"
            />
            <div className="flex flex-col items-end gap-2 shrink-0">
              {busy && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onStop}
                  className="rounded-lg border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-100 text-[10px] font-bold uppercase h-8 px-3"
                >
                  Stop
                </Button>
              )}
              <Button
                type="button"
                className="h-11 w-11 rounded-lg border border-zinc-900 bg-[color:var(--vault-accent)] text-zinc-900 hover:brightness-[0.93] shadow-[0_2px_0_0_#18181b] active:translate-y-px active:shadow-none disabled:opacity-40"
                size="icon"
                onClick={onSend}
                disabled={!inputValue.trim() || busy}
              >
                {busy ? <Loader2 className="h-4 w-4 spinner" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Status line */}
          <div className="max-w-4xl mx-auto mt-2 flex items-center gap-2">
            {busy ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <Loader2 className="h-3 w-3 spinner text-zinc-900" />
                Agent running
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400">Enter to send · Shift+Enter for new line</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
