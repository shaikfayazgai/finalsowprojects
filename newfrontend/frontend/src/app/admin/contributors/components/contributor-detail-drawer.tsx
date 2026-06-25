"use client";

/**
 * Contributor detail — the document-verification surface.
 *
 * Slides in a Drawer showing the full profile (every wizard section) plus ALL
 * uploaded files as clickable links / thumbnails that open the stored Blob /
 * data URLs in a new tab, grouped + labelled by document type. Read-only.
 */

import * as React from "react";
import { ExternalLink, FileText, ShieldCheck, Paperclip } from "lucide-react";
import { Drawer } from "@/components/meridian/overlays";
import { cn } from "@/lib/utils/cn";
import type { ContributorFile, ContributorRecord } from "@/lib/api/admin-contributors";

const CATEGORY_ORDER: Array<{ key: ContributorFile["category"]; label: string }> = [
  { key: "identity", label: "Identity" },
  { key: "verification", label: "Verification documents" },
  { key: "portfolio", label: "Portfolio" },
  { key: "work", label: "Work uploads" },
  { key: "link", label: "Profile links" },
];

export function ContributorDetailDrawer({
  contributor,
  open,
  onClose,
}: {
  contributor: ContributorRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="xl"
      eyebrow="Contributor"
      appearance="gradient-glass"
      title={contributor?.name ?? "Contributor"}
      description={contributor?.email ?? undefined}
    >
      {contributor ? <DetailBody c={contributor} /> : null}
    </Drawer>
  );
}

