"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProfileStoreV3 } from "@/lib/stores/profile-store-v3";
import { useHydrated } from "@/lib/utils/use-hydrated";
import type { ProfileEditableState } from "@/types/profile";
import { IdentityCard } from "./components/identity-card";
import { ActivationCard } from "./components/activation-card";

type AvatarColor = ProfileEditableState["avatarColor"];

export default function EnterpriseOnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const hydrated = useHydrated();

  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setPendingOnboarding = useAuthStore((s) => s.setPendingOnboarding);

  const profileEditable = useProfileStoreV3((s) => s.editable);
  const replaceEditable = useProfileStoreV3((s) => s.replaceEditable);

  const [displayName, setDisplayName] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [avatarColor, setAvatarColor] = React.useState<AvatarColor>(
    profileEditable.avatarColor,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  // Prefill once hydrated — session takes precedence, fallback to existing
  // profile editable. Timezone auto-detects from the browser.
  React.useEffect(() => {
    if (!hydrated) return;
    setDisplayName(session?.user?.name || profileEditable.displayName);
    const detected =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "";
    setTimezone(detected || profileEditable.timezone);
    setAvatarColor(profileEditable.avatarColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const email = session?.user?.email || profileEditable.displayName || "operator@glimmora.ai";

  const commit = (destination: string) => {
    const trimmedName = displayName.trim() || profileEditable.displayName;
    const initials =
      trimmedName
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || profileEditable.initials;

    replaceEditable({
      ...profileEditable,
      displayName: trimmedName,
      initials,
      timezone: timezone.trim() || profileEditable.timezone,
      avatarColor,
    });
    setOnboardingComplete(true);
    setPendingOnboarding(false);
    setIsLoading(true);
    router.push(destination);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header — minimal chrome */}
      <header className="px-6 lg:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} aria-hidden />
          </div>
          <span className="font-body text-[14px] font-semibold text-foreground tracking-tight">
            GlimmoraTeam
          </span>
        </div>
        <p className="font-body text-[11.5px] font-semibold text-text-tertiary uppercase tracking-[0.1em]">
          Enterprise · Welcome
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 lg:px-10 py-6 sm:py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Hero */}
          <div className="text-center sm:text-left space-y-2">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)]">
              Welcome to the platform
            </p>
            <h1 className="font-body text-[28px] sm:text-[32px] font-semibold text-foreground tracking-[-0.02em] leading-[1.15]">
              {hydrated
                ? `Hi ${(displayName || session?.user?.name || "there").split(" ")[0]}, let's get you set up.`
                : "Let's get you set up."}
            </h1>
            <p className="font-body text-[13.5px] text-text-secondary leading-relaxed max-w-xl">
              GlimmoraTeam is the AI-governed workforce platform for enterprise
              SOWs, delivery, and acceptance. We just need a few seconds to
              confirm who you are, then we'll hand you the keys.
            </p>
          </div>

          {/* Identity */}
          {hydrated ? (
            <IdentityCard
              displayName={displayName}
              setDisplayName={setDisplayName}
              email={email}
              timezone={timezone}
              setTimezone={setTimezone}
              avatarColor={avatarColor}
              setAvatarColor={setAvatarColor}
            />
          ) : (
            <div className="h-60 rounded-xl bg-surface ring-1 ring-stroke-subtle animate-pulse" />
          )}

          {/* Activation */}
          {hydrated ? (
            <ActivationCard
              onDashboard={() => commit("/enterprise/dashboard")}
              onIntake={() => commit("/enterprise/sow/intake")}
              isLoading={isLoading}
            />
          ) : (
            <div className="h-44 rounded-xl bg-surface ring-1 ring-stroke-subtle animate-pulse" />
          )}

          {/* Trust footer */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-text-tertiary">
            <span className="inline-flex items-center gap-1.5 font-body text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
              256-bit encryption
            </span>
            <span className="text-text-disabled" aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5 font-body text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
              SOC 2 compliant
            </span>
            <span className="text-text-disabled" aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5 font-body text-[11px]">
              Every event audit-logged
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-10 py-4 border-t border-stroke-subtle">
        <p className="font-body text-[11px] text-text-tertiary text-center sm:text-left">
          You can revisit any of this from{" "}
          <span className="font-semibold text-text-secondary">Profile → Edit profile</span>{" "}
          and{" "}
          <span className="font-semibold text-text-secondary">Settings → Preferences</span>.
        </p>
      </footer>

      {/* Hidden image keeps Next/Image happy if we use a logo later */}
      <div className="hidden" aria-hidden>
        <Image src="/favicon.ico" alt="" width={1} height={1} />
      </div>
    </div>
  );
}
