"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SettingsSectionHeader } from "../../_components/settings-section-header";
import {
  settingsPrimaryBtnCls,
  settingsRowCls,
  settingsSectionCls,
} from "../../lib/settings-ui-utils";
import { useAccountAuth } from "@/lib/hooks/use-account-auth";
import { providerLabel } from "@/lib/contributor/account-auth";
import { cn } from "@/lib/utils/cn";

type Provider = "google" | "microsoft";

const PROVIDER_COPY: Record<
  Provider,
  { label: string; description: string; signInHint: string }
> = {
  google: {
    label: "Google",
    description: "Sign in with Google · optional backup after you add a password",
    signInHint: "Use Sign in with Google on the login page.",
  },
  microsoft: {
    label: "Microsoft",
    description: "Sign in with Microsoft · optional backup after you add a password",
    signInHint: "Use Sign in with Microsoft on the login page.",
  },
};

export function ConnectedAccountsWorkspace() {
  const { data: session } = useSession();
  const accountAuth = useAccountAuth();
  const email = session?.user?.email ?? "";

  const connected = new Set(accountAuth.data?.connectedProviders ?? []);
  const authMode = accountAuth.data?.authMode;

  const rows: Provider[] = ["google", "microsoft"];

  return (
    <div className="space-y-5 pb-12">
      <SettingsSectionHeader
        sectionId="connected"
        description="Linked sign-in methods for this account. Enterprise SSO accounts are managed by your employer."
      />

      {authMode === "enterprise_sso" && (
        <p className="rounded-lg border border-stroke-subtle bg-surface-subtle px-4 py-3 font-body text-[12.5px] text-text-secondary">
          Internal employee accounts use company SSO only. Connected consumer accounts are not
          available for this profile.
        </p>
      )}

      <section className={settingsSectionCls}>
        <ul className="divide-y divide-stroke-subtle">
          {rows.map((id) => {
            const meta = PROVIDER_COPY[id];
            const isConnected = connected.has(id);
            return (
              <li key={id} className={settingsRowCls}>
                <div className="min-w-0">
                  <p className="font-body text-[13px] font-semibold text-foreground">
                    {meta.label}
                    {isConnected && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-success-subtle text-success-text font-body text-[10px] font-semibold">
                        Connected
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                    {isConnected && email ? (
                      <span className="font-mono">{email}</span>
                    ) : (
                      meta.description
                    )}
                  </p>
                </div>
                {authMode === "enterprise_sso" ? (
                  <span className="font-body text-[11.5px] text-text-tertiary shrink-0">
                    Not available
                  </span>
                ) : isConnected ? (
                  <span className="font-body text-[11.5px] text-text-tertiary shrink-0">
                    Primary sign-in
                  </span>
                ) : (
                  <Link
                    href="/auth/login"
                    className={cn(settingsPrimaryBtnCls, "no-underline inline-flex items-center")}
                  >
                    Connect via sign-in
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {authMode === "social_oauth" && (
        <p className="font-body text-[11.5px] text-text-tertiary max-w-[60ch]">
          To link an account, sign out and sign in again with {providerLabel("google")} or{" "}
          {providerLabel("microsoft")} using the same email. You can also add a password under{" "}
          <Link href="/contributor/settings/account" className="text-brand hover:underline">
            Account
          </Link>{" "}
          as a backup.
        </p>
      )}
    </div>
  );
}
