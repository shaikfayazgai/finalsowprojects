"use client";

/**
 * Per-contributor invite actions on the women workforce cohort table.
 */

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Check, Mail, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { apiCall, ApiError } from "@/lib/api/client";
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
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");

  // Women-workforce contributors are provisioned via the credentials flow:
  // backend emails their email + temp password + contributor login URL, forces
  // a reset on first login, then they land on contributor onboarding.
  async function sendCredentials() {
    if (readOnly || state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const [firstName, ...rest] = (contributor.name || contributor.email).split(" ");
      await apiCall("/api/superadmin/users", {
        method: "POST",
        token,
        body: JSON.stringify({
          email: contributor.email,
          firstName,
          lastName: rest.join(" "),
          role: "contributor",
          department: "women",
          sendCredentials: true,
        }),
      });
      markWWContributorInviteSent(partner.id, contributor.id);
      setState("sent");
      onSent?.(`Credentials emailed to ${contributor.name}.`);
    } catch (e) {
      setState("idle");
      onSent?.(e instanceof ApiError ? e.message : "Could not send credentials.");
    }
  }

  if (contributor.status === "invited") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={readOnly || state === "sending" || state === "sent"}
          onClick={sendCredentials}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2 rounded-md font-body text-[11px] font-semibold transition-colors duration-fast disabled:opacity-60",
            state === "sent"
              ? "border border-success-border bg-success-subtle text-success-text"
              : "bg-brand text-on-brand hover:bg-brand-hover",
          )}
        >
          {state === "sending" ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : state === "sent" ? (
            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          ) : (
            <Mail className="h-3 w-3" strokeWidth={2} aria-hidden />
          )}
          {state === "sending" ? "Sending…" : state === "sent" ? "Sent" : "Send credentials"}
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
