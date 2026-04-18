"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  agentType: "qna" | "onboarding";
  userEmail: string;
}

export function ChatInterface({ agentType, userEmail }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  void userEmail;

  const { messages, sendMessage, status, error } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/agents/chat",
      body: { agentType },
    }),
    messages: [
      {
        id: "init",
        role: "assistant",
        parts: [
          {
            type: "text" as const,
            text:
              agentType === "onboarding"
                ? "Hi! I'm the Onboarding Agent. I can help you add new employees or import a CSV roster. How would you like to get started?"
                : "Hi there! I'm your payroll assistant. I can help you understand your pay stubs, answer questions about company policies, and explain your deductions. What would you like to know?",
          },
        ],
      },
    ],
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageText = (message: (typeof messages)[0]): string => {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const text = getMessageText(message);
          const role = message.role as string;
          if (!text && role !== "user") return null;

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-3xl",
                role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0",
                  role === "assistant"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                )}
              >
                {role === "assistant" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm leading-relaxed max-w-xl",
                  role === "assistant"
                    ? "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
                    : "bg-amber-500 text-black font-medium"
                )}
              >
                <div className="whitespace-pre-wrap">{text}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl">
            <div className="size-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="size-4" />
            </div>
            <div className="rounded-xl px-4 py-3 bg-[var(--card)] border border-[var(--border)]">
              <Loader2 className="size-4 animate-spin text-[var(--muted-foreground)]" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3">
            Error: {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              agentType === "onboarding"
                ? "Describe an employee to add, or paste CSV data..."
                : "Ask about your pay, PTO, or company policies..."
            }
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-[var(--muted-foreground)] mt-2">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
