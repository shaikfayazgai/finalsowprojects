"use client";

import Link from "next/link";
import { AccountPasswordSection } from "@/components/enterprise/account-security/account-password-section";
import {
  SettingsFormPanel,
  SettingsSubpageShell,
} from "@/app/mentor/settings/_components/settings-subpage-shell";

export default function MentorSettingsAccountPage() {
  return (
    <SettingsSubpageShell
      title="Account"
      subtitle="Sign-in credentials you control. Your mentor role and competency are managed by Glimmora."
    >
      <SettingsFormPanel>
        <AccountPasswordSection description="Update the password you use to sign in to the mentor workspace." />
      </SettingsFormPanel>
      <p className="font-body text-[11.5px] text-text-tertiary">
        Forgot your password while signed out? Use{" "}
        <Link href="/auth/forgot-password" className="text-brand font-semibold hover:underline">
          forgot password
        </Link>{" "}
        on the sign-in page.
      </p>
    </SettingsSubpageShell>
  );
}
