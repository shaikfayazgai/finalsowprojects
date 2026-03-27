"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function AIChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Hi! I'm your support assistant. Ask me anything about tasks, payments, submissions, or account settings." },
  ]);
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Thanks for your question! Based on the platform documentation, I'd recommend checking the Help Center articles for detailed guidance. If you need further assistance, feel free to submit a support ticket.",
        },
      ]);
    }, 800);
  };

  const suggestions = [
    "How do I submit work?",
    "When will I get paid?",
    "Extend my deadline",
  ];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brown-500 to-brown-700 text-white flex items-center justify-center shadow-lg shadow-brown-500/20 hover:shadow-xl hover:shadow-brown-500/30 transition-shadow cursor-pointer"
          >
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-forest-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl bg-white shadow-2xl shadow-black/10 flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-brown-500 to-brown-600 text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">AI Support Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/70">Online — typically replies instantly</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) =>
                msg.role === "ai" ? (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-lg bg-brown-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-brown-500" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
                      <p className="text-[12px] text-gray-600 leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="bg-brown-500 rounded-2xl rounded-tr-md px-3.5 py-2.5 max-w-[85%]">
                      <p className="text-[12px] text-white leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                )
              )}

              {/* Quick suggestions */}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setMessages((prev) => [...prev, { role: "user", text: s }]);
                        setTimeout(() => {
                          setMessages((prev) => [
                            ...prev,
                            { role: "ai", text: "Thanks for your question! Based on the platform documentation, I'd recommend checking the Help Center articles for detailed guidance. If you need further assistance, feel free to submit a support ticket." },
                          ]);
                        }, 800);
                      }}
                      className="text-[11px] text-brown-600 bg-brown-50 hover:bg-brown-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  className="flex-1 text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-100 transition-all placeholder:text-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                    input.trim()
                      ? "bg-brown-500 text-white hover:bg-brown-600 cursor-pointer"
                      : "bg-gray-100 text-gray-300"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-gray-400 text-center mt-2">AI may make mistakes. For critical issues, submit a ticket.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
