"use client";

/**
 * Invite-link generator — used on partner detail pages to produce a
 * signed referral URL the partner can email to incoming contributors.
 *
 * The URL form is /auth/register?ref={orgId}&track={track}. When a
 * candidate clicks it, the register page reads the params and pre-fills
 * the track + shows the partner orgChip, then persists the linkage on
 * submit.
 */

import * as React from "react";
import { Copy, Check, Mail, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface InviteLinkCardProps {
  orgId: string;
  orgName: string;
  track: "student" | "women_wf";
  contactEmail?: string;
  readOnly?: boolean;
}

export function InviteLinkCard({ orgId, orgName, track, contactEmail, readOnly }: InviteLinkCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const link = `${origin}/auth/register?ref=${encodeURIComponent(orgId)}&track=${track}`;
  const trackLabel = track === "student" ? "students" : "women-workforce candidates";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  const mailtoBody = encodeURIComponent(
    `Hi,\n\nYou've been invited to join ${orgName}'s GlimmoraTeam cohort. Click the link below to set up your account — it pre-fills your affiliation so we route you to the right onboarding track.\n\n${link}\n\nQuestions? Reply to this email.\n\n— ${orgName} & GlimmoraTeam`
  );
  const mailtoSubject = encodeURIComponent(`${orgName} · GlimmoraTeam invitation`);
  const mailtoHref = contactEmail
    ? `mailto:${contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`
    : `mailto:?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <section className="rounded-lg border border-brand-border bg-brand-subtle/40 shadow-xs">
      <header className="px-4 py-2.5 border-b border-brand-border/60">
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">Invite link</h2>
        <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
          Share this URL with {trackLabel} from {orgName}. It pre-fills the registration form with their affiliation.
        </p>
      </header>
      <div className="p-4 space-y-2.5">
        <div className="flex items-stretch gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 h-9 px-3 rounded-md border border-stroke bg-surface font-mono text-[11.5px] text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            aria-label="Referral URL"
          />
          <button
            type="button"
            onClick={copy}
            disabled={readOnly || !origin}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-md font-body text-[12.5px] font-semibold shadow-xs transition-colors duration-fast shrink-0",
              readOnly
                ? "bg-bg-subtle text-text-tertiary cursor-not-allowed border border-stroke"
                : copied
                  ? "bg-success-subtle text-success-text border border-success-border"
                  : "bg-foreground text-surface hover:bg-foreground/90"
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!readOnly && (
            <>
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke shadow-xs font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
              >
                <Mail className="h-3 w-3" strokeWidth={2} aria-hidden />
                Open email draft
              </a>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke shadow-xs font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
              >
                <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
                Preview as candidate
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
