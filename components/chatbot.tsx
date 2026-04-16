"use client";

import { useChat } from "@ai-sdk/react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-blue-600 text-white shadow-[0_8px_30px_-5px_rgba(75,163,227,0.5)] transition-all hover:scale-110 hover:shadow-[0_12px_40px_-5px_rgba(75,163,227,0.6)] active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14",
          isOpen && "pointer-events-none opacity-0 scale-0"
        )}
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]",
          // Mobile: full screen
          "inset-0",
          // Desktop: floating panel
          "sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(560px,calc(100dvh-2.5rem))] sm:w-[380px] sm:rounded-2xl sm:border sm:border-ink/10"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-forest to-[#253028] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 ring-2 ring-accent/30">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold">STMS Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] text-white/50">Online • Powered by AI</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 transition hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4">
            {messages.length === 0 && (
              <div className="mt-16 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                  <Bot className="h-7 w-7 text-accent" />
                </div>
                <p className="mt-4 text-sm font-semibold text-ink/70">Hi! I'm your STMS Assistant</p>
                <p className="mt-2 max-w-[250px] text-xs text-ink/40 leading-relaxed">
                  Ask me to fix schedule conflicts, suggest alternative slots, or explain timetable issues.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {["Show conflicts", "Suggest slots", "Quality check"].map((q) => (
                    <button
                      key={q}
                      className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[11px] font-medium text-ink/50 transition hover:border-accent hover:text-accent"
                      type="button"
                      onClick={() => {
                        const fakeEvent = { target: { value: q } } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(fakeEvent);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-2.5", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role !== "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Bot className="h-3.5 w-3.5 text-accent" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-gradient-to-br from-accent to-blue-600 text-white rounded-br-md"
                      : "bg-white border border-ink/8 text-ink/80 rounded-bl-md shadow-sm"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content || (message.toolInvocations && "Processing...")}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/10">
                    <User className="h-3.5 w-3.5 text-ink/50" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-ink/8 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-ink/20 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-ink/20 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-ink/20 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-ink/8 bg-white p-3 sm:p-4">
            <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-slate-50/80 py-1 pl-3.5 pr-1 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask STMS AI..."
                className="flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-blue-600 text-white transition-all hover:shadow-md disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
