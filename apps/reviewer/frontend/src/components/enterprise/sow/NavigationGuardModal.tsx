"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, BookmarkCheck, Trash2, ArrowLeft } from "lucide-react";

interface NavigationGuardModalProps {
  open: boolean;
  /** ESC / backdrop — keep user on the page */
  onStay: () => void;
  /** Save progress in storage and navigate to the destination */
  onSaveAndLeave: () => void;
  /** Clear saved progress and navigate to the destination */
  onDiscardAndLeave: () => void;
  flowLabel?: string;
}

export function NavigationGuardModal({
  open,
  onStay,
  onSaveAndLeave,
  onDiscardAndLeave,
  flowLabel = "your current progress",
}: NavigationGuardModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onStay(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onStay]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ background: "rgba(28,20,14,0.52)", backdropFilter: "blur(3px)" }}
          onClick={onStay}
        >
          <motion.div
            ref={modalRef}
            className="w-full max-w-md rounded-2xl bg-white overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--color-brown-500), var(--color-gold-400))" }} />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
              <div
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl"
                style={{ background: "rgba(217,119,6,0.10)", border: "1px solid rgba(217,119,6,0.18)" }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: "var(--color-gold-600, #d97706)" }} />
              </div>
              <div>
                <p className="text-[15.5px] font-bold text-brown-900 leading-snug">
                  You&apos;re about to leave this page
                </p>
                <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                  You have in-progress work in{" "}
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>{flowLabel}</span>.
                  Save your progress to continue where you left off, or discard it and leave.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6" style={{ height: 1, background: "var(--border-hair, #ece8e2)" }} />

            {/* Actions */}
            <div className="px-6 py-5 flex flex-col gap-3">

              {/* PRIMARY — Save progress and leave */}
              <button
                onClick={onSaveAndLeave}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, var(--color-brown-500, #7c5c3e), var(--color-brown-700, #5c3f26))",
                  boxShadow: "0 2px 10px color-mix(in srgb, var(--color-brown-500, #7c5c3e) 32%, transparent)",
                  color: "#fff",
                }}
              >
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/15">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold leading-snug">Continue my progress</p>
                  <p className="text-[11px] mt-0.5 opacity-80">Save answers and navigate — resume anytime</p>
                </div>
              </button>

              {/* SECONDARY — Discard and leave */}
              <button
                onClick={onDiscardAndLeave}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:bg-red-50"
                style={{
                  border: "1px solid rgba(239,68,68,0.22)",
                  background: "rgba(239,68,68,0.04)",
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.09)" }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: "var(--danger, #ef4444)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold leading-snug" style={{ color: "var(--danger, #ef4444)" }}>
                    Cancel and leave
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-faint)" }}>
                    Discard all unsaved answers and exit
                  </p>
                </div>
              </button>

            </div>

            {/* Stay link */}
            <div className="px-6 pb-5 flex justify-center">
              <button
                onClick={onStay}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--ink-faint)" }}
              >
                <ArrowLeft className="w-3 h-3" />
                Stay on this page
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