function DetailBody({ c }: { c: ContributorRecord }) {
  const fmtDate = (v: string | null) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Identity / status summary */}
      <Section title="Overview">
        <FieldGrid>
          <Field label="Account ID" value={c.id} mono />
          <Field label="Role" value={c.role} />
          <Field label="Status" value={c.status} />
          <Field
            label="KYC"
            value={
              c.kycStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 text-success-text">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} /> Verified
                </span>
              ) : (
                c.kycStatus
              )
            }
          />
          <Field label="Phone" value={c.phone} />
          <Field label="Email verified" value={c.emailVerified ? "Yes" : "No"} />
          <Field label="Profile complete" value={c.profileCompleted ? "Yes" : "No"} />
          <Field label="Created" value={fmtDate(c.createdAt)} />
          <Field label="Last login" value={fmtDate(c.lastLoginAt)} />
        </FieldGrid>
      </Section>

      {/* Uploaded files — the verification surface */}
      <Section
        title="Uploaded documents & files"
        subtitle={`${c.fileCount} reference${c.fileCount === 1 ? "" : "s"}`}
      >
        {c.files.length === 0 ? (
          <p className="font-body text-[13px] text-text-tertiary">No uploaded files or links on record.</p>
        ) : (
          <div className="space-y-4">
            {CATEGORY_ORDER.map(({ key, label }) => {
              const group = c.files.filter((f) => f.category === key);
              if (group.length === 0) return null;
              return (
                <div key={key}>
                  <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
                    {label}
                  </p>
                  <ul className="space-y-1.5">
                    {group.map((f, i) => (
                      <FileLink key={`${key}-${i}`} file={f} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Basic info */}
      <Section title="Basic information">
        <FieldGrid>
          <Field label="First name" value={c.firstName} />
          <Field label="Last name" value={c.lastName} />
          <Field label="Country" value={c.country} />
          <Field label="State" value={c.state} />
          <Field label="City" value={c.city} />
          <Field label="Pincode" value={c.pincode} />
          <Field label="Timezone" value={c.timezone} />
          <Field label="Gender" value={c.gender} />
          <Field label="Languages" value={c.languages.length ? c.languages.join(", ") : null} />
        </FieldGrid>
      </Section>

      {/* Professional */}
      <Section title="Professional">
        <FieldGrid>
          <Field label="Job title" value={c.jobTitle} />
          <Field label="Career stage" value={c.careerStage} />
          <Field label="Years experience" value={c.yearsExperience} />
          <Field label="Availability" value={c.availability} />
          <Field label="Weekly hours" value={c.weeklyHours != null ? String(c.weeklyHours) : null} />
        </FieldGrid>
        {c.bio ? (
          <div className="mt-3">
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">Bio</p>
            <p className="font-body text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{c.bio}</p>
          </div>
        ) : null}
      </Section>

      {/* Skills & expertise */}
      <Section title="Skills & expertise">
        <ChipRow label="Primary skills" items={c.primarySkills} />
        <ChipRow label="Secondary skills" items={c.secondarySkills} />
        <ChipRow label="Other skills" items={c.otherSkills} />
        <ChipRow label="Expertise areas" items={c.expertiseAreas} />
        {c.skills.length ? (
          <div className="mt-3">
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
              Skill registry
            </p>
            <ul className="space-y-1">
              {c.skills.map((s, i) => (
                <li key={s.id ?? i} className="font-body text-[13px] text-text-secondary">
                  {s.name}
                  {s.level ? <span className="text-text-tertiary"> · {s.level}</span> : null}
                  {s.category ? <span className="text-text-tertiary"> · {s.category}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      {/* Portfolio projects */}
      {c.projects.length ? (
        <Section title="Portfolio projects" subtitle={`${c.projects.length}`}>
          <ul className="space-y-3">
            {c.projects.map((p, i) => (
              <li key={p.id ?? i} className="rounded-lg border border-stroke-subtle p-3 bg-surface/60">
                <p className="font-body text-[13.5px] font-semibold text-foreground">{p.title || "Untitled"}</p>
                {p.role ? <p className="font-body text-[12px] text-text-tertiary">{p.role}</p> : null}
                {p.description ? (
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-snug">{p.description}</p>
                ) : null}
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-text-link hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} /> Open project
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Experience */}
      {c.experience.length ? (
        <Section title="Work & experience">
          <ul className="space-y-2">
            {c.experience.map((e, i) => (
              <li key={e.id ?? i} className="font-body text-[13px] text-text-secondary">
                <span className="font-semibold text-foreground">{e.role || e.kind}</span>
                {e.organization ? <> · {e.organization}</> : null}
                {e.startDate || e.endDate ? (
                  <span className="text-text-tertiary">
                    {" "}
                    ({e.startDate ?? "?"} – {e.isCurrent ? "Present" : e.endDate ?? "?"})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Education */}
      {c.education.length ? (
        <Section title="Education">
          <ul className="space-y-2">
            {c.education.map((ed, i) => (
              <li key={ed.id ?? i} className="font-body text-[13px] text-text-secondary">
                <span className="font-semibold text-foreground">{ed.institution}</span>
                {ed.degree ? <> · {ed.degree}</> : null}
                {ed.field ? <> · {ed.field}</> : null}
                {ed.startYear || ed.endYear ? (
                  <span className="text-text-tertiary">
                    {" "}
                    ({ed.startYear ?? "?"} – {ed.endYear ?? "?"})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Verification & bank */}
      <Section title="Verification & banking">
        <FieldGrid>
          <Field label="ID type" value={c.verification.idType} />
          <Field label="ID number" value={c.verification.idNumber} />
          <Field label="LinkedIn" value={c.linkedin} />
          <Field label="Account holder" value={asStr(c.bank.accountHolderName)} />
          <Field label="Bank" value={asStr(c.bank.bankName)} />
          <Field label="Account number" value={asStr(c.bank.accountNumber)} />
          <Field label="IFSC" value={asStr(c.bank.ifscCode)} />
          <Field label="Account type" value={asStr(c.bank.accountType)} />
          <Field label="UPI ID" value={asStr(c.bank.upiId)} />
        </FieldGrid>
      </Section>
    </div>
  );
}

function asStr(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function FileLink({ file }: { file: ContributorFile }) {
  const isImage =
    file.type === "avatar" ||
    file.type === "portfolio_screenshot" ||
    (typeof file.url === "string" && file.url.startsWith("data:image"));

  if (file.openable && file.url) {
    return (
      <li>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          download={file.type === "avatar" ? undefined : true}
          className="flex items-center gap-2.5 rounded-lg border border-stroke-subtle px-3 py-2 bg-surface/60 hover:bg-bg-subtle/60 transition-colors group"
        >
          {isImage && file.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.label}
              className="h-9 w-9 rounded object-cover shrink-0 ring-1 ring-stroke-subtle"
            />
          ) : (
            <span className="grid place-items-center h-9 w-9 rounded bg-bg-subtle shrink-0">
              <FileText className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13px] font-medium text-foreground truncate group-hover:text-text-link">
              {file.label}
            </span>
            <span className="block font-mono text-[10.5px] text-text-tertiary truncate">{file.type}</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
        </a>
      </li>
    );
  }

  // Stored reference that isn't an openable URL (e.g. a filename the wizard
  // captured before real Blob upload was wired). Show it so the admin knows a
  // document was provided, even though it can't be opened directly here.
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-dashed border-stroke-subtle px-3 py-2">
      <span className="grid place-items-center h-9 w-9 rounded bg-bg-subtle shrink-0">
        <Paperclip className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-body text-[13px] font-medium text-foreground truncate">{file.label}</span>
        <span className="block font-mono text-[10.5px] text-text-tertiary truncate">
          {file.name || "uploaded (not openable)"}
        </span>
      </span>
    </li>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2.5">
        <h3 className="font-body text-[14px] font-semibold text-foreground">{title}</h3>
        {subtitle ? <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{subtitle}</span> : null}
      </div>
      {children}
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">{children}</dl>;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  const empty = value == null || value === "";
  return (
    <div className="min-w-0">
      <dt className="font-body text-[11px] font-medium text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "font-body text-[13px] truncate",
          empty ? "text-text-disabled" : "text-foreground",
          mono && "font-mono",
        )}
      >
        {empty ? "—" : value}
      </dd>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-2.5">
      <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span
            key={`${s}-${i}`}
            className="inline-flex items-center h-[24px] px-2.5 rounded-full bg-bg-subtle font-body text-[12px] text-text-secondary"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
