"use client";

/**
 * Edit profile form — matches payout-method / new-ticket workroom pattern.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Globe,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { PERSONAS } from "@/mocks/contributor/personas";
import { cn } from "@/lib/utils/cn";

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const BIO_MAX = 300;

const inputCls = cn(
  "w-full h-9 px-3 rounded-md bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

function initialsFromName(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileEditView() {
  const router = useRouter();
  const { persona, profile: personaProfile, isLoading } = useActivePersona();

  const [email, setEmail] = React.useState(personaProfile.email);
  const [avatarFallback, setAvatarFallback] = React.useState(personaProfile.avatarInitials);
  const [name, setName] = React.useState(personaProfile.displayName);
  const [bio, setBio] = React.useState("");
  const [country, setCountry] = React.useState(personaProfile.country);
  const [timezone, setTimezone] = React.useState(personaProfile.timezone);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setEmail(personaProfile.email);
    setAvatarFallback(personaProfile.avatarInitials);
    setName(personaProfile.displayName);
    setCountry(personaProfile.country);
    setTimezone(personaProfile.timezone);
  }, [personaProfile]);

  const avatarInitials = initialsFromName(name, avatarFallback);
  const personaLabel = PERSONAS.find((p) => p.key === persona)?.shortLabel ?? persona;
  const canSave = name.trim().length > 0 && !saving && !isLoading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/contributor/profile"), 900);
  };

  if (isLoading) {
    return (
      <div className="pb-12 space-y-4">
        <div className="h-64 rounded-xl border border-stroke-subtle bg-surface animate-pulse" />
        <div className="h-40 rounded-xl border border-stroke-subtle bg-surface animate-pulse hidden xl:block" />
      </div>
    );
  }

  return (
    <div className="pb-12">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6 xl:items-start space-y-4 xl:space-y-0"
      >
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-stroke-subtle">
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Public identity
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Shown on your profile and in mentor-facing task context.
            </p>
          </div>

          <div className="p-5 space-y-5">
            <Field label="Profile photo">
              <div className="flex flex-wrap items-center gap-4">
                <div
                  aria-hidden
                  className="h-16 w-16 rounded-full bg-brand text-on-brand inline-flex items-center justify-center font-body text-[18px] font-semibold shrink-0 ring-4 ring-surface shadow-sm"
                >
                  {avatarInitials}
                </div>
                <div className="space-y-2 min-w-0">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-dashed border-stroke text-text-secondary hover:text-foreground hover:border-stroke-strong font-body text-[12px] font-semibold transition-colors duration-fast"
                  >
                    <Camera className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Upload photo
                  </button>
                  <p className="font-body text-[11px] text-text-tertiary">
                    PNG or JPG, max 2 MB. Falls back to initials if no photo is set.
                  </p>
                </div>
              </div>
            </Field>

            <Field label="Display name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your full name"
                className={inputCls}
              />
            </Field>

            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                rows={4}
                maxLength={BIO_MAX}
                placeholder="A short paragraph about your focus and the work you do best."
                className={cn(inputCls, "h-auto py-2.5 resize-y min-h-[100px]")}
              />
              <p className="mt-1.5 flex items-center justify-between gap-2 font-body text-[11px] text-text-tertiary">
                <span>One paragraph — keep it factual and professional.</span>
                <span className="font-mono tabular-nums shrink-0">
                  {bio.length} / {BIO_MAX}
                </span>
              </p>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Country">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputCls}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Timezone">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={inputCls}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Email">
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  value={email}
                  readOnly
                  className={cn(inputCls, "pl-9 bg-bg-subtle text-text-secondary cursor-not-allowed")}
                  aria-describedby="email-hint"
                />
              </div>
              <p id="email-hint" className="mt-1.5 font-body text-[11px] text-text-tertiary">
                Change your login email in{" "}
                <Link href="/contributor/settings/account" className="text-text-link hover:underline font-medium">
                  Account settings
                </Link>
                .
              </p>
            </Field>

            <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/50 px-4 py-3 flex items-start gap-3">
              <User className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[12px] text-text-secondary leading-relaxed">
                Contributor track:{" "}
                <span className="font-semibold text-foreground">{personaLabel}</span>
                <span aria-hidden className="opacity-40 mx-1.5">·</span>
                Track type is set during onboarding and affects dashboard modules.
              </p>
            </div>

            {saved ? (
              <div className="flex items-center gap-2 rounded-md bg-success-subtle border border-success-border px-3 py-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-text shrink-0" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12px] text-success-text">Saved. Returning to profile…</p>
              </div>
            ) : null}
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/60">
            <Link
              href="/contributor/profile"
              className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSave}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
                "bg-brand text-on-brand font-body text-[13px] font-semibold",
                "hover:bg-brand-hover transition-colors duration-fast",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <h3 className="font-body text-[13px] font-semibold text-foreground">What others see</h3>
            <ul className="mt-3 space-y-2.5">
              <InfoRow
                icon={User}
                text="Display name and bio appear on your profile and in mentor task context."
              />
              <InfoRow
                icon={Globe}
                text="Country and timezone help match you to tasks and schedule check-ins."
              />
              <InfoRow
                icon={Lock}
                text="Email and legal name changes require account settings or KYC review."
              />
            </ul>
          </div>

          <div className="rounded-xl border border-brand/20 bg-brand-subtle/30 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-brand-subtle-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[11.5px] text-brand-subtle-text leading-relaxed">
                Keep your display name aligned with KYC records for payout verification. Major
                name changes may require re-verification.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-2">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Related settings</h3>
            <Link
              href="/contributor/settings/account"
              className="block font-body text-[12px] font-semibold text-text-link hover:underline"
            >
              Account & login →
            </Link>
            <Link
              href="/contributor/settings/privacy"
              className="block font-body text-[12px] font-semibold text-text-link hover:underline"
            >
              Privacy preferences →
            </Link>
            <Link
              href="/contributor/profile/skills"
              className="block font-body text-[12px] font-semibold text-text-link hover:underline"
            >
              Manage skills →
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required ? <span className="text-error-text ml-0.5">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <span className="font-body text-[11.5px] text-text-secondary leading-relaxed">{text}</span>
    </li>
  );
}
