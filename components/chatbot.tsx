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
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_12px_30px_-5px_rgba(75,163,227,0.5)] transition hover:scale-105 active:scale-95",
          isOpen && "pointer-events-none opacity-0"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
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

          <div className="flex-1 overflow-y-auto bg-canvas/30 p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-ink/50 mt-10">
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
            <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-canvas/30 pl-4 pr-2 py-1.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition">
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
