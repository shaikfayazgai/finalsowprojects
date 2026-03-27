"use client";

import * as React from "react";
import { Pause, ShieldAlert, AlertTriangle } from "lucide-react";
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

interface ActionValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  type: "hold" | "escalate";
  projectTitle: string;
}

export function ActionValidationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  projectTitle,
}: ActionValidationModalProps) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const minLength = 20;

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (reason.trim().length < minLength) {
      setError(`Reason must be at least ${minLength} characters`);
      return;
    }
    onConfirm(reason);
    onClose();
  };

  const isHold = type === "hold";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                isHold ? "bg-beige-500" : "bg-danger"
              )}
            >
              {isHold ? <Pause className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-brown-900">
                {isHold ? "Put Project on Hold" : "Raise Escalation"}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-beige-500">
                {projectTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="rounded-lg bg-gold-50 border border-gold-200 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gold-700">
              {isHold
                ? "This action will pause all project activities. A reason is required for audit purposes."
                : "This action will escalate the project for immediate governance attention. A detailed reason is required."}
            </p>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Reason <span className="text-danger">*</span>
              <span className="text-beige-400 font-normal ml-1">(min {minLength} characters)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder={isHold ? "Explain why this project needs to be put on hold..." : "Describe the issue requiring escalation..."}
              className={cn(
                "w-full min-h-[100px] rounded-xl border bg-white/60 p-3 text-[13px] text-brown-800 placeholder:text-beige-400 transition-all resize-none",
                error
                  ? "border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-beige-200/60 focus:ring-2 focus:ring-brown-200/40 focus:border-brown-200/60 focus:bg-white/80"
              )}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className={cn("text-[11px]", error ? "text-danger" : "text-beige-400")}>
                {error || `${reason.length} characters`}
              </span>
              <span
                className={cn(
                  "text-[11px]",
                  reason.length >= minLength ? "text-forest-600" : "text-beige-400"
                )}
              >
                {reason.length >= minLength ? "✓ Valid" : `${minLength - reason.length} more needed`}
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
            disabled={reason.trim().length < minLength}
            className={cn(
              "flex-1",
              isHold
                ? "bg-beige-500 hover:bg-beige-600"
                : "bg-gradient-to-r from-danger to-danger-dark hover:opacity-90"
            )}
          >
            {isHold ? "Put on Hold" : "Escalate Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
