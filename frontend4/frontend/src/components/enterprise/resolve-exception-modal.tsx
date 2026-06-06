"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { ExceptionSeverity } from "@/types/enterprise";

interface ResolveExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  exceptionTitle: string;
  severity: ExceptionSeverity;
  requiresOtp?: boolean;
}

export function ResolveExceptionModal({
  isOpen,
  onClose,
  onConfirm,
  exceptionTitle,
  severity,
}: ResolveExceptionModalProps) {
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");
  const minLength = severity === "critical" ? 30 : 20;

  React.useEffect(() => {
    if (isOpen) {
      setNotes("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (notes.trim().length < minLength) {
      setError(`Resolution notes must be at least ${minLength} characters`);
      return;
    }
    onConfirm(notes.trim());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-brown-900">
                Resolve Exception
              </DialogTitle>
              <DialogDescription className="text-[12px] text-beige-500">
                {exceptionTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {severity === "critical" && (
            <div className="rounded-lg bg-gold-50 border border-gold-200 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gold-700">
                This is a critical exception. Detailed resolution notes are required for audit purposes (minimum {minLength} characters).
              </p>
            </div>
          )}

          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Resolution Notes <span className="text-danger">*</span>
              <span className="text-beige-400 font-normal ml-1">(min {minLength} characters)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setError("");
              }}
              placeholder="Describe how this exception was resolved..."
              className={cn(
                "w-full min-h-[100px] rounded-xl border bg-white/60 p-3 text-[13px] text-brown-800 placeholder:text-beige-400 transition-all resize-none",
                error
                  ? "border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-beige-200/60 focus:ring-2 focus:ring-brown-200/40 focus:border-brown-200/60 focus:bg-white/80"
              )}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className={cn("text-[11px]", error ? "text-danger" : "text-beige-400")}>
                {error || `${notes.length} characters`}
              </span>
              <span className={cn("text-[11px]", notes.length >= minLength ? "text-forest-600" : "text-beige-400")}>
                {notes.length >= minLength ? "✓ Valid" : `${minLength - notes.length} more needed`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={notes.trim().length < minLength}
            className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700"
          >
            Confirm Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
