"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, BookmarkCheck, Trash2, ArrowLeft } from "lucide-react";
import { AURORA_ACCENT, GLASS_MODAL_OVERLAY, TONE } from "@/app/admin/_shell/aurora-ui";

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
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${GLASS_MODAL_OVERLAY}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onStay}
        >
          <motion.div
            ref={modalRef}
            className="w-full max-w-md rounded-2xl bg-white/40 border border-white/65 backdrop-blur-lg backdrop-saturate-150 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ boxShadow: "0 28px 70px -24px rgba(26,22,68,0.38)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ backgroundImage: AURORA_ACCENT }} />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
              <div
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl backdrop-blur"
                style={{ background: TONE.warning.soft, border: `1px solid ${TONE.warning.border}` }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: TONE.warning.text }} />
              </div>
              <div>
                <p className="font-display text-[15.5px] font-semibold tracking-[-0.01em] text-foreground leading-snug">
                  You&apos;re about to leave this page
                </p>
                <p className="text-[12.5px] mt-1 leading-relaxed text-text-secondary">
                  You have in-progress work in{" "}
                  <span className="font-semibold text-foreground">{flowLabel}</span>.
                  Save your progress to continue where you left off, or discard it and leave.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-white/60" />

            {/* Actions */}
            <div className="px-6 py-5 flex flex-col gap-3">

              {/* PRIMARY — Save progress and leave */}
              <button
                onClick={onSaveAndLeave}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-white transition-transform duration-fast hover:-translate-y-0.5"
                style={{
                  backgroundImage: AURORA_ACCENT,
                  boxShadow: "0 12px 24px -12px rgba(108,76,230,0.6)",
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
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left backdrop-blur transition-colors duration-fast hover:opacity-90"
                style={{
                  border: `1px solid ${TONE.error.border}`,
                  background: TONE.error.soft,
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ background: TONE.error.soft }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: TONE.error.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold leading-snug" style={{ color: TONE.error.text }}>
                    Cancel and leave
                  </p>
                  <p className="text-[11px] mt-0.5 text-text-tertiary">
                    Discard all unsaved answers and exit
                  </p>
                </div>
              </button>

            </div>

            {/* Stay link */}
            <div className="px-6 pb-5 flex justify-center">
              <button
                onClick={onStay}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-tertiary transition-colors duration-fast hover:text-foreground"
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
