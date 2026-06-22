"use client";

/**
 * SOW edit — spec doc 02 §5.C.7.
 *
 * Author-mode form populated from the active version. Save creates a
 * new draft version via useUpdateSowDraft; older versions are preserved
 * by the backend.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useSow, useUpdateSowDraft } from "@/lib/hooks/use-sow-v2";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { Skeleton } from "@/components/meridian";
import { canViewSowByConfidentiality } from "@/lib/sow/confidentiality-access";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import { primaryBtnClass, primaryStyle, secondaryBtnClass, GLASS_FIELD_STYLE } from "@/app/admin/_shell/aurora-ui";
import type { SowConfidentiality } from "@/lib/sow/types";

export default function SowEditPage() {
  const params = useParams<{ sowId: string }>();
  const router = useRouter();
  const sowId = params?.sowId ?? "";

  const { data: sow, isLoading } = useSow(sowId);
  const { roles, email, meLoading } = useEnterpriseAccess();
  const update = useUpdateSowDraft(sowId);

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [confidentiality, setConfidentiality] = React.useState<SowConfidentiality>("internal");
  const [changeNote, setChangeNote] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sow) return;
    setTitle(sow.title);
    setBody(sow.activeVersionDetail?.body ?? "");
    setConfidentiality(sow.confidentiality);
  }, [sow]);

  if (isLoading) {
    return <EditSkeleton />;
  }
  if (!sow) {
    return (
      <div className={cn(DASH_CARD, "px-4 py-10 text-center")}>
        <p className="font-body text-[13px] font-semibold text-foreground">
          SOW not found
        </p>
      </div>
    );
  }

  const payload = sow.activeVersionDetail?.payload ?? ({} as Record<string, unknown>);
  const canView = canViewSowByConfidentiality({
    confidentiality: sow.confidentiality,
    roles,
    actorEmail: email,
    ownerId: sow.ownerId,
    payload,
  });

  if (meLoading) {
    return <EditSkeleton />;
  }
  if (!canView) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Back to SOWs
        </Link>
        <div className="rounded-lg border border-warning-border bg-warning-subtle/40 px-4 py-10 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">
            Restricted SOW visibility
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary">
            You do not have access to edit this SOW.
          </p>
        </div>
      </div>
    );
  }

  const onSave = async () => {
    setSubmitError(null);
    if (!title.trim()) {
      setSubmitError("Title is required.");
      return;
    }
    try {
      await update.mutateAsync({
        title: title.trim(),
        body,
        confidentiality,
        changeNote: changeNote.trim() || undefined,
        payload: sow.activeVersionDetail?.payload ?? {},
      });
      router.push(`/enterprise/sow/${sow.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save draft");
    }
  };

  const editable = sow.status === "draft";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href={`/enterprise/sow/${sow.id}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span className="truncate max-w-[260px]">{sow.title}</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Edit</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Enterprise · SOW · v{sow.activeVersion}
        </p>
        <h1 className="font-display text-[22px] sm:text-[24px] font-semibold text-foreground tracking-[-0.02em] leading-tight">
          Edit SOW
        </h1>
        <p className="mt-1.5 font-body text-[13px] text-text-secondary">
          Saving creates a new draft version. Older versions are preserved.
        </p>
      </header>

      {!editable && (
        <div className="rounded-lg bg-warning-subtle border border-warning-border px-3 py-2 font-body text-[12.5px] text-warning-text">
          This SOW is in <strong>{sow.status}</strong> state — edits are
          disabled until it returns to draft.
        </div>
      )}

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <header className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Details</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Saving creates a new draft version. Older versions are preserved.</p>
        </header>
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <Field label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!editable}
              style={GLASS_FIELD_STYLE}
              className={cn(
                "w-full h-9 px-3 rounded-lg",
                "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            />
          </Field>

          <Field label="Confidentiality">
            <select
              value={confidentiality}
              onChange={(e) => setConfidentiality(e.target.value as SowConfidentiality)}
              disabled={!editable}
              style={GLASS_FIELD_STYLE}
              className={cn(
                "w-full h-9 px-2.5 rounded-lg appearance-none",
                "font-body text-[12.5px] text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </Field>

          <Field label="Body">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              disabled={!editable}
              style={GLASS_FIELD_STYLE}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg",
                "font-body text-[12.5px] text-foreground placeholder:text-text-disabled leading-relaxed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "resize-vertical",
              )}
            />
          </Field>

          <Field label="Change note">
            <input
              type="text"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Briefly describe what changed in this version"
              disabled={!editable}
              style={GLASS_FIELD_STYLE}
              className={cn(
                "w-full h-9 px-3 rounded-lg",
                "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            />
          </Field>

          {submitError && (
            <p className="font-body text-[12px] text-error-text">{submitError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Link
              href={`/enterprise/sow/${sow.id}`}
              className={secondaryBtnClass}
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={onSave}
              disabled={!editable || update.isPending}
              className={primaryBtnClass}
              style={primaryStyle}
            >
              <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {update.isPending ? "Saving…" : "Save as new draft"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && <span className="text-error-text normal-case tracking-normal"> *</span>}
      </label>
      {children}
    </div>
  );
}

function EditSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-6 w-72 rounded" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
