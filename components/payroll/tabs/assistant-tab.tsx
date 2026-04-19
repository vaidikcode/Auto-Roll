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
    <div className="max-w-3xl mx-auto pb-8 flex flex-col h-[min(100%,calc(100dvh-9rem))] min-h-[420px] ar-vault-fade">
      <header className="mb-5 shrink-0 border-b-2 border-zinc-300 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operations</p>
        <h2 className="ar-font-display text-2xl font-black text-zinc-900 tracking-tight mt-1">
          Treasury desk
        </h2>
        <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{gatewayEmpty.assistant}</p>
      </header>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            {busy ? (
              <span className="inline-flex items-center gap-2 text-zinc-900">
                <Loader2 className="h-3.5 w-3.5 spinner" />
                Streaming
              </span>
            ) : (
              "Ready"
            )}
          </span>
          {busy && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStop}
              className="rounded-lg border border-zinc-300 text-zinc-800 bg-white hover:bg-zinc-100 text-[10px] font-bold uppercase h-8"
            >
              Stop
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1 min-h-[280px] bg-white [&_[data-radix-scroll-area-viewport]]:outline-none">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-14 px-4 leading-relaxed">
                Use <strong className="text-zinc-900">Add people</strong> in the bar above to sync HR,
                or describe changes here. Enter sends; Shift+Enter for a new line.
              </p>
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
        <div className="p-3 border-t border-zinc-200 flex gap-2 bg-zinc-50/80">
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
            className="flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-0"
          />
          <Button
            type="button"
            className="h-[52px] w-[52px] shrink-0 self-end rounded-lg border border-zinc-900 bg-[color:var(--vault-accent)] text-zinc-900 hover:brightness-[0.93] shadow-[0_2px_0_0_#18181b] active:translate-y-px active:shadow-none"
            size="icon"
            onClick={onSend}
            disabled={!inputValue.trim() || busy}
          >
            {busy ? <Loader2 className="h-4 w-4 spinner" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
