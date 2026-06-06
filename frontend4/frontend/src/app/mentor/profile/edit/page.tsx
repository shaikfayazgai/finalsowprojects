"use client";

/**
 * Mentor profile edit — spec doc 03 §5.H.2.
 *
 * Editable: bio, avatar, languages, timezone, mentorship intro.
 * Non-editable (admin-only): name, competency, role.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Lock } from "lucide-react";
import {
  MentorBackLink,
  MentorFormSection,
  MentorPage,
  MentorPageHeader,
  MentorFilterChip,
  mentorFieldLabel,
  mentorInputCls,
  mentorPrimaryBtn,
  mentorSecondaryBtn,
  mentorTextareaCls,
} from "@/app/mentor/_components/mentor-ui";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Avatar, StatusChip } from "@/components/meridian";
import { patchMentorProfile } from "@/lib/api/mentor";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import { cn } from "@/lib/utils/cn";

const TIMEZONES = ["Asia/Kolkata", "Asia/Singapore", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Australia/Sydney", "Africa/Lagos"];
const LANGUAGE_OPTIONS = ["English", "Hindi", "Tamil", "French", "Spanish", "Portuguese", "Arabic"];

export default function MentorProfileEditPage() {
  return (
    <React.Suspense fallback={<div className="h-4 w-48 rounded bg-bg-subtle animate-pulse" />}>
      <MentorProfileEditInner />
    </React.Suspense>
  );
}

function MentorProfileEditInner() {
  const router = useRouter();
  const { profile, refresh } = useActiveMentor();
  const [bio, setBio] = React.useState(profile.bio);
  const [intro, setIntro] = React.useState(profile.mentorshipIntro);
  const [languages, setLanguages] = React.useState<string[]>(profile.languages);
  const [timezone, setTimezone] = React.useState(profile.timezone);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const toggleLang = (l: string) => setLanguages((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l]);

  const onSave = async () => {
    setSaving(true);
    try {
      await patchMentorProfile({ bio, mentorshipIntro: intro, languages, timezone });
      refresh();
      setSaved(true);
      setTimeout(() => router.push("/mentor/profile"), 900);
    } catch {
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <MentorPage>
      <MentorBackLink href="/mentor/profile">Back to profile</MentorBackLink>
      <MentorPageHeader
        title="Edit profile"
        subtitle="Update what contributors see. Role and competency are managed by your program admin."
      />

      <DashboardSection
        title="Admin-set fields"
        description="Managed by Glimmora — contact your program manager to change"
        actions={
          <StatusChip status="neutral" size="sm">
            <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
            Not editable
          </StatusChip>
        }
      >
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Name">{profile.displayName}</Field>
          <Field label="Role">
            <span className="capitalize">{profile.role.replace(".", " ")}</span>
          </Field>
          <Field label="Competency">{profile.competency.length} skills assigned</Field>
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <MentorFormSection title="Your details" description="Visible on your mentor profile and session cards">
          <div className="space-y-5">
            <Field label="Avatar">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar initials={profile.avatarInitials} size="xl" tone="brand" />
                <button type="button" className={mentorSecondaryBtn}>
                  <Camera className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Upload photo
                </button>
                <p className="font-body text-[11px] text-text-tertiary">PNG / JPG, max 2 MB.</p>
              </div>
            </Field>

            <Field label="Bio">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={400} className={mentorTextareaCls} />
              <p className="mt-1 font-mono text-[10.5px] text-text-tertiary tabular-nums">{bio.length} / 400</p>
            </Field>

            <Field label="Mentorship intro (shown to contributors)">
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} maxLength={300} className={mentorTextareaCls} />
              <p className="mt-1 font-mono text-[10.5px] text-text-tertiary tabular-nums">{intro.length} / 300</p>
            </Field>

            <Field label="Languages">
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGE_OPTIONS.map((l) => (
                  <MentorFilterChip
                    key={l}
                    selected={languages.includes(l)}
                    onClick={() => toggleLang(l)}
                  >
                    {l}
                  </MentorFilterChip>
                ))}
              </div>
            </Field>

            <Field label="Timezone">
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={cn(mentorInputCls, "max-w-[280px]")}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </Field>

            {saved && (
              <div className="flex items-center gap-2 rounded-xl bg-success-subtle border border-success-border px-3 py-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-text" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12px] text-success-text">Saved. Returning to profile…</p>
              </div>
            )}
          </div>
        </MentorFormSection>

        <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/40">
          <Link href="/mentor/profile" className={mentorSecondaryBtn}>Cancel</Link>
          <button type="button" onClick={onSave} disabled={saving} className={mentorPrimaryBtn}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </section>
    </MentorPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={mentorFieldLabel}>{label}</label>
      <div className="font-body text-[13px] text-foreground">{children}</div>
    </div>
  );
}
