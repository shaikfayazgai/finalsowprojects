"use client";

/**
 * Per-contributor invite actions on the women workforce cohort table.
 */

import * as React from "react";
import Link from "next/link";
import { Copy, Check, Mail, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  buildWWContributorInviteMailto,
  buildWWContributorInviteUrl,
} from "@/lib/admin/ww-contributor-invite";
import { markWWContributorInviteSent } from "@/lib/admin/mocks/partnerships-service";
import type { MockWWContributor, MockWWPartner } from "@/mocks/admin/partnerships";

export function WWContributorInviteActions({
  partner,
  contributor,
  readOnly,
  onSent,
}: {
  partner: MockWWPartner;
  contributor: MockWWContributor;
  readOnly?: boolean;
  onSent?: (msg: string) => void;
}) {
  const [origin, setOrigin] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin
    ? buildWWContributorInviteUrl(origin, partner.id, contributor.inviteToken)
    : "";

  function recordSent() {
    markWWContributorInviteSent(partner.id, contributor.id);
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      recordSent();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onSent?.("Personal invite link copied.");
    } catch {
      onSent?.("Couldn't copy — select the link manually.");
    }
  }

  function sendInvite() {
    if (!inviteUrl || readOnly) return;
    recordSent();
    const mailto = buildWWContributorInviteMailto({
      contributorName: contributor.name,
      contributorEmail: contributor.email,
      partnerName: partner.name,
      inviteUrl,
      fromEmail: partner.leadContact.email,
    });
    window.location.href = mailto;
    onSent?.(`Invite email opened for ${contributor.name}.`);
  }

  if (contributor.status === "invited") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={readOnly || !origin}
          onClick={sendInvite}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2 rounded-md font-body text-[11px] font-semibold transition-colors duration-fast",
            readOnly
              ? "text-text-tertiary cursor-not-allowed"
              : "bg-brand text-on-brand hover:bg-brand-hover",
          )}
        >
          <Mail className="h-3 w-3" strokeWidth={2} aria-hidden />
          Send invite
        </button>
        <button
          type="button"
          disabled={readOnly || !origin}
          onClick={copyLink}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2 rounded-md border font-body text-[11px] font-semibold transition-colors duration-fast",
            copied
              ? "border-success-border bg-success-subtle text-success-text"
              : "border-stroke bg-surface text-foreground hover:bg-surface-hover",
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" strokeWidth={2} aria-hidden />
              Copy link
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-body text-[11px] text-text-tertiary">
        {contributor.registeredAt
          ? `Registered ${new Date(contributor.registeredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
          : "—"}
      </span>
      {(contributor.status === "onboarding" || contributor.status === "active") && (
        <Link
          href={`/admin/kyc?track=Women%20WF&email=${encodeURIComponent(contributor.email)}`}
          className="inline-flex items-center gap-1 font-body text-[11px] font-semibold text-brand-emphasis hover:text-brand"
        >
          KYC <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
        </Link>
      )}
    </div>
  );
}
