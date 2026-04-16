"use client";

import { useChat } from "@ai-sdk/react";
import { MessageCircle, X, Send } from "lucide-react";
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
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-[0_12px_30px_-5px_rgba(75,163,227,0.5)] transition hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14",
          isOpen && "pointer-events-none opacity-0"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 top-20 z-50 flex flex-col overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[min(600px,calc(100dvh-3rem))] sm:w-[380px] sm:max-w-[calc(100vw-3rem)] sm:rounded-[2rem]">
          <div className="flex items-center justify-between border-b border-ink/10 bg-forest px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                <MessageCircle className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-serif text-sm uppercase tracking-wider">STMS Assistant</h3>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Powered by Groq</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2 transition hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-canvas/30 p-4 sm:p-5">
            {messages.length === 0 ? (
              <div className="mt-10 text-center text-sm text-ink/50">
                Hi! Ask me to fix a schedule conflict, or generate alternative slots without overlaps.
              </div>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-white border border-ink/10 text-ink rounded-bl-sm shadow-sm"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content || (message.toolInvocations && "Calling tools...")}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-ink/10 bg-white px-4 py-3 text-sm text-ink/50 shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-ink/10 bg-white p-4"
          >
            <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-canvas/30 py-1.5 pl-4 pr-2 transition focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask STMS AI..."
                className="flex-1 bg-transparent text-sm text-ink outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white transition disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
