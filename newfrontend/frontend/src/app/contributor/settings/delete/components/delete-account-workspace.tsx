"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  settingsFieldLabelCls,
  settingsSectionCls,
  settingsSectionFooterCls,
} from "../../lib/settings-ui-utils";
import { cn } from "@/lib/utils/cn";

export function DeleteAccountWorkspace() {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const canDelete = confirm.trim() === "DELETE" && !submitting;

  const onSubmit = async () => {
    if (!canDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contributor/account/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "contributor self-service deletion request" }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setDone(true);
      setTimeout(() => router.push("/contributor/settings"), 2200);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="pb-12 animate-fade-in flex justify-center">
        <section className={cn(settingsSectionCls, "w-full max-w-[480px]")}>
          <div className="px-6 py-8 text-center">
            <div
              className="mx-auto h-12 w-12 rounded-full bg-success-subtle flex items-center justify-center mb-3"
              aria-hidden
            >
              <CheckCircle2 className="h-6 w-6 text-success-text" strokeWidth={2} />
            </div>
            <h1 className="font-body text-[18px] font-semibold text-foreground tracking-[-0.01em]">
              Deletion scheduled
            </h1>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Your account will be deleted in 30 days. Sign in any time before then to cancel.
            </p>
            <p className="mt-3 font-body text-[11.5px] text-text-tertiary italic">
              Returning to Settings…
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Delete your account?
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          This action schedules permanent deletion after a 30-day grace period.
        </p>
      </header>

      <section className={cn(settingsSectionCls, "border-error-border")}>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="h-4 w-4 text-error-text shrink-0 mt-0.5"
              strokeWidth={2}
              aria-hidden
            />
            <div>
              <p className="font-body text-[13px] font-semibold text-foreground">This will:</p>
              <ul className="mt-1 space-y-1 font-body text-[12.5px] text-text-secondary list-disc pl-5">
                <li>Cancel any pending withdrawals</li>
                <li>Make your credentials un-shareable</li>
                <li>Remove you from all active tasks</li>
              </ul>
            </div>
          </div>

          <div className="rounded-md bg-bg-subtle border border-stroke-subtle px-4 py-3 space-y-1.5">
            <p className="font-body text-[12px] text-text-secondary">
              Some data is retained for audit and legal reasons.
            </p>
            <p className="font-body text-[12px] text-text-secondary">
              Your data will be deleted in{" "}
              <span className="font-semibold text-foreground">30 days</span>. You can cancel until
              then by logging in.
            </p>
          </div>

          <div>
            <label className={settingsFieldLabelCls}>
              Type <span className="font-mono">DELETE</span> to confirm
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full h-9 px-3 rounded-md bg-surface border border-stroke font-mono text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-error-border focus-visible:ring-2 focus-visible:ring-error/25"
            />
          </div>
        </div>
        <footer className={settingsSectionFooterCls}>
          <Link
            href="/contributor/settings/privacy"
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md",
              "bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground",
              "hover:bg-surface-hover transition-colors duration-fast",
            )}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canDelete}
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md",
              "bg-error-emphasis text-[var(--color-on-primary)] font-body text-[13px] font-semibold",
              "hover:opacity-90 transition-opacity duration-fast",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {submitting ? "Scheduling…" : "Delete account"}
          </button>
        </footer>
      </section>
    </div>
  );
}
