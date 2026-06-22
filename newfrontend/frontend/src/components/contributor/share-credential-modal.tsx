"use client";

/**
 * Share credential modal — spec doc 01 §5.M.3.
 * Public link + Copy + Email/LinkedIn/Twitter buttons + Revoke link.
 */

import * as React from "react";
import { X, Copy, Check, Mail, Linkedin, Twitter, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  shareId: string;
  title: string;
  open: boolean;
  onClose: () => void;
};

export function ShareCredentialModal({ shareId, title, open, onClose }: Props) {
  const [copied, setCopied] = React.useState(false);
  const [revoked, setRevoked] = React.useState(false);

  const url = React.useMemo(() => {
    if (typeof window === "undefined") return `/public/credentials/${shareId}`;
    return `${window.location.origin}/public/credentials/${shareId}`;
  }, [shareId]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  const subject = encodeURIComponent(`Credential: ${title}`);
  const body = encodeURIComponent(`I'd like to share a verified credential with you:\n\n${url}`);
  const mailto = `mailto:?subject=${subject}&body=${body}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Verified credential — ${title}`)}`;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center px-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-cred-heading"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-[1px]"
      />
      <section className="relative w-full max-w-[520px] rounded-lg border border-stroke bg-surface shadow-md">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stroke-subtle">
          <h2 id="share-cred-heading" className="font-body text-[14px] font-semibold text-foreground">
            Share credential
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-text-tertiary hover:bg-bg-subtle hover:text-foreground transition-colors duration-fast"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <p className="font-body text-[12px] text-text-secondary truncate">
            <span className="text-text-tertiary">For: </span>
            <span className="text-foreground font-medium">{title}</span>
          </p>

          <div>
            <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
              Public link
            </label>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={revoked ? "Revoked" : url}
                aria-label="Public credential URL"
                className={cn(
                  "flex-1 min-w-0 h-9 px-3 rounded-md bg-bg-subtle border border-stroke font-mono text-[11.5px]",
                  revoked ? "text-text-disabled italic" : "text-foreground",
                )}
              />
              <button
                type="button"
                onClick={onCopy}
                disabled={revoked}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Copy</>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Channel href={mailto} icon={Mail} label="Email" disabled={revoked} />
            <Channel href={linkedin} icon={Linkedin} label="LinkedIn" disabled={revoked} external />
            <Channel href={twitter} icon={Twitter} label="Twitter / X" disabled={revoked} external />
          </div>

          <div className="rounded-md bg-bg-subtle border border-stroke-subtle px-3 py-2 flex items-start gap-2">
            <span aria-hidden className="font-mono text-[11px] text-text-tertiary leading-5">⚙</span>
            <p className="font-body text-[11.5px] text-text-secondary leading-snug">
              Privacy: <span className="text-foreground font-medium">anyone with the link can view</span>.
              {!revoked && " Revoke to invalidate immediately."}
            </p>
          </div>

          {revoked && (
            <p className="font-body text-[11.5px] text-error-text">
              Link revoked (mock). New shares would require re-issuing.
            </p>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle">
          <button
            type="button"
            onClick={() => setRevoked(true)}
            disabled={revoked}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md font-body text-[12.5px] font-semibold text-error-text hover:bg-error-subtle transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Revoke link
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-brand text-on-brand shadow-xs font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}

function Channel({
  href,
  icon: Icon,
  label,
  disabled,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  label: string;
  disabled?: boolean;
  external?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-bg-subtle border border-stroke-subtle font-body text-[12px] font-semibold text-text-disabled cursor-not-allowed">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {label}
    </a>
  );
}
