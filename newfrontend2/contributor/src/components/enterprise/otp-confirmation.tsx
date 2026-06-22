"use client";

import * as React from "react";
import { Shield, KeyRound, Timer } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/stores/toast-store";

interface OTPConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  actionLabel: string;
  warningText?: string;
}

export function OTPConfirmation({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionLabel,
  warningText,
}: OTPConfirmationProps) {
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [countdown, setCountdown] = React.useState(30);
  const [canResend, setCanResend] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  /* Countdown timer for resend */
  React.useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  /* Reset state when opened */
  React.useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setIsVerifying(false);
      setCountdown(30);
      setCanResend(false);
      // Focus first input after dialog opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    // Focus last filled input or next empty
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Invalid OTP", "Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsVerifying(false);

    // Simulate successful verification
    onConfirm();
    onClose();
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setCountdown(30);
    setCanResend(false);
    toast.info("OTP Sent", "A new verification code has been sent to your email");
    inputRefs.current[0]?.focus();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-brown-900">{title}</DialogTitle>
              <DialogDescription className="text-[12px] text-beige-500">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {warningText && (
            <div className="rounded-lg bg-gold-50 border border-gold-200 p-3 mb-4">
              <p className="text-[11px] text-gold-700">{warningText}</p>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-[13px] font-medium text-brown-800 mb-2">
              Enter the 6-digit code sent to your email
            </p>
            <div className="flex items-center justify-center gap-2 text-[11px] text-beige-500">
              <Timer className="w-3.5 h-3.5" />
              <span>Code expires in 10 minutes</span>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={cn(
                  "w-10 h-12 text-center text-[18px] font-bold rounded-lg border transition-all",
                  digit
                    ? "border-brown-300 bg-brown-50 text-brown-800"
                    : "border-beige-200 bg-white text-brown-800"
                )}
              />
            ))}
          </div>

          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-[12px] text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                Resend OTP
              </button>
            ) : (
              <span className="text-[12px] text-beige-400">Resend OTP in {countdown}s</span>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={otp.join("").length !== 6 || isVerifying}
            className={cn(
              "flex-1 bg-gradient-to-r from-brown-500 to-brown-600 hover:from-brown-600 hover:to-brown-700",
              (otp.join("").length !== 6 || isVerifying) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                {actionLabel}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
