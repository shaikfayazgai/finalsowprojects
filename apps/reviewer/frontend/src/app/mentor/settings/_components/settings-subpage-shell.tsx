"use client";

import Link from "next/link";
import { MentorBackLink, MentorPage, MentorPageHeader } from "@/app/mentor/_components/mentor-ui";

export function SettingsSubpageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <MentorPage>
      <MentorBackLink href="/mentor/settings">Back to settings</MentorBackLink>
      <MentorPageHeader title={title} subtitle={subtitle} />
      {children}
    </MentorPage>
  );
}

export function SettingsFormPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      {children}
    </section>
  );
}

export function SettingsFormFooter({
  onSave,
  saving,
  saved,
  saveLabel = "Save changes",
}: {
  onSave: () => void;
  saving?: boolean;
  saved?: boolean;
  saveLabel?: string;
}) {
  return (
    <footer className="flex items-center justify-between gap-3 px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/40">
      <Link
        href="/mentor/settings"
        className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
      >
        Back to settings
      </Link>
      <div className="flex items-center gap-3">
        {saved && (
          <span className="font-body text-[12px] text-success-text font-semibold">Saved</span>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast disabled:opacity-50"
        >
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </footer>
  );
}
